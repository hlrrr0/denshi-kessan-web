#!/usr/bin/env node

const admin = require('firebase-admin');
if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(require('./serviceAccountKey.json')) });
}
const db = admin.firestore();

async function check() {
  const usersSnap = await db.collection('users').get();
  const now = new Date();
  let active = 0, expired = 0, none = 0, hasSubNoExp = 0;
  const expiredList = [];

  for (const userDoc of usersSnap.docs) {
    const subDoc = await db.collection('users').doc(userDoc.id).collection('subscription').doc('current').get();
    if (!subDoc.exists) { none++; continue; }

    const sub = subDoc.data();
    const expDate = sub.expirationDate && sub.expirationDate.toDate ? sub.expirationDate.toDate() : null;

    if (!expDate) { hasSubNoExp++; continue; }

    const isActive = sub.active && expDate > now;

    if (isActive) {
      active++;
    } else {
      expired++;
      expiredList.push({
        email: userDoc.data().email || userDoc.id,
        subActive: sub.active,
        expDate: expDate.toISOString().split('T')[0],
        planId: sub.subscriptionPlanId || 'N/A',
        payjpType: sub.payjpType || 'N/A',
      });
    }
  }

  console.log('Total users:', usersSnap.size);
  console.log('Active subscriptions:', active);
  console.log('Expired subscriptions:', expired);
  console.log('No subscription doc:', none);
  console.log('Sub doc but no expDate:', hasSubNoExp);

  if (expiredList.length > 0) {
    console.log('\nExpired users:');
    expiredList.forEach((u, i) => {
      console.log((i+1) + '. ' + u.email + ' | sub.active=' + u.subActive + ' | exp=' + u.expDate + ' | plan=' + u.planId + ' | type=' + u.payjpType);
    });
  }

  // Also check: users with payjpCustomerId but NO subscription doc (might be missed by backfill)
  console.log('\n--- Users with payjpCustomerId but no subscription doc ---');
  let missedCount = 0;
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    if (!userData.payjpCustomerId) continue;
    const subDoc = await db.collection('users').doc(userDoc.id).collection('subscription').doc('current').get();
    if (!subDoc.exists) {
      missedCount++;
      if (missedCount <= 20) {
        console.log(missedCount + '. ' + (userData.email || userDoc.id) + ' | customerId=' + userData.payjpCustomerId);
      }
    }
  }
  console.log('Total with customerId but no sub doc: ' + missedCount);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
