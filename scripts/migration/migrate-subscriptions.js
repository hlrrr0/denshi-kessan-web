#!/usr/bin/env node

/**
 * 旧サイト user_subscription_plans.json
 * → Firestore /users/{uid}/subscription_plans/{legacyId} へ移行するスクリプト
 *
 * 入力ファイル:
 *   ~/Desktop/migration_export/user_subscription_plans.json  （rake migration:export で出力）
 *   scripts/migration/uid-mapping.json           （migrate-users.js が生成）
 *
 * Firestore スキーマ: /users/{uid}/subscription_plans/{legacyId}
 *   legacyId, userId, subscriptionPlanId,
 *   payjpChargeId, payjpSubscriptionId,
 *   active, expirationDate, automaticRenewalFlag,
 *   createdAt, updatedAt
 *
 * 前提: migrate-users.js を先に実行し uid-mapping.json が存在すること
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

const db = admin.firestore();

const DATA_DIR   = path.join(process.env.HOME, 'Desktop/migration_export');
const MAPPING_IN = path.join(__dirname, 'uid-mapping.json');

async function migrateSubscriptions() {
  // ── UID マッピングを読み込み ─────────────────────────────
  if (!fs.existsSync(MAPPING_IN)) {
    throw new Error('uid-mapping.json が見つかりません。先に migrate-users.js を実行してください。');
  }
  const uidMapping = JSON.parse(fs.readFileSync(MAPPING_IN, 'utf-8'));
  console.log(`📥 UID マッピング読み込み: ${Object.keys(uidMapping).length} 件`);

  // ── user_subscription_plans.json を読み込み ──────────────
  console.log('📥 Loading user_subscription_plans.json...');
  const subsData = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'user_subscription_plans.json'), 'utf-8')
  );
  console.log(`   ${subsData.length} 件のサブスクリプションが見つかりました\n`);

  let successCount = 0;
  let errorCount   = 0;
  let batch        = db.batch();   // let に変更（再生成するため）
  let batchCount   = 0;

  for (const sub of subsData) {
    try {
      const firebaseUid = uidMapping[sub.user_uuid];

      if (!firebaseUid) {
        console.warn(`⚠️  UID が見つかりません (user_uuid: ${sub.user_uuid}, legacyId: ${sub.legacy_id})`);
        errorCount++;
        continue;
      }

      // /users/{uid}/subscription_plans/{legacyId}
      // legacy_id をドキュメント ID に使うことで再実行時の重複を防ぐ
      const docRef = db
        .collection('users')
        .doc(firebaseUid)
        .collection('subscription_plans')
        .doc(String(sub.legacy_id));

      batch.set(docRef, {
        legacyId:             sub.legacy_id,
        userId:               firebaseUid,
        subscriptionPlanId:   sub.subscription_plan_id,
        payjpChargeId:        sub.payjp_charge_id        || null,
        payjpSubscriptionId:  sub.payjp_subscription_id  || null,
        active:               sub.active === true || sub.active === 1,
        expirationDate:       admin.firestore.Timestamp.fromDate(new Date(sub.expiration_date)),
        automaticRenewalFlag: sub.automatic_renewal_flag === true || sub.automatic_renewal_flag === 1,
        createdAt:            admin.firestore.Timestamp.fromDate(new Date(sub.created_at)),
        updatedAt:            admin.firestore.Timestamp.fromDate(new Date(sub.updated_at)),
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

      console.log(`✅ サブスク保存: users/${firebaseUid}/subscription_plans/${sub.legacy_id}`);
    } catch (error) {
      console.error(`❌ エラー (legacyId: ${sub.legacy_id}):`, error.message);
      errorCount++;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`   バッチコミット完了（${batchCount}件）`);
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Success : ${successCount}`);
  console.log(`   Errors  : ${errorCount}`);
  console.log(`   Total   : ${subsData.length}`);
}

migrateSubscriptions()
  .then(() => { console.log('✅ Subscriptions migration completed'); process.exit(0); })
  .catch((err) => { console.error('❌ Migration failed:', err); process.exit(1); });
