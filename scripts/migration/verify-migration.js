#!/usr/bin/env node

/**
 * 移行データの検証スクリプト
 *
 * ~/Desktop/migration_export/ 内の JSON と Firestore の実データを比較し、
 * 件数・UID マッピングの整合性を確認します。
 *
 * 使用方法: node verify-migration.js
 */

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db   = admin.firestore();
const auth = admin.auth();

const DATA_DIR   = path.join(process.env.HOME, 'Desktop/migration_export');
const MAPPING_IN = path.join(__dirname, 'uid-mapping.json');

// ─── ユーティリティ ────────────────────────────────────────
function countJsonFile(filename) {
  const fp = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf-8')).length;
}

async function countTopLevelCollection(name) {
  const snap = await db.collection(name).count().get();
  return snap.data().count;
}

async function countSubcollectionAcrossUsers(subcollectionName) {
  const snap = await db.collectionGroup(subcollectionName).count().get();
  return snap.data().count;
}

// ─── メイン検証処理 ─────────────────────────────────────────
async function verify() {
  console.log('🔍 移行データ検証を開始します...\n');

  const results = [];
  let hasError  = false;

  // ── 1. users ──────────────────────────────────────────────
  {
    const jsonCount = countJsonFile('users.json');
    const fsCount   = await countTopLevelCollection('users');
    let   authCount = 0;

    try {
      // Auth のユーザー数（最大 1000 件ずつ取得）
      let pageToken;
      do {
        const result = await auth.listUsers(1000, pageToken);
        authCount += result.users.length;
        pageToken  = result.pageToken;
      } while (pageToken);
    } catch (e) {
      authCount = '取得失敗';
    }

    const ok = jsonCount === fsCount;
    if (!ok) hasError = true;
    results.push({
      テーブル:      'users',
      JSON件数:      jsonCount,
      Firestore件数: fsCount,
      Auth件数:      authCount,
      判定:          ok ? '✅ OK' : '❌ NG',
    });
  }

  // ── 2. company_information（サブコレクション） ─────────────
  {
    const jsonCount = countJsonFile('company_informations.json');
    const fsCount   = await countSubcollectionAcrossUsers('company_information');
    const ok        = jsonCount === fsCount;
    if (!ok) hasError = true;
    results.push({
      テーブル:      'company_information',
      JSON件数:      jsonCount,
      Firestore件数: fsCount,
      Auth件数:      '—',
      判定:          ok ? '✅ OK' : '❌ NG',
    });
  }

  // ── 3. electronic_public_notices ──────────────────────────
  {
    const jsonCount = countJsonFile('electronic_public_notices.json');
    const fsCount   = await countTopLevelCollection('electronic_public_notices');
    const ok        = jsonCount === fsCount;
    if (!ok) hasError = true;
    results.push({
      テーブル:      'electronic_public_notices',
      JSON件数:      jsonCount,
      Firestore件数: fsCount,
      Auth件数:      '—',
      判定:          ok ? '✅ OK' : '❌ NG',
    });
  }

  // ── 4. subscription_plans（サブコレクション） ──────────────
  {
    const jsonCount = countJsonFile('user_subscription_plans.json');
    const fsCount   = await countSubcollectionAcrossUsers('subscription_plans');
    const ok        = jsonCount === fsCount;
    if (!ok) hasError = true;
    results.push({
      テーブル:      'subscription_plans',
      JSON件数:      jsonCount,
      Firestore件数: fsCount,
      Auth件数:      '—',
      判定:          ok ? '✅ OK' : '❌ NG',
    });
  }

  // ── 5. UID マッピングの整合性チェック ─────────────────────
  console.log('── UID マッピング整合性チェック ──');
  if (!fs.existsSync(MAPPING_IN)) {
    console.error('❌ uid-mapping.json が見つかりません');
    hasError = true;
  } else {
    const uidMapping   = JSON.parse(fs.readFileSync(MAPPING_IN, 'utf-8'));
    const mappingCount = Object.keys(uidMapping).length;
    const jsonCount    = countJsonFile('users.json');
    const ok           = mappingCount === jsonCount;
    if (!ok) hasError = true;
    console.log(`   JSON ユーザー数    : ${jsonCount}`);
    console.log(`   マッピング登録数   : ${mappingCount}`);
    console.log(`   判定               : ${ok ? '✅ OK' : '❌ NG（件数不一致）'}\n`);
  }

  // ── 6. PDF のある公告の pdfUrl チェック ───────────────────
  console.log('── PDF リンク チェック ──');
  const noticesSnap = await db.collection('electronic_public_notices').get();
  let noPdfCount    = 0;
  noticesSnap.forEach(doc => {
    if (!doc.data().pdfUrl) noPdfCount++;
  });
  console.log(`   pdfUrl なし: ${noPdfCount} 件 ${noPdfCount > 0 ? '⚠️  確認推奨' : '✅'}\n`);

  // ── 結果テーブル ─────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.table(results);
  console.log('═══════════════════════════════════════════════════');

  if (hasError) {
    console.error('\n❌ 不一致があります。ログを確認して再移行してください。');
    process.exit(1);
  } else {
    console.log('\n✅ 全件数が一致しています。移行成功！');
    process.exit(0);
  }
}

verify().catch((err) => {
  console.error('❌ 検証スクリプトでエラーが発生しました:', err);
  process.exit(1);
});
