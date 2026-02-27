#!/usr/bin/env node

/**
 * electronic_public_notices（トップレベル）→ users/{uid}/company_information/{companyId}/notices へ移行
 *
 * 既存の electronic_public_notices コレクションには以下のフィールドがある:
 *   uuid, userId, title, pdfUrl, pdfPath, createdAt, updatedAt
 *
 * これを users/{userId}/company_information/{companyId}/notices サブコレクションにコピーする
 *
 * 使い方:
 *   node scripts/migration/migrate-notices-to-subcollection.js --dry-run
 *   node scripts/migration/migrate-notices-to-subcollection.js
 */

const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  const sa = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();
const dryRun = process.argv.includes('--dry-run');

async function migrateNotices() {
  console.log(dryRun ? '🔍 DRY RUN モード\n' : '🚀 実行モード\n');

  // electronic_public_notices を取得
  const noticesSnap = await db.collection('electronic_public_notices').get();
  console.log(`📥 electronic_public_notices: ${noticesSnap.size} 件\n`);

  let successCount = 0;
  let skippedCount = 0;
  let noCompanyCount = 0;
  let alreadyExistsCount = 0;
  let errorCount = 0;

  for (const noticeDoc of noticesSnap.docs) {
    const data = noticeDoc.data();
    const userId = data.userId;
    const noticeId = noticeDoc.id; // UUID

    if (!userId) {
      console.warn(`⚠️  userId なし: ${noticeId}`);
      skippedCount++;
      continue;
    }

    try {
      // ユーザーの company_information を取得（最初の1件）
      const companiesSnap = await db
        .collection('users')
        .doc(userId)
        .collection('company_information')
        .limit(1)
        .get();

      if (companiesSnap.empty) {
        console.warn(`⚠️  企業情報なし: userId=${userId} | title=${data.title}`);
        noCompanyCount++;
        continue;
      }

      const companyDoc = companiesSnap.docs[0];
      const targetRef = companyDoc.ref.collection('notices').doc(noticeId);

      // 既に存在するかチェック
      const existingDoc = await targetRef.get();
      if (existingDoc.exists) {
        console.log(`⏭️  既存: ${noticeId} | ${data.title}`);
        alreadyExistsCount++;
        continue;
      }

      // サブコレクションに書き込み
      const noticeData = {
        uuid: data.uuid || noticeId,
        userId: userId,
        title: data.title || '',
        pdfUrl: data.pdfUrl || '',
        pdfPath: data.pdfPath || '',
        createdAt: data.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: data.updatedAt || admin.firestore.FieldValue.serverTimestamp(),
      };

      if (!dryRun) {
        await targetRef.set(noticeData);
      }

      console.log(`✅ 移行: ${data.title} → users/${userId}/company_information/${companyDoc.id}/notices/${noticeId}`);
      successCount++;

    } catch (error) {
      console.error(`❌ エラー (${noticeId}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ 移行成功     : ${successCount} 件`);
  console.log(`   ⏭️  既存（スキップ）: ${alreadyExistsCount} 件`);
  console.log(`   ⚠️  企業情報なし  : ${noCompanyCount} 件`);
  console.log(`   ⚠️  スキップ     : ${skippedCount} 件`);
  console.log(`   ❌ エラー       : ${errorCount} 件`);

  if (dryRun) {
    console.log('\n⚠️  DRY RUN のため実際の移行は行われていません。');
  }
}

migrateNotices()
  .then(() => {
    console.log('\n🏁 完了');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
