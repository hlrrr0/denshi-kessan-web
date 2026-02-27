/**
 * 既存の企業データにサブスクリプション状態フィールドを追加するマイグレーションスクリプト
 * 
 * 使用方法:
 * node scripts/add-subscription-fields-to-companies.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./migration/serviceAccountKey.json');

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function migrateCompanies() {
  console.log('🚀 Starting migration: Adding subscription fields to companies...\n');

  try {
    // 全企業を取得
    const companiesSnapshot = await db.collection('companies').get();
    console.log(`📊 Found ${companiesSnapshot.size} companies\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const companyDoc of companiesSnapshot.docs) {
      const company = companyDoc.data();
      const companyId = companyDoc.id;

      try {
        // すでにフィールドがある場合はスキップ
        if (company.subscriptionActive !== undefined) {
          console.log(`⏭️  Skipping ${company.name || companyId} (already has subscription fields)`);
          skippedCount++;
          continue;
        }

        // ユーザーのサブスクリプション情報を取得
        const subscriptionDoc = await db
          .collection('users')
          .doc(company.userId)
          .collection('subscription')
          .doc('current')
          .get();

        if (subscriptionDoc.exists) {
          const subscription = subscriptionDoc.data();
          const expirationDate = subscription.expirationDate;
          const now = admin.firestore.Timestamp.now();
          
          // 期限チェック
          const isExpired = expirationDate && expirationDate.toDate() < now.toDate();
          const isActive = subscription.active && !isExpired;

          // 企業情報を更新
          await companyDoc.ref.update({
            subscriptionActive: isActive,
            subscriptionExpiresAt: expirationDate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`✅ Updated ${company.name || companyId}`);
          console.log(`   - subscriptionActive: ${isActive}`);
          console.log(`   - subscriptionExpiresAt: ${expirationDate?.toDate().toLocaleDateString() || 'N/A'}\n`);
          updatedCount++;
        } else {
          // サブスクリプションがない場合は無効状態で初期化
          await companyDoc.ref.update({
            subscriptionActive: false,
            subscriptionExpiresAt: admin.firestore.Timestamp.fromDate(new Date(0)), // エポック
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          console.log(`⚠️  Updated ${company.name || companyId} (no subscription - set to inactive)\n`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${company.name || companyId}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total: ${companiesSnapshot.size}`);
    console.log('='.repeat(60));

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review the output above.');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// 実行
migrateCompanies()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
