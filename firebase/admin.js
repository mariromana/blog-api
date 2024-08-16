import admin from 'firebase-admin';
import { config } from 'dotenv';

config();

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

export { bucket };
