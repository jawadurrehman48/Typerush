
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { paragraphs } from '../src/lib/words';
import { firebaseConfig } from '../src/firebase/config';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function seedDatabase() {
  try {
    console.log('Initializing Firebase Admin SDK...');

    // Check for service account credentials
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY is not set in .env.local. Please provide your Firebase service account credentials.'
      );
    }
    
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    initializeApp({
      credential: cert(serviceAccount),
      projectId: firebaseConfig.projectId,
    });

    const db = getFirestore();
    console.log('Firebase Admin SDK initialized successfully.');

    const paragraphsCollection = db.collection('paragraphs');
    const batch = db.batch();

    console.log(`Preparing to seed ${paragraphs.length} paragraphs...`);

    let count = 0;
    for (const paragraphText of paragraphs) {
      // Check if a paragraph with the same text already exists
      const existingDoc = await paragraphsCollection.where('text', '==', paragraphText).limit(1).get();
      
      if (existingDoc.empty) {
        const docRef = paragraphsCollection.doc();
        batch.set(docRef, { text: paragraphText });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`Successfully seeded ${count} new paragraphs into the database.`);
    } else {
      console.log('No new paragraphs to seed. The database is already up-to-date.');
    }

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
