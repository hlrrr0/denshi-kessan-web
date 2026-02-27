#!/usr/bin/env node

/**
 * Pay.jp上の実際の金額を確認するスクリプト（高速版）
 * まずFirestoreで対象UIDを一括取得し、そこからPay.jpにアクセス
 */

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
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
  // Step 1: 対象ユーザーをFirestoreから一括取得
  console.log('Step 1: Firestoreから対象ユーザー検索中...');
  const usersSnap = await db.collection('users').get();
  
  const targets = [];
  for (const userDoc of usersSnap.docs) {
    const subDoc = await db.collection('users').doc(userDoc.id).collection('subscription').doc('current').get();
    if (!subDoc.exists) continue;
    const sub = subDoc.data();
    if (sub.subscriptionPlanId !== '1year') continue;
    targets.push({
      uid: userDoc.id,
      email: userDoc.data().email,
      payjpId: sub.payjpId,
      payjpType: sub.payjpType,
    });
  }
  
  console.log('対象: ' + targets.length + '件\n');
  console.log('Step 2: Pay.jp API で金額確認中...\n');

  // Step 2: Pay.jp APIで金額確認
  const amounts = {};
  
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    
    if (t.payjpType === 'charge' && t.payjpId) {
      await sleep(150);
      try {
        const charge = await payjp.charges.retrieve(t.payjpId);
        amounts[charge.amount] = (amounts[charge.amount] || 0) + 1;
        const d = new Date(charge.created * 1000).toISOString().split('T')[0];
        console.log((i+1) + '. ' + t.email + ' | charge | Y' + charge.amount + ' | ' + d);
      } catch (e) {
        console.log((i+1) + '. ' + t.email + ' | charge | ERROR: ' + e.message);
        amounts['error'] = (amounts['error'] || 0) + 1;
      }
    } else if (t.payjpType === 'subscription' && t.payjpId) {
      await sleep(150);
      try {
        const sub = await payjp.subscriptions.retrieve(t.payjpId);
        const amt = sub.plan ? sub.plan.amount : 'N/A';
        amounts[amt] = (amounts[amt] || 0) + 1;
        console.log((i+1) + '. ' + t.email + ' | subscription | plan:Y' + amt + ' | status:' + sub.status);
      } catch (e) {
        console.log((i+1) + '. ' + t.email + ' | subscription | ERROR: ' + e.message);
        amounts['error'] = (amounts['error'] || 0) + 1;
      }
    }
  }

  console.log('\n=== Amount Summary ===');
  for (const [amt, c] of Object.entries(amounts).sort()) {
    console.log('  Y' + amt + ': ' + c);
  }
  console.log('Total: ' + targets.length);
}

verify().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
