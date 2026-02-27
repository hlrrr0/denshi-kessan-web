#!/usr/bin/env node

/**
 * 旧サイト electronic_public_notices.json + PDFファイル
 * → Firebase Storage + Firestore /electronic_public_notices/{uuid} へ移行するスクリプト
 *
 * 入力ファイル:
 *   ~/Desktop/migration_export/electronic_public_notices.json  （rake migration:export で出力）
 *   ~/Desktop/migration_export/pdfs/{uuid}.pdf                 （rake migration:export でコピー済み）
 *   scripts/migration/uid-mapping.json             （migrate-users.js が生成）
 *
 * Firestore スキーマ: /electronic_public_notices/{uuid}
 *   uuid, userId, title, pdfUrl, pdfPath,
 *   createdAt, updatedAt
 *
 * Firebase Storage パス: notices/{uid}/{uuid}.pdf
 *
 * 前提: migrate-users.js を先に実行し uid-mapping.json が存在すること
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  // ★ YOUR_PROJECT_ID を実際の Firebase プロジェクト ID に置き換えてください
  admin.initializeApp({
    credential:    admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.appspot.com',
  });
}

const db     = admin.firestore();
const bucket = admin.storage().bucket();

const DATA_DIR   = path.join(process.env.HOME, 'Desktop/migration_export');
const PDFS_DIR   = path.join(DATA_DIR, 'pdfs');
const MAPPING_IN = path.join(__dirname, 'uid-mapping.json');

async function migrateNotices() {
  // ── UID マッピングを読み込み ─────────────────────────────
  if (!fs.existsSync(MAPPING_IN)) {
    throw new Error('uid-mapping.json が見つかりません。先に migrate-users.js を実行してください。');
  }
  const uidMapping = JSON.parse(fs.readFileSync(MAPPING_IN, 'utf-8'));
  console.log(`📥 UID マッピング読み込み: ${Object.keys(uidMapping).length} 件`);

  // ── electronic_public_notices.json を読み込み ────────────
  console.log('📥 Loading electronic_public_notices.json...');
  const noticesData = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'electronic_public_notices.json'), 'utf-8')
  );
  console.log(`   ${noticesData.length} 件の公告データが見つかりました\n`);

  let successCount  = 0;
  let errorCount    = 0;
  let noPdfCount    = 0;

  for (const notice of noticesData) {
    try {
      const firebaseUid = uidMapping[notice.user_uuid];

      if (!firebaseUid) {
        console.warn(`⚠️  UID が見つかりません (user_uuid: ${notice.user_uuid}, uuid: ${notice.uuid})`);
        errorCount++;
        continue;
      }

      // ── PDF を Firebase Storage にアップロード ────────────
      let pdfUrl  = null;
      let pdfPath = null;

      if (notice.pdf_local_path) {
        const localPdfPath = path.join(DATA_DIR, notice.pdf_local_path);

        if (fs.existsSync(localPdfPath)) {
          pdfPath = `notices/${firebaseUid}/${notice.uuid}.pdf`;

          await bucket.upload(localPdfPath, {
            destination: pdfPath,
            metadata: {
              contentType: 'application/pdf',
              metadata: {
                noticeUuid:  notice.uuid,
                uploadedAt:  new Date().toISOString(),
              },
            },
          });

          // Firebase Storage ダウンロードトークン付き URL を取得
          const file = bucket.file(pdfPath);
          const [metadata] = await file.getMetadata();
          const token = metadata.metadata?.firebaseStorageDownloadTokens;
          if (token) {
            pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(pdfPath)}?alt=media&token=${token}`;
          } else {
            // トークンがない場合は生成
            await file.setMetadata({
              metadata: { firebaseStorageDownloadTokens: require('crypto').randomUUID() }
            });
            const [meta2] = await file.getMetadata();
            const newToken = meta2.metadata?.firebaseStorageDownloadTokens;
            pdfUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(pdfPath)}?alt=media&token=${newToken}`;
          }

          console.log(`   📄 PDF アップロード完了: ${notice.uuid}.pdf`);
        } else {
          console.warn(`   ⚠️  PDFファイルが見つかりません: ${localPdfPath}`);
          noPdfCount++;
        }
      } else {
        console.warn(`   ⚠️  PDF未添付の公告: ${notice.uuid}`);
        noPdfCount++;
      }

      // ── Firestore /electronic_public_notices/{uuid} に保存 ─
      await db.collection('electronic_public_notices').doc(notice.uuid).set({
        uuid:      notice.uuid,
        userId:    firebaseUid,
        title:     notice.title || '',
        pdfUrl:    pdfUrl,
        pdfPath:   pdfPath,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(notice.created_at)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(notice.updated_at)),
      });

      console.log(`✅ 公告保存: ${notice.title} (${notice.uuid})`);
      successCount++;
    } catch (error) {
      console.error(`❌ エラー (uuid: ${notice.uuid}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Success  : ${successCount}`);
  console.log(`   No PDF   : ${noPdfCount}`);
  console.log(`   Errors   : ${errorCount}`);
  console.log(`   Total    : ${noticesData.length}`);
}

migrateNotices()
  .then(() => { console.log('✅ Notices migration completed'); process.exit(0); })
  .catch((err) => { console.error('❌ Migration failed:', err); process.exit(1); });
