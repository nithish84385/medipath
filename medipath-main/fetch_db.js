import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: 'AIzaSyB8qJM5kA5t126rNWBPMCzEbzspTgHYGqQ',
  authDomain: 'medipath-c91bf.firebaseapp.com',
  projectId: 'medipath-c91bf',
  storageBucket: 'medipath-c91bf.firebasestorage.app',
  messagingSenderId: '236982445915',
  appId: '1:236982445915:web:50e12a30e5e9994ae2dc7e'
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  const qSnap = await getDocs(collection(db, 'queue_entries'));
  const pSnap = await getDocs(collection(db, 'prescriptions'));
  const data = {
    queues: qSnap.docs.map(d => ({id: d.id, ...d.data()})),
    presc: pSnap.docs.map(d => ({id: d.id, ...d.data()}))
  };
  fs.writeFileSync('db_dump.json', JSON.stringify(data, null, 2));
  process.exit(0);
}
run();
