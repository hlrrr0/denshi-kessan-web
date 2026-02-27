#!/usr/bin/env node
/**
 * Sorcery BCrypt パスワードハッシュを Firebase Auth にインポートするスクリプト
 *
 * 前提:
 *   - migrate-users.js が完了し uid-mapping.json が存在すること
 *   - 旧サイトで bundle exec rake migration:export_passwords を実行し
 *     ~/Desktop/migration_export/encrypted_passwords.json が存在すること
 *
 * 使い方:
 *   node scripts/migration/import-passwords.js
 *
 * 処理の流れ:
 *   1. encrypted_passwords.json を読み込む
 *   2. uid-mapping.json で uuid → Firebase UID に変換
 *   3. admin.auth().importUsers() で BCrypt ハッシュごとインポート（1000件ずつ）
 *
 * 結果:
 *   ユーザーは旧サイトと同じパスワードでそのままログイン可能になる
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const DATA_DIR     = path.join(process.env.HOME, 'Desktop/migration_export');
const MAPPING_IN   = path.join(__dirname, 'uid-mapping.json');
const PASSWORDS_IN = path.join(DATA_DIR, 'encrypted_passwords.json');

// Firebase Auth の importUsers は最大1000件/回
const BATCH_SIZE = 1000;

async function importPasswords() {
  // ── UID マッピング読み込み ────────────────────────────────
  if (!fs.existsSync(MAPPING_IN)) {
    throw new Error('uid-mapping.json が見つかりません。先に migrate-users.js を実行してください。');
  }
  const uidMapping = JSON.parse(fs.readFileSync(MAPPING_IN, 'utf-8'));
  console.log(`📥 UID マッピング読み込み: ${Object.keys(uidMapping).length} 件`);

  // ── encrypted_passwords.json 読み込み ────────────────────
  if (!fs.existsSync(PASSWORDS_IN)) {
    throw new Error(
      `encrypted_passwords.json が見つかりません。\n` +
      `旧サイトで以下を実行してください:\n` +
      `  bundle exec rake migration:export_passwords\n` +
      `出力されたファイルを ~/Desktop/migration_export/ にコピーしてください。`
    );
  }
  const passwords = JSON.parse(fs.readFileSync(PASSWORDS_IN, 'utf-8'));
  console.log(`📥 パスワードデータ読み込み: ${passwords.length} 件\n`);

  // ── importUsers 用のレコードを組み立て ───────────────────
  let skipped = 0;
  const importRecords = [];

  for (const pw of passwords) {
    const uid = uidMapping[pw.uuid];
    if (!uid) {
      console.warn(`⚠️  UID なし: uuid=${pw.uuid} email=${pw.email}`);
      skipped++;
      continue;
    }
    if (!pw.encrypted_password) {
      console.warn(`⚠️  ハッシュなし: uuid=${pw.uuid}`);
      skipped++;
      continue;
    }

    importRecords.push({
      uid,
      email:        pw.email,
      // BCrypt ハッシュ文字列を Buffer に変換して渡す
      passwordHash: Buffer.from(pw.encrypted_password),
    });
  }

  console.log(`📋 インポート対象: ${importRecords.length} 件 / スキップ: ${skipped} 件\n`);

  // ── 1000件ずつ importUsers を実行 ────────────────────────
  let successTotal = 0;
  let errorTotal   = 0;

  for (let i = 0; i < importRecords.length; i += BATCH_SIZE) {
    const batch      = importRecords.slice(i, i + BATCH_SIZE);
    const batchNum   = Math.floor(i / BATCH_SIZE) + 1;
    const batchTotal = Math.ceil(importRecords.length / BATCH_SIZE);

    process.stdout.write(`🔄 バッチ ${batchNum}/${batchTotal} (${batch.length}件) ... `);

    const result = await admin.auth().importUsers(batch, {
      hash: {
        algorithm: 'BCRYPT',
      },
    });

    successTotal += batch.length - result.errors.length;
    errorTotal   += result.errors.length;

    if (result.errors.length === 0) {
      console.log('✅ 成功');
    } else {
      console.log(`⚠️  ${result.errors.length} 件エラー`);
      result.errors.forEach(e => {
        console.error(`   ❌ index=${e.index} uid=${batch[e.index]?.uid}: ${e.error.message}`);
      });
    }
  }

  // ── サマリー ─────────────────────────────────────────────
  console.log('\n📊 Migration Summary:');
  console.log(`   Success : ${successTotal}`);
  console.log(`   Errors  : ${errorTotal}`);
  console.log(`   Skipped : ${skipped}`);
  console.log(`   Total   : ${passwords.length}`);
  console.log('\n✅ パスワードインポート完了');
  console.log('   ユーザーは旧サイトと同じパスワードでログインできます。');
}

importPasswords()
  .catch(e => {
    console.error('Fatal:', e.message);
    process.exit(1);
  })
  .finally(() => process.exit(0));
