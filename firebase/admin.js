import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

console.log('FIREBASE_CONFIG:', process.env.FIREBASE_CONFIG);
const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

console.log('PARSE:', firebaseConfig);

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

export { bucket };
