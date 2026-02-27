/**
 * 既存契約者のサブスクリプションプランIDをレガシープランに更新
 * 
 * 実行方法:
 * node scripts/migration/update-legacy-subscriptions.js
 */

const admin = require("firebase-admin");
const path = require("path");

// サービスアカウントキーを読み込み
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

// Firebase Admin を初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Pay.jp SDK
const payjp = require("payjp")(process.env.PAYJP_SECRET_KEY);

async function updateLegacySubscriptions() {
  try {
    console.log("既存契約者のデータ移行を開始します...\n");

    // 全ユーザーのサブスクリプション情報を取得
    const usersSnapshot = await db.collection("users").get();
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const subscriptionRef = db.collection("users").doc(userId).collection("subscription").doc("current");
      const subscriptionDoc = await subscriptionRef.get();

      if (!subscriptionDoc.exists) {
        console.log(`ユーザー ${userId}: サブスクリプション情報なし（スキップ）`);
        skippedCount++;
        continue;
      }

      const subscriptionData = subscriptionDoc.data();
      const currentPlanId = subscriptionData.subscriptionPlanId;
      const payjpId = subscriptionData.payjpId;
      const payjpType = subscriptionData.payjpType;

      // 既にレガシープランIDの場合はスキップ
      if (currentPlanId && currentPlanId.includes("_legacy")) {
        console.log(`ユーザー ${userId}: 既にレガシープラン（${currentPlanId}）`);
        skippedCount++;
        continue;
      }

      try {
        let isLegacy = false;
        let actualPrice = null;

        // Pay.jpから実際の契約情報を取得して価格を確認
        if (payjpType === "subscription" && payjpId) {
          // サブスクリプションの場合
          const subscription = await payjp.subscriptions.retrieve(payjpId);
          const planId = subscription.plan?.id || subscription.plan;
          
          console.log(`ユーザー ${userId}: サブスクリプションID ${payjpId}, プランID ${planId}`);
          
          // 旧価格プラン (yearly_plan_980) の場合
          if (planId === "yearly_plan_980") {
            isLegacy = true;
            actualPrice = 980;
          }
        } else if (payjpType === "charge" && payjpId) {
          // チャージの場合
          const charge = await payjp.charges.retrieve(payjpId);
          actualPrice = charge.amount;
          
          console.log(`ユーザー ${userId}: チャージID ${payjpId}, 金額 ${actualPrice}円`);
          
          // 旧5年プラン (3920円) の場合
          if (actualPrice === 3920) {
            isLegacy = true;
          }
        }

        // レガシープランの場合、プランIDを更新
        if (isLegacy) {
          let newPlanId = currentPlanId;
          
          if (currentPlanId === "1year" && actualPrice === 980) {
            newPlanId = "1year_legacy";
          } else if (currentPlanId === "5year" && actualPrice === 3920) {
            newPlanId = "5year_legacy";
          }

          await subscriptionRef.update({
            subscriptionPlanId: newPlanId,
            actualPrice: actualPrice,
            migrated: true,
            migratedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`✅ ユーザー ${userId}: ${currentPlanId} → ${newPlanId} (${actualPrice}円) に更新しました`);
          updatedCount++;
        } else {
          console.log(`ユーザー ${userId}: 新価格プラン（更新不要）`);
          skippedCount++;
        }

      } catch (error) {
        console.error(`❌ ユーザー ${userId} の処理中にエラー:`, error.message);
        errorCount++;
      }
    }

    console.log("\n=== 移行完了 ===");
    console.log(`更新: ${updatedCount}件`);
    console.log(`スキップ: ${skippedCount}件`);
    console.log(`エラー: ${errorCount}件`);
    console.log(`合計: ${usersSnapshot.docs.length}件`);

  } catch (error) {
    console.error("移行処理中にエラーが発生しました:", error);
    throw error;
  }
}

// スクリプト実行
updateLegacySubscriptions()
  .then(() => {
    console.log("\n移行スクリプトが正常に完了しました");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n移行スクリプトでエラーが発生しました:", error);
    process.exit(1);
  });
