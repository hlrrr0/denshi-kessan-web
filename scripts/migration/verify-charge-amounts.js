#!/usr/bin/env node

/**
 * Pay.jp上の実際の金額を確認するスクリプト
 * subscriptionPlanId='1year' の30件について、Pay.jpの課金金額を表示
 */

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const PAYJP_SECRET_KEY = process.env.PAYJP_SECRET_KEY;
if (!PAYJP_SECRET_KEY) {
  console.error('PAYJP_SECRET_KEY を設定してください');
  process.exit(1);
}
const payjp = require('payjp')(PAYJP_SECRET_KEY);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function verify() {
  const usersSnap = await db.collection('users').get();
  console.log('=== subscriptionPlanId="1year" のPay.jp金額確認 ===\n');

  let count = 0;
  const amounts = {};

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const email = userDoc.data().email;

    const subDoc = await db.collection('users').doc(uid).collection('subscription').doc('current').get();
    if (!subDoc.exists) continue;

    const sub = subDoc.data();
    if (sub.subscriptionPlanId !== '1year') continue;

    count++;
    const chargeId = sub.payjpId;
    const payjpType = sub.payjpType;

    if (payjpType === 'charge' && chargeId) {
      await sleep(200);
      try {
        const charge = await payjp.charges.retrieve(chargeId);
        const amt = charge.amount;
        amounts[amt] = (amounts[amt] || 0) + 1;
        console.log(`${count}. ${email} | charge | ¥${amt} | ${new Date(charge.created * 1000).toISOString().split('T')[0]}`);
      } catch (e) {
        console.log(`${count}. ${email} | charge | ERROR: ${e.message}`);
      }
    } else if (payjpType === 'subscription' && chargeId) {
      await sleep(200);
      try {
        const sub2 = await payjp.subscriptions.retrieve(chargeId);
        const amt = sub2.plan ? sub2.plan.amount : 'N/A';
        amounts[amt] = (amounts[amt] || 0) + 1;
        console.log(`${count}. ${email} | subscription | plan:¥${amt} | status:${sub2.status}`);
      } catch (e) {
        console.log(`${count}. ${email} | subscription | ERROR: ${e.message}`);
        amounts['error'] = (amounts['error'] || 0) + 1;
      }
    }
  }

  console.log('\n=== 金額別集計 ===');
  for (const [amt, c] of Object.entries(amounts).sort()) {
    console.log(`  ¥${amt}: ${c}件`);
  }
  console.log(`\n合計: ${count}件`);
}

verify().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
