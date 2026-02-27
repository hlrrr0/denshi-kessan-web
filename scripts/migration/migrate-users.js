#!/usr/bin/env node

/**
 * 旧サイト users.json → Firebase Auth + Firestore /users/{uid} へ移行するスクリプト
 *
 * 入力ファイル: ~/Desktop/migration_export/users.json
 *   （Rails の rake migration:export で出力したもの）
 *
 * Firestore スキーマ: /users/{uid}
 *   uid, legacyUuid, email, name, phone, active, role,
 *   activationState, payjpCustomerId, payjpCardId,
 *   createdAt, updatedAt
 *
 * 注意:
 *   - パスワードは移行しない。移行後にユーザーへパスワード再設定メールを送信する。
 *   - activation_state が "active" 以外のユーザーは Firebase Auth 上で disabled にする。
 *   - 実行後に生成される uid-mapping.json を他のスクリプトが参照するので必ず保持すること。
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db   = admin.firestore();

const DATA_DIR    = path.join(process.env.HOME, 'Desktop/migration_export');
const MAPPING_OUT = path.join(__dirname, 'uid-mapping.json');

async function migrateUsers() {
  console.log('📥 Loading users.json...');
  const usersData = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf-8')
  );
  console.log(`   ${usersData.length} 件のユーザーが見つかりました\n`);

  // 既存の UID マッピングを読み込み（再実行対応）
  const uidMapping = fs.existsSync(MAPPING_OUT)
    ? JSON.parse(fs.readFileSync(MAPPING_OUT, 'utf-8'))
    : {};

  let successCount = 0;
  let errorCount   = 0;
  let batch        = db.batch();   // let に変更（再生成するため）
  let batchCount   = 0;

  for (const user of usersData) {
    try {
      // ── Firebase Auth ユーザーを作成 ──────────────────────
      let firebaseUser;
      try {
        firebaseUser = await auth.createUser({
          email:       user.email,
          displayName: user.name,
          // activation_state が "active" のみ有効、それ以外は disabled
          disabled: user.activation_state !== 'active',
        });
        console.log(`✅ Auth 作成: ${user.email} → ${firebaseUser.uid}`);
      } catch (authError) {
        if (authError.code === 'auth/email-already-exists') {
          firebaseUser = await auth.getUserByEmail(user.email);
          console.log(`ℹ️  Auth 既存: ${user.email} → ${firebaseUser.uid}`);
        } else {
          throw authError;
        }
      }

      // パスワード再設定メールを送信（Auth REST API 経由は Admin SDK 非対応のため
      // ここでは UID マッピングのみ記録し、後続の notify スクリプトで一括送信する）
      uidMapping[user.uuid] = firebaseUser.uid;

      // ── Firestore /users/{uid} ─────────────────────────────
      const userRef = db.collection('users').doc(firebaseUser.uid);
      batch.set(userRef, {
        uid:             firebaseUser.uid,
        legacyUuid:      user.uuid,
        email:           user.email,
        name:            user.name,
        phone:           user.phone  || '',
        active:          user.active === true || user.active === 1,
        role:            user.role   || 0,
        activationState: user.activation_state || '',
        payjpCustomerId: user.payjp_customer_id || '',
        payjpCardId:     user.payjp_card_id     || '',
        createdAt:       admin.firestore.Timestamp.fromDate(new Date(user.created_at)),
        updatedAt:       admin.firestore.Timestamp.fromDate(new Date(user.updated_at)),
      }, { merge: true });

      batchCount++;
      successCount++;

      // Firestore バッチは 500 件上限
      if (batchCount >= 400) {
        await batch.commit();
        batch      = db.batch();   // 新しいバッチを生成
        batchCount = 0;
        console.log('   バッチコミット完了（400件）');
      }
    } catch (error) {
      console.error(`❌ エラー (${user.email}):`, error.message);
      errorCount++;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`   バッチコミット完了（${batchCount}件）`);
  }

  // UID マッピングをファイルに保存（他スクリプトが参照）
  fs.writeFileSync(MAPPING_OUT, JSON.stringify(uidMapping, null, 2));
  console.log(`\n💾 UID マッピング保存: ${MAPPING_OUT}`);

  console.log('\n📊 Migration Summary:');
  console.log(`   Success : ${successCount}`);
  console.log(`   Errors  : ${errorCount}`);
  console.log(`   Total   : ${usersData.length}`);
  console.log('\n⚠️  パスワード再設定メールは notify-password-reset.js で送信してください。');
}

migrateUsers()
  .then(() => { console.log('✅ Users migration completed'); process.exit(0); })
  .catch((err) => { console.error('❌ Migration failed:', err); process.exit(1); });
