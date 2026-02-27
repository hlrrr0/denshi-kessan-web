#!/usr/bin/env node

/**
 * 期限切れサブスクリプション復元スクリプト
 * 
 * バックフィルスクリプトv2では「アクティブ」なサブスク/チャージのみを記録し、
 * 期限切れユーザーはスキップしていた。
 * 
 * このスクリプトは payjpCustomerId があるのに subscription/current がないユーザーに対し、
 * Pay.jp APIで過去のサブスクリプション/チャージを確認し、期限切れとして記録する。
 *
 * 使い方:
 *   PAYJP_SECRET_KEY=sk_live_xxx node scripts/migration/backfill-expired-subscriptions.js --dry-run
 *   PAYJP_SECRET_KEY=sk_live_xxx node scripts/migration/backfill-expired-subscriptions.js
 */

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const dryRun = process.argv.includes('--dry-run');

const PAYJP_SECRET_KEY = process.env.PAYJP_SECRET_KEY;
if (!PAYJP_SECRET_KEY) {
  console.error('PAYJP_SECRET_KEY を設定してください');
  process.exit(1);
}
const payjp = require('payjp')(PAYJP_SECRET_KEY);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function backfillExpired() {
  console.log(dryRun ? '--- DRY RUN ---\n' : '--- EXECUTE ---\n');

  const usersSnap = await db.collection('users').get();
  
  // payjpCustomerId があるのに subscription/current がないユーザーを抽出
  const targets = [];
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    if (!userData.payjpCustomerId) continue;
    
    const subDoc = await db.collection('users').doc(userDoc.id)
      .collection('subscription').doc('current').get();
    if (subDoc.exists) continue;
    
    targets.push({
      uid: userDoc.id,
      email: userData.email || userDoc.id,
      customerId: userData.payjpCustomerId,
    });
  }

  console.log('Target users (has customerId, no sub doc): ' + targets.length + '\n');

  let restoredCount = 0;
  let noDataCount = 0;
  let errorCount = 0;

  for (const t of targets) {
    try {
      await sleep(200);
      
      let customer;
      try {
        customer = await payjp.customers.retrieve(t.customerId);
      } catch (e) {
        if (e.status === 404) {
          console.log('  SKIP ' + t.email + ' | customer not found');
          noDataCount++;
          continue;
        }
        throw e;
      }

      // サブスクリプションを確認
      const subs = customer.subscriptions?.data || [];
      let bestSub = null;
      let bestExpDate = null;
      let bestPlanId = null;
      let bestPayjpType = null;

      for (const sub of subs) {
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
        const planAmount = sub.plan?.amount;
        
        let planId = '1year_legacy';
        if (planAmount && planAmount >= 3900 && planAmount <= 4000) planId = '5year_legacy';
        
        if (!bestExpDate || (periodEnd && periodEnd > bestExpDate)) {
          bestSub = sub;
          bestExpDate = periodEnd;
          bestPlanId = planId;
          bestPayjpType = 'subscription';
        }
      }

      // チャージを確認（サブスクがない場合）
      if (!bestSub) {
        await sleep(200);
        try {
          const charges = await payjp.charges.list({ customer: t.customerId, limit: 5 });
          if (charges.data && charges.data.length > 0) {
            // 最新の支払い済みチャージを探す
            const paidCharge = charges.data.find(c => c.paid && !c.refunded);
            if (paidCharge) {
              const chargeDate = new Date(paidCharge.created * 1000);
              const amount = paidCharge.amount;
              
              let periodYears = 1;
              if (amount >= 30000) periodYears = 10;
              else if (amount >= 3900) periodYears = 5;
              
              const expDate = new Date(chargeDate);
              expDate.setFullYear(expDate.getFullYear() + periodYears);
              
              bestExpDate = expDate;
              bestPayjpType = 'charge';
              
              if (periodYears === 10) bestPlanId = '10year';
              else if (periodYears === 5) bestPlanId = amount <= 4900 ? '5year_legacy' : '5year';
              else bestPlanId = '1year_legacy';
              
              bestSub = { id: paidCharge.id };
            }
          }
        } catch (e) {
          // best effort
        }
      }

      if (!bestExpDate) {
        console.log('  SKIP ' + t.email + ' | no subscription or charge data found');
        noDataCount++;
        continue;
      }

      const isExpired = bestExpDate <= new Date();
      const expStr = bestExpDate.toISOString().split('T')[0];
      const status = isExpired ? 'EXPIRED' : 'ACTIVE';

      console.log('  ' + status + ' ' + t.email + ' | plan=' + bestPlanId + ' | exp=' + expStr + ' | type=' + bestPayjpType);

      if (!dryRun) {
        const expirationTimestamp = admin.firestore.Timestamp.fromDate(bestExpDate);
        
        // subscription/current に記録
        await db.collection('users').doc(t.uid)
          .collection('subscription').doc('current').set({
            subscriptionPlanId: bestPlanId,
            payjpId: bestSub.id,
            payjpType: bestPayjpType,
            active: !isExpired,
            expirationDate: expirationTimestamp,
            automaticRenewalFlag: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        // company_information も更新
        const companiesSnap = await db.collection('users').doc(t.uid)
          .collection('company_information').get();
        for (const companyDoc of companiesSnap.docs) {
          await companyDoc.ref.update({
            subscriptionActive: !isExpired,
            subscriptionExpiresAt: expirationTimestamp,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      restoredCount++;
    } catch (e) {
      console.log('  ERROR ' + t.email + ' | ' + e.message);
      errorCount++;
    }
  }

  console.log('\n--- Summary ---');
  console.log('Restored: ' + restoredCount);
  console.log('No data (skipped): ' + noDataCount);
  console.log('Errors: ' + errorCount);

  if (dryRun) {
    console.log('\nDRY RUN - no changes made.');
  }
}

backfillExpired().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
