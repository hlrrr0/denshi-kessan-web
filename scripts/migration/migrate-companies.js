#!/usr/bin/env node

/**
 * 企業情報を Firebase にインポートするスクリプト
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 既に初期化されているかチェック
if (admin.apps.length === 0) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function migrateCompanies() {
  console.log('📥 Loading companies.json...');
  const companiesData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../migration-data/companies.json'), 'utf-8')
  );

  // ユーザーマッピング（legacy uuid → Firebase UID）
  console.log('📥 Loading user mapping...');
  const usersSnapshot = await db.collection('users').get();
  const userMapping = {};
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.legacyUuid) {
      userMapping[data.legacyUuid] = doc.id;
    }
  });

  console.log(`✅ Found ${companiesData.length} companies to migrate`);

  let successCount = 0;
  let errorCount = 0;

  for (const company of companiesData) {
    try {
      const firebaseUserId = userMapping[company.user_id];
      
      if (!firebaseUserId) {
        console.warn(`⚠️  User not found for company: ${company.name}`);
        errorCount++;
        continue;
      }

      const companyDoc = await db.collection('companies').add({
        userId: firebaseUserId,
        name: company.name,
        nameFurigana: company.name_furigana || '',
        establishmentDate: company.establishment_date || '',
        representativeName: company.representative_name || '',
        capital: company.capital || 0,
        amountOfSales: company.amount_of_sales || 0,
        numberOfEmployees: company.number_of_employees || 0,
        businessDescription: company.business_description || '',
        officeAddress: company.office_address || '',
        officialHomepageUrl: company.official_homepage_url || '',
        accountClosingMonth: company.account_closing_month || 12,
        createdAt: admin.firestore.Timestamp.fromDate(new Date(company.created_at)),
        updatedAt: admin.firestore.Timestamp.fromDate(new Date(company.updated_at)),
      });

      console.log(`✅ Created company: ${company.name} (${companyDoc.id})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error migrating company ${company.name}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${companiesData.length}`);
}

migrateCompanies()
  .then(() => {
    console.log('✅ Company migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
