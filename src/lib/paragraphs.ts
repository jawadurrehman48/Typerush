
import { Firestore, collection, getDocs, query, where, documentId } from 'firebase/firestore';

const paragraphsCol = 'paragraphs';

export const getRandomParagraph = async (db: Firestore, excludeId: string | null = null) => {
  try {
    let q = query(collection(db, paragraphsCol));

    // This is not perfectly efficient, but for a small number of paragraphs it's fine.
    // A more scalable solution would involve a Cloud Function to pick a random one.
    if (excludeId) {
      q = query(q, where(documentId(), "!=", excludeId));
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
       // If filtering left no paragraphs, query again without the exclusion
       const allDocsSnapshot = await getDocs(collection(db, paragraphsCol));
       if (allDocsSnapshot.empty) {
         return { paragraph: "No paragraphs found in the database. Please add some.", id: 'none' };
       }
       const randomIndex = Math.floor(Math.random() * allDocsSnapshot.docs.length);
       const doc = allDocsSnapshot.docs[randomIndex];
       return { paragraph: doc.data().text, id: doc.id };
    }

    const randomIndex = Math.floor(Math.random() * querySnapshot.docs.length);
    const doc = querySnapshot.docs[randomIndex];
    
    return { paragraph: doc.data().text, id: doc.id };
  } catch (error) {
    console.error("Error fetching paragraph:", error);
    // Fallback to a hardcoded paragraph if Firestore fails
    return { paragraph: "The quick brown fox jumps over the lazy dog. This sentence contains all the letters of the alphabet. It is often used for practicing touch typing.", id: 'fallback' };
  }
};
