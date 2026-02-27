#!/usr/bin/env node

/**
 * PDFファイルを Firebase Storage にアップロードするスクリプト
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  });
}

const bucket = admin.storage().bucket();
const db = admin.firestore();

async function migratePDFs() {
  // tar.gz を解凍
  const migrationDataDir = path.join(__dirname, '../../migration-data');
  const pdfsDir = path.join(migrationDataDir, 'pdfs');

  if (!fs.existsSync(pdfsDir)) {
    console.log('📦 Extracting pdfs_backup.tar.gz...');
    execSync(`tar -xzf ${migrationDataDir}/pdfs_backup.tar.gz -C ${migrationDataDir}`);
    fs.renameSync(path.join(migrationDataDir, 'storage'), pdfsDir);
  }

  // ユーザーマッピングを取得
  console.log('📥 Loading user mapping...');
  const usersSnapshot = await db.collection('users').get();
  const userMapping = {};
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.legacyUuid) {
      userMapping[data.legacyUuid] = doc.id;
    }
  });

  // 決算公告情報を読み込み
  console.log('📥 Loading notices.json...');
  const noticesData = JSON.parse(
    fs.readFileSync(path.join(migrationDataDir, 'notices.json'), 'utf-8')
  );

  let successCount = 0;
  let errorCount = 0;

  for (const notice of noticesData) {
    try {
      const firebaseUserId = userMapping[notice.user_id];
      
      if (!firebaseUserId) {
        console.warn(`⚠️  User not found for notice: ${notice.uuid}`);
        errorCount++;
        continue;
      }

      // ActiveStorageのファイルパスを推測
      // 実際のパス構造に応じて調整が必要
      const pdfPath = path.join(pdfsDir, `${notice.uuid}.pdf`);
      
      if (!fs.existsSync(pdfPath)) {
        console.warn(`⚠️  PDF file not found: ${pdfPath}`);
        errorCount++;
        continue;
      }

      // Storage にアップロード
      const destination = `notices/${firebaseUserId}/${notice.uuid}/${path.basename(pdfPath)}`;
      await bucket.upload(pdfPath, {
        destination,
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            noticeUuid: notice.uuid,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // 公開URLを取得
      const file = bucket.file(destination);
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

      console.log(`✅ Uploaded PDF: ${notice.uuid}`);
      successCount++;

      // Firestore にメタ情報を保存（users/{uid}/company_information から該当を探す）
      const companiesSnapshot = await db
        .collection('users').doc(firebaseUserId).collection('company_information')
        .limit(1)
        .get();

      if (!companiesSnapshot.empty) {
        const companyDoc = companiesSnapshot.docs[0];
        await companyDoc.ref.collection('notices').add({
          uuid: notice.uuid,
          userId: firebaseUserId,
          title: notice.title || '',
          pdfUrl: publicUrl,
          pdfPath: destination,
          createdAt: admin.firestore.Timestamp.fromDate(new Date(notice.created_at)),
          updatedAt: admin.firestore.Timestamp.fromDate(new Date(notice.updated_at)),
        });
        console.log(`✅ Created notice doc for: ${notice.uuid}`);
      }
    } catch (error) {
      console.error(`❌ Error uploading PDF ${notice.uuid}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${noticesData.length}`);
}

migratePDFs()
  .then(() => {
    console.log('✅ PDF migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
