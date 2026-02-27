#!/usr/bin/env node

/**
 * 旧サイト company_informations.json → Firestore /users/{uid}/company_information へ移行するスクリプト
 *
 * 入力ファイル:
 *   ~/Desktop/migration_export/company_informations.json  （rake migration:export で出力）
 *   scripts/migration/uid-mapping.json        （migrate-users.js が生成）
 *
 * Firestore スキーマ: /users/{uid}/company_information/{docId}
 *   legacyId, userId, name, nameFurigana, establishmentDate,
 *   representativeName, capital, amountOfSales, numberOfEmployees,
 *   businessDescription, officeAddress, officialHomepageUrl,
 *   accountClosingMonth, createdAt, updatedAt
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

const DATA_DIR    = path.join(process.env.HOME, 'Desktop/migration_export');
const MAPPING_IN  = path.join(__dirname, 'uid-mapping.json');

async function migrateCompanies() {
  // ── UID マッピングを読み込み ─────────────────────────────
  if (!fs.existsSync(MAPPING_IN)) {
    throw new Error('uid-mapping.json が見つかりません。先に migrate-users.js を実行してください。');
  }
  const uidMapping = JSON.parse(fs.readFileSync(MAPPING_IN, 'utf-8'));
  console.log(`📥 UID マッピング読み込み: ${Object.keys(uidMapping).length} 件`);

  // ── company_informations.json を読み込み ─────────────────
  console.log('📥 Loading company_informations.json...');
  const companiesData = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'company_informations.json'), 'utf-8')
  );
  console.log(`   ${companiesData.length} 件の企業情報が見つかりました\n`);

  let successCount = 0;
  let errorCount   = 0;

  for (const company of companiesData) {
    try {
      const firebaseUid = uidMapping[company.user_uuid];

      if (!firebaseUid) {
        console.warn(`⚠️  UID が見つかりません (user_uuid: ${company.user_uuid}, name: ${company.name})`);
        errorCount++;
        continue;
      }

      // /users/{uid}/company_information/{docId}
      // 1ユーザー1件が基本だが将来の複数対応を見越してサブコレクションを使用
      const colRef = db
        .collection('users')
        .doc(firebaseUid)
        .collection('company_information');

      await colRef.add({
        legacyId:            company.legacy_id,
        userId:              firebaseUid,
        name:                company.name,
        nameFurigana:        company.name_furigana         || '',
        establishmentDate:   company.establishment_date
          ? admin.firestore.Timestamp.fromDate(new Date(company.establishment_date))
          : null,
        representativeName:  company.representative_name   || '',
        capital:             company.capital               || '',
        amountOfSales:       company.amount_of_sales       || '',
        numberOfEmployees:   company.number_of_employees   || '',
        businessDescription: company.business_description  || '',
        officeAddress:       company.office_address        || '',
        officialHomepageUrl: company.official_homepage_url || '',
        accountClosingMonth: company.account_closing_month ?? null,
        createdAt:           admin.firestore.Timestamp.fromDate(new Date(company.created_at)),
        updatedAt:           admin.firestore.Timestamp.fromDate(new Date(company.updated_at)),
      });

      console.log(`✅ 企業情報保存: ${company.name} → users/${firebaseUid}/company_information`);
      successCount++;
    } catch (error) {
      console.error(`❌ エラー (${company.name}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Success : ${successCount}`);
  console.log(`   Errors  : ${errorCount}`);
  console.log(`   Total   : ${companiesData.length}`);
}

migrateCompanies()
  .then(() => { console.log('✅ Companies migration completed'); process.exit(0); })
  .catch((err) => { console.error('❌ Migration failed:', err); process.exit(1); });
