#!/usr/bin/env node

/**
 * 修正スクリプト: subscriptionPlanId が '1year' になっているユーザーを
 * '5year_legacy' に修正する。
 * 
 * ¥3,960 の新プランはまだ開始されていない。
 * バックフィルで '1year' と分類された30件は、実際は5年一括払い ¥3,920 (5year_legacy)。
 * 原因: amount >= 4000 の判定で ¥3,920 が漏れ、periodYears=1 → planId='1year' になった。
 *
 * 修正内容:
 *   1. subscriptionPlanId: '1year' → '5year_legacy'
 *   2. expirationDate: 課金日+1年 → 課金日+5年 に再計算（Pay.jp charge のcreated使用）
 *   3. company_information の subscriptionExpiresAt も同期修正
 *
 * 使い方:
 *   PAYJP_SECRET_KEY=sk_live_xxx node scripts/migration/fix-plan-ids.js --dry-run
 *   PAYJP_SECRET_KEY=sk_live_xxx node scripts/migration/fix-plan-ids.js
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

// Pay.jp Secret Key（有効期限再計算に使用）
const PAYJP_SECRET_KEY = process.env.PAYJP_SECRET_KEY;
if (!PAYJP_SECRET_KEY) {
  console.error('❌ PAYJP_SECRET_KEY 環境変数を設定してください。');
  process.exit(1);
}
const payjp = require('payjp')(PAYJP_SECRET_KEY);

const API_DELAY = 200;
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fixPlanIds() {
  console.log(dryRun ? '🔍 DRY RUN モード\n' : '🚀 実行モード\n');

  const usersSnap = await db.collection('users').get();
  console.log(`📥 ユーザー数: ${usersSnap.size} 件\n`);

  // まず現在の分布を確認
  const planCounts = {};
  let fixCount = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();

    const subDoc = await db
      .collection('users')
      .doc(uid)
      .collection('subscription')
      .doc('current')
      .get();

    if (!subDoc.exists) continue;

    const sub = subDoc.data();
    const planId = sub.subscriptionPlanId || 'unknown';
    planCounts[planId] = (planCounts[planId] || 0) + 1;

    // '1year' → '5year_legacy' に修正 + 有効期限再計算
    if (planId === '1year') {
      let newExpirationDate = null;
      const chargeId = sub.payjpId;

      // Pay.jp charge から課金日を取得して +5年 で再計算
      if (chargeId && sub.payjpType === 'charge') {
        try {
          await sleep(API_DELAY);
          const charge = await payjp.charges.retrieve(chargeId);
          const chargeDate = new Date(charge.created * 1000);
          newExpirationDate = new Date(chargeDate);
          newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 5);
        } catch (e) {
          console.warn(`  ⚠️  charge取得失敗 (${chargeId}): ${e.message}`);
        }
      } else if (chargeId && sub.payjpType === 'subscription') {
        // サブスクリプションの場合は current_period_end を使用（そのままで良い可能性）
        // ただし金額が ¥3,920 付近ならこれも 5year_legacy
        try {
          await sleep(API_DELAY);
          const subscription = await payjp.subscriptions.retrieve(chargeId);
          const amount = subscription.plan?.amount;
          if (amount && amount >= 3900 && amount <= 4000) {
            // 5年一括のサブスクリプション扱い → 有効期限を再計算
            const startDate = new Date(subscription.start * 1000);
            newExpirationDate = new Date(startDate);
            newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 5);
          }
        } catch (e) {
          console.warn(`  ⚠️  subscription取得失敗 (${chargeId}): ${e.message}`);
        }
      }

      const oldExpDate = sub.expirationDate?.toDate?.();
      const oldExpStr = oldExpDate ? oldExpDate.toISOString().split('T')[0] : 'N/A';
      const newExpStr = newExpirationDate ? newExpirationDate.toISOString().split('T')[0] : '変更なし';

      console.log(`  🔧 ${userData.email || uid}`);
      console.log(`     planId: 1year → 5year_legacy`);
      console.log(`     payjpType: ${sub.payjpType} | payjpId: ${chargeId || 'N/A'}`);
      console.log(`     有効期限: ${oldExpStr} → ${newExpStr}`);

      if (!dryRun) {
        const updateData = {
          subscriptionPlanId: '5year_legacy',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (newExpirationDate) {
          updateData.expirationDate = admin.firestore.Timestamp.fromDate(newExpirationDate);
        }

        // 1. subscription/current を更新
        await db
          .collection('users')
          .doc(uid)
          .collection('subscription')
          .doc('current')
          .update(updateData);

        // 2. company_information の subscriptionExpiresAt も更新
        if (newExpirationDate) {
          const companiesSnap = await db
            .collection('users')
            .doc(uid)
            .collection('company_information')
            .get();

          for (const companyDoc of companiesSnap.docs) {
            await companyDoc.ref.update({
              subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(newExpirationDate),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      }
      fixCount++;
      console.log('');
    }
  }

  console.log('📊 修正前のプラン分布:');
  for (const [plan, count] of Object.entries(planCounts).sort()) {
    console.log(`   ${plan}: ${count} 件`);
  }

  console.log(`\n🔧 修正対象: ${fixCount} 件 (1year → 5year_legacy)`);

  if (dryRun && fixCount > 0) {
    console.log('\n⚠️  DRY RUN のため実際の更新は行われていません。');
    console.log('   実行するには --dry-run を外してください。');
  }
}

fixPlanIds()
  .then(() => {
    console.log('\n🏁 完了');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
