const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const uidMapping = require('./uid-mapping.json');
const mappedUids = new Set(Object.values(uidMapping));

db.collection('users').get().then(snap => {
  const extra = [];
  snap.forEach(doc => {
    if (!mappedUids.has(doc.id)) {
      const d = doc.data();
      extra.push({ id: doc.id, email: d.email, legacyUuid: d.legacyUuid });
    }
  });
  console.log('マッピングにない Firestore users (' + extra.length + '件):');
  console.log(JSON.stringify(extra, null, 2));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
