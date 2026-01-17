import fp from 'fastify-plugin';
import admin from 'firebase-admin';
import fs from 'fs';
export default fp(async (fastify) => {
    const path = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!path) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not defined');
    }
    const serviceAccount = JSON.parse(fs.readFileSync(path, 'utf-8'));
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    fastify.decorate('fcm', admin.messaging());
});
