#!/usr/bin/env node

/**
 * バックフィルスクリプト v2: Pay.jp API からサブスクリプション状態を取得し、
 * Firestore の subscription/current と company_information を更新する
 *
 * 旧システムではサブスクリプション情報が Firestore に移行されていなかったため、
 * Pay.jp の実際のデータを元に復元する。
 *
 * ロジック:
 *   1. 全ユーザーを取得
 *   2. payjpCustomerId がある → Pay.jp API でサブスクリプションを確認
 *   3. アクティブなサブスクリプションがある → subscription/current を作成 + company_information 更新
 *   4. payjpCustomerId がない or サブスクがない → スキップ
 *
 * 使い方:
 *   PAYJP_SECRET_KEY=sk_live_xxx node scripts/migration/backfill-subscription-status.js
 *   PAYJP_SECRET_KEY=sk_live_xxx node scripts/migration/backfill-subscription-status.js --dry-run
 */

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const dryRun = process.argv.includes('--dry-run');

// Pay.jp Secret Key
const PAYJP_SECRET_KEY = process.env.PAYJP_SECRET_KEY;
if (!PAYJP_SECRET_KEY) {
  console.error('❌ PAYJP_SECRET_KEY 環境変数を設定してください。');
  console.error('   PAYJP_SECRET_KEY=sk_live_xxx node scripts/migration/backfill-subscription-status.js');
  process.exit(1);
}

const payjp = require('payjp')(PAYJP_SECRET_KEY);

