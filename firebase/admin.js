import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

const decodedPrivateKey = Buffer.from(
    process.env.FIREBASE_PRIVATE_KEY,
    'base64'
).toString('utf-8');

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: decodedPrivateKey.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

export { bucket };
