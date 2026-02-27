#!/usr/bin/env node

const admin = require('firebase-admin');
if (admin.apps.length === 0) {
  const sa = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function checkNotices() {
  // electronic_public_notices の構造を確認
  const snap = await db.collection('electronic_public_notices').get();
  console.log('=== electronic_public_notices ===');
  console.log('total:', snap.size, '\n');

  // 最初の5件のフィールド構造を表示
  const sample = snap.docs.slice(0, 5);
  for (const doc of sample) {
    const d = doc.data();
    console.log('--- doc:', doc.id, '---');
    console.log('fields:', Object.keys(d).join(', '));
    console.log('userId:', d.userId || d.user_id || d.uid);
    console.log('companyId:', d.companyId || d.company_id || d.company_information_id);
    console.log('title:', d.title);
    console.log('pdfUrl:', d.pdfUrl || d.pdf_url || d.file_url);
    console.log('fiscalYear:', d.fiscalYear || d.fiscal_year);
    console.log('createdAt:', d.createdAt || d.created_at);
    console.log('');
  }

  // 対象ユーザーのnoticeがあるか確認
  const targetUserId = 'XOs5lsx0WlMg6UlOA1XOge2POq23';
  const userNotices = snap.docs.filter(doc => {
    const d = doc.data();
    return d.userId === targetUserId || d.user_id === targetUserId || d.uid === targetUserId;
  });
  console.log('=== 対象ユーザー(XOs5lsx...)のnotice数:', userNotices.length, '===');
  userNotices.forEach(doc => {
    const d = doc.data();
    console.log(' -', doc.id, '| title:', d.title, '| pdfUrl:', (d.pdfUrl || d.pdf_url || '').substring(0, 80));
  });

  // userIdの一覧を取得
  const userIds = new Set();
  snap.docs.forEach(doc => {
    const d = doc.data();
    const uid = d.userId || d.user_id || d.uid;
    if (uid) userIds.add(uid);
  });
  console.log('\n=== ユニークuserID数:', userIds.size, '===');
}

checkNotices().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
