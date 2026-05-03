
import fs from 'fs';
import csv from 'csv-parser';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyB8qJM5kA5t126rNWBPMCzEbzspTgHYGqQ",
    authDomain: "medipath-c91bf.firebaseapp.com",
    projectId: "medipath-c91bf",
    storageBucket: "medipath-c91bf.firebasestorage.app",
    messagingSenderId: "236982445915",
    appId: "1:236982445915:web:50e12a30e5e9994ae2dc7e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CSV_PATH = "C:\\Users\\prana\\.cache\\kagglehub\\datasets\\kevinmathewsgeorge\\bangalore-doctors-dataset-from-practo\\versions\\1\\bangalore_doctors_final.csv";

const doctors = [];
let count = 0;

console.log('Reading CSV from:', CSV_PATH);

fs.createReadStream(CSV_PATH)
    .pipe(csv())
    .on('data', (data) => {
        // We limit seeding to the first 50 doctors for development purposes
        if (doctors.length < 50) {
            doctors.push({
                id: 'D-' + data.entry_id,
                name: data.name,
                specialty: data.specialty || 'General',
                degree: data.degree || 'MBBS',
                experience: data.experience_years ? parseInt(data.experience_years) : 0,
                fee: data.consultation_fee ? parseInt(data.consultation_fee) : 500,
                rating: data.rating ? parseFloat(data.rating) : 4.5,
                location: data.bangalore_location || 'Bangalore',
                latitude: data.latitude ? parseFloat(data.latitude) : 0,
                longitude: data.longitude ? parseFloat(data.longitude) : 0
            });
        }
    })
    .on('end', async () => {
        console.log(`Finished reading. Selected ${doctors.length} doctors. Seeding to Firestore...`);

        for (const docData of doctors) {
            try {
                const docRef = doc(db, 'doctors', docData.id);
                await setDoc(docRef, docData);
                count++;
                if (count % 10 === 0) console.log(`Seeded ${count} doctors...`);
            } catch (err) {
                console.error('Error seeding doctor:', docData.name, err);
            }
        }

        console.log(`Successfully seeded ${count} doctors into Firestore!`);
        // eslint-disable-next-line no-undef
        process.exit(0);
    });
