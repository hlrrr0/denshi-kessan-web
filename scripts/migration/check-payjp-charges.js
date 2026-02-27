#!/usr/bin/env node

/**
 * 特定ユーザーのPay.jp決済履歴を確認するスクリプト
 *
 * 使い方:
 *   PAYJP_SECRET_KEY=sk_live_xxx node scripts/migration/check-payjp-charges.js
 */

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  const sa = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();

const PAYJP_SECRET_KEY = process.env.PAYJP_SECRET_KEY;
if (!PAYJP_SECRET_KEY) {
  console.error('PAYJP_SECRET_KEY 環境変数を設定してください');
  process.exit(1);
}

const payjp = require('payjp')(PAYJP_SECRET_KEY);

async function check() {
  const userId = 'XOs5lsx0WlMg6UlOA1XOge2POq23';

  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  const customerId = userData.payjpCustomerId;
  
  console.log('email:', userData.email);
  console.log('payjpCustomerId:', customerId);
  console.log('');

  if (!customerId) {
    console.log('Pay.jp顧客IDなし');
    return;
  }

  // 顧客情報
  const customer = await payjp.customers.retrieve(customerId);
  console.log('=== Pay.jp 顧客情報 ===');
  console.log('id:', customer.id);
  console.log('default_card:', customer.default_card);
  console.log('subscriptions:', customer.subscriptions?.count || 0, '件');
  
  if (customer.subscriptions?.data) {
    customer.subscriptions.data.forEach(s => {
      console.log(`  - ${s.id} | status: ${s.status} | plan: ${s.plan?.id} | period_end: ${new Date(s.current_period_end * 1000).toISOString()}`);
    });
  }

  // 決済履歴
  console.log('\n=== Pay.jp 決済履歴 ===');
  const charges = await payjp.charges.list({
    customer: customerId,
    limit: 100,
  });
  
  console.log('件数:', charges.data.length);
  charges.data.forEach(c => {
    console.log(`  - ${c.id} | ${new Date(c.created * 1000).toISOString().split('T')[0]} | ¥${c.amount} | paid: ${c.paid} | refunded: ${c.refunded} | desc: ${c.description || '(なし)'}`);
  });
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
