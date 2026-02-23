const admin = require('firebase-admin');
const serviceAccount = require('./migration/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = 'XOs5lsx0WlMg6UlOA1XOge2POq23';

db.collection('users').doc(userId).update({
  payjpCustomerId: admin.firestore.FieldValue.delete(),
  payjpPaymentMethodId: admin.firestore.FieldValue.delete(),
  payjpCardId: admin.firestore.FieldValue.delete()
}).then(() => {
  console.log('✅ Cleared Pay.jp data for user:', userId);
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
