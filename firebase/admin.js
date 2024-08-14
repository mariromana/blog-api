import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

console.log('FIREBASE_CONFIG:', process.env.FIREBASE_CONFIG);

let firebaseConfig;

try {
    const serviceAccountStr = process.env.FIREBASE_CONFIG.replace(/\\n/g, '\n');
    firebaseConfig = JSON.parse(serviceAccountStr);
    console.log('Service Account:', firebaseConfig);
} catch (error) {
    console.error('Error parsing JSON:', error);
}

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

export { bucket };