// API レートリミット対策: リクエスト間隔(ms)
const API_DELAY = 200;
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function backfillFromPayjp() {
  console.log(dryRun ? '🔍 DRY RUN モード（実際の更新は行いません）\n' : '🚀 実行モード\n');

  // 全ユーザーを取得
  const usersSnap = await db.collection('users').get();
  console.log(`📥 ユーザー数: ${usersSnap.size} 件\n`);

  let activatedCount = 0;
  let noCustomerIdCount = 0;
  let noSubscriptionCount = 0;
  let noCompanyCount = 0;
  let errorCount = 0;
  let chargeOnlyCount = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const customerId = userData.payjpCustomerId;

    // payjpCustomerId がないユーザーはスキップ
    if (!customerId) {
      noCustomerIdCount++;
      continue;
    }

    try {
      // 企業情報を取得
      const companiesSnap = await db.collection('users').doc(userId).collection('company_information').get();
      if (companiesSnap.empty) {
        noCompanyCount++;
        continue;
      }

      // Pay.jp API でサブスクリプションを取得
      await sleep(API_DELAY);
      let customer;
      try {
        customer = await payjp.customers.retrieve(customerId);
      } catch (payjpError) {
        // 顧客が見つからない場合
        if (payjpError.status === 404) {
          console.log(`⬜ 顧客なし | ${userData.email || userId} | Pay.jp: ${customerId}`);
          noSubscriptionCount++;
          continue;
        }
        throw payjpError;
      }

      // 顧客のサブスクリプションを確認
      const customerSubs = customer.subscriptions?.data || [];
      
      // アクティブなサブスクリプションを探す
      const activeSub = customerSubs.find(s => 
        s.status === 'active' || s.status === 'trial'
      );

      // 一時停止中のサブスクリプション（キャンセル済みだが期間内）
      const pausedSub = customerSubs.find(s => 
        s.status === 'paused' || s.status === 'canceled'
      );

      let isActive = false;
      let expirationDate = null;
      let payjpId = null;
      let payjpType = null;
      let planId = null;
      let automaticRenewal = false;

      if (activeSub) {
        isActive = true;
        payjpId = activeSub.id;
        payjpType = 'subscription';
        automaticRenewal = true;
        
        // current_period_end がある場合はそれを使用
        if (activeSub.current_period_end) {
          expirationDate = new Date(activeSub.current_period_end * 1000);
        } else {
          // なければ1年後をデフォルト
          expirationDate = new Date();
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        }

        // プランIDを金額ベースで判定
        const planAmount = activeSub.plan?.amount;
        if (planAmount && planAmount <= 980) {
          planId = '1year_legacy';
        } else {
          planId = '1year';
        }
      } else if (pausedSub) {
        // キャンセル済みだが期間内の場合
        const periodEnd = pausedSub.current_period_end;
        if (periodEnd && new Date(periodEnd * 1000) > new Date()) {
          isActive = true;
          expirationDate = new Date(periodEnd * 1000);
          payjpId = pausedSub.id;
          payjpType = 'subscription';
          // paused = 一時停止（Pay.jpが自動更新を試みて失敗した状態）、canceled = ユーザーがキャンセル
          automaticRenewal = pausedSub.status === 'paused'; // paused は自動更新あり、canceled は自動更新なし

          const planAmount = pausedSub.plan?.amount;
          if (planAmount && planAmount <= 980) {
            planId = '1year_legacy';
          } else {
            planId = '1year';
          }
        }
      }

      // サブスクリプションがない場合、単発決済（charge）を確認
      if (!isActive && customerSubs.length === 0) {
        try {
          await sleep(API_DELAY);
          const charges = await payjp.charges.list({
            customer: customerId,
            limit: 1,
          });
          
          if (charges.data && charges.data.length > 0) {
            const lastCharge = charges.data[0];
            if (lastCharge.paid && !lastCharge.refunded) {
              // 最終課金から残り期間を推定（5年 or 10年プランの一括払い）
              const chargeDate = new Date(lastCharge.created * 1000);
              const amount = lastCharge.amount;
              
              let periodYears = 1;
              if (amount >= 30000) periodYears = 10;
              else if (amount >= 3900) periodYears = 5;
              
              const expDate = new Date(chargeDate);
              expDate.setFullYear(expDate.getFullYear() + periodYears);
              
              if (expDate > new Date()) {
                isActive = true;
                expirationDate = expDate;
                payjpId = lastCharge.id;
                payjpType = 'charge';
                automaticRenewal = false;
                chargeOnlyCount++;

                if (periodYears === 10) planId = '10year';
                else if (periodYears === 5) planId = amount <= 4900 ? '5year_legacy' : '5year';
                else planId = '1year';
              }
            }
          }
        } catch (chargeError) {
          // chargeの確認はベストエフォート
          console.warn(`  ⚠️  Charge確認失敗 (${userData.email}): ${chargeError.message}`);
        }
      }

      if (!isActive) {
        console.log(`⬜ Inactive | ${userData.email || userId} | サブスクリプションなし/期限切れ`);
        noSubscriptionCount++;
        continue;
      }

      // Firestore を更新
      const expirationTimestamp = admin.firestore.Timestamp.fromDate(expirationDate);
      const expStr = expirationDate.toISOString().split('T')[0];

      if (!dryRun) {
        // 1. subscription/current を作成
        await db.collection('users').doc(userId).collection('subscription').doc('current').set({
          subscriptionPlanId: planId,
          payjpId: payjpId,
          payjpType: payjpType,
          active: true,
          expirationDate: expirationTimestamp,
          automaticRenewalFlag: automaticRenewal,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // 2. company_information を更新
        const batch = db.batch();
        companiesSnap.docs.forEach(companyDoc => {
          batch.update(companyDoc.ref, {
            subscriptionActive: true,
            subscriptionExpiresAt: expirationTimestamp,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }

      const typeLabel = payjpType === 'subscription' ? '定期課金' : '一括払い';
      const renewLabel = automaticRenewal ? '自動更新あり' : '自動更新なし';
      console.log(`✅ Active | ${userData.email || userId} | 企業数: ${companiesSnap.size} | ${typeLabel} | ${renewLabel} | 有効期限: ${expStr}`);
      activatedCount += companiesSnap.size;

    } catch (error) {
      console.error(`❌ エラー (${userData?.email || userId}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Backfill Summary:');
  console.log(`   ✅ Active に設定      : ${activatedCount} 件`);
  console.log(`      うち一括払い       : ${chargeOnlyCount} 件`);
  console.log(`   ⬜ サブスクなし/期限切れ: ${noSubscriptionCount} 件`);
  console.log(`   ⏭️  PayJP顧客IDなし    : ${noCustomerIdCount} 件`);
  console.log(`   ⏭️  企業情報なし       : ${noCompanyCount} 件`);
  console.log(`   ❌ エラー             : ${errorCount} 件`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN のため実際の更新は行われていません。');
    console.log('   実行するには --dry-run を外してください。');
  }
}

backfillFromPayjp()
  .then(() => {
    console.log('\n🏁 完了');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
