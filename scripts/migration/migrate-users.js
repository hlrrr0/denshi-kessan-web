#!/usr/bin/env node

/**
 * MySQL データを Firebase にインポートするスクリプト
 * 使用方法: node migrate-users.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// サービスアカウントキーを読み込み
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'YOUR_PROJECT_ID.appspot.com', // 実際のプロジェクトIDに置き換える
});

const auth = admin.auth();
const db = admin.firestore();

/**
 * ユーザーデータを移行
 */
async function migrateUsers() {
  console.log('📥 Loading users.json...');
  const usersData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../migration-data/users.json'), 'utf-8')
  );

  console.log(`✅ Found ${usersData.length} users to migrate`);

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersData) {
    try {
      // Firebase Auth ユーザーを作成
      let firebaseUser;
      try {
        firebaseUser = await auth.createUser({
          email: user.email,
          displayName: user.name,
          disabled: !user.active,
        });
        console.log(`✅ Created Firebase Auth user: ${user.email}`);
      } catch (authError) {
        if (authError.code === 'auth/email-already-exists') {
          // 既に存在する場合は取得
          firebaseUser = await auth.getUserByEmail(user.email);
          console.log(`ℹ️  User already exists: ${user.email}`);
        } else {
          throw authError;
        }
      }

      // Firestore にユーザードキュメントを作成
      await db.collection('users').doc(firebaseUser.uid).set({
        uid: firebaseUser.uid,
        legacyUuid: user.uuid,
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        active: user.active,
        payjpCustomerId: user.payjp_customer_id || '',
        payjpCardId: user.payjp_card_id || '',
        createdAt: admin.firestore.Timestamp.fromDate(new Date(user.created_at)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(user.updated_at)),
      });

      console.log(`✅ Created Firestore user doc: ${firebaseUser.uid}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error migrating user ${user.email}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${usersData.length}`);
}

// 実行
migrateUsers()
  .then(() => {
    console.log('✅ User migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
