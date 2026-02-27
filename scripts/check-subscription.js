const admin = require('firebase-admin');
const serviceAccount = require('./migration/serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = 'XOs5lsx0WlMg6UlOA1XOge2POq23';

async function checkSubscription() {
  try {
    const subscriptionDoc = await db.collection('users').doc(userId).collection('subscription').doc('current').get();
    
    if (subscriptionDoc.exists) {
      console.log('📋 Current Subscription in Firestore:');
      console.log(JSON.stringify(subscriptionDoc.data(), null, 2));
    } else {
      console.log('❌ No subscription found in Firestore');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkSubscription();
