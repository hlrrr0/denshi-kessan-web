#!/usr/bin/env node

const admin = require('firebase-admin');
if (admin.apps.length === 0) {
  const sa = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function check() {
  const userId = 'XOs5lsx0WlMg6UlOA1XOge2POq23';
  const companyId = 'etPeveiYUKqaDl2ytsDm';

  // ユーザー情報
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data();
  console.log('=== ユーザー情報 ===');
  console.log('email:', userData?.email);
  console.log('payjpCustomerId:', userData?.payjpCustomerId);

  // 企業情報
  const companyDoc = await db.collection('users').doc(userId).collection('company_information').doc(companyId).get();
  const companyData = companyDoc.data();
  console.log('\n=== 企業情報 ===');
  console.log('name:', companyData?.name);
  console.log('subscriptionActive:', companyData?.subscriptionActive);
  console.log('subscriptionExpiresAt:', companyData?.subscriptionExpiresAt);

  // notices サブコレクション
  const noticesSnap = await db.collection('users').doc(userId).collection('company_information').doc(companyId).collection('notices').get();
  console.log('\n=== notices サブコレクション ===');
  console.log('件数:', noticesSnap.size);
  noticesSnap.docs.forEach(doc => {
    const d = doc.data();
    console.log(' -', doc.id, '| title:', d.title, '| pdfUrl:', (d.pdfUrl || '').substring(0, 80));
  });

  // electronic_public_notices（旧パス）も確認
  const oldNoticesSnap = await db.collection('electronic_public_notices').get();
  console.log('\n=== electronic_public_notices (トップレベル) ===');
  console.log('件数:', oldNoticesSnap.size);
  if (oldNoticesSnap.size > 0 && oldNoticesSnap.size <= 5) {
    oldNoticesSnap.docs.forEach(doc => {
      const d = doc.data();
      console.log(' -', doc.id, '| userId:', d.userId, '| title:', d.title);
    });
  }

  // subscription/current
  const subDoc = await db.collection('users').doc(userId).collection('subscription').doc('current').get();
  console.log('\n=== subscription/current ===');
  console.log('exists:', subDoc.exists);
  if (subDoc.exists) {
    const sd = subDoc.data();
    console.log('active:', sd.active);
    console.log('payjpId:', sd.payjpId);
    console.log('expirationDate:', sd.expirationDate);
  }
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
