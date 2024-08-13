import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

export { bucket };
