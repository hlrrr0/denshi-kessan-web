const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addLegacyUuidToCompanies() {
  console.log('Starting migration: adding legacyUuid to company_information documents...');
  
  try {
    // 全ユーザーを取得
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users`);
    
    let totalCompanies = 0;
    let updatedCompanies = 0;
    let skippedCompanies = 0;
    
    // 各ユーザーについて処理
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const legacyUuid = userData.legacyUuid;
      
      if (!legacyUuid) {
        console.log(`User ${userId} has no legacyUuid, skipping...`);
        continue;
      }
      
      // そのユーザーのcompany_informationサブコレクションを取得
      const companiesSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('company_information')
        .get();
      
      totalCompanies += companiesSnapshot.size;
      
      // 各companyドキュメントにlegacyUuidを追加
      for (const companyDoc of companiesSnapshot.docs) {
        const companyData = companyDoc.data();
        
        // 既にlegacyUuidがある場合はスキップ
        if (companyData.legacyUuid) {
          console.log(`Company ${companyDoc.id} (user ${userId}) already has legacyUuid, skipping...`);
          skippedCompanies++;
          continue;
        }
        
        // legacyUuidを追加
        await companyDoc.ref.update({
          legacyUuid: legacyUuid
        });
        
        updatedCompanies++;
        console.log(`Updated company ${companyDoc.id} (user ${userId}) with legacyUuid: ${legacyUuid}`);
      }
    }
    
    console.log('\n=== Migration completed ===');
    console.log(`Total companies processed: ${totalCompanies}`);
    console.log(`Updated: ${updatedCompanies}`);
    console.log(`Skipped (already had legacyUuid): ${skippedCompanies}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addLegacyUuidToCompanies()
  .then(() => {
    console.log('Migration script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
