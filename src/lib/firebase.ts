import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Question, QuestionBatch, MistakeItem } from '../types';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Configuration provided for the exam app
export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyAZUg0QkyXjFGRmX8GmGVXfBNNbDc3T9is",
  authDomain: firebaseAppletConfig.authDomain || "exam-e8e8d.firebaseapp.com",
  projectId: firebaseAppletConfig.projectId || "exam-e8e8d",
  storageBucket: firebaseAppletConfig.storageBucket || "exam-e8e8d.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "793391772218",
  appId: firebaseAppletConfig.appId || "1:793391772218:web:cf7af7f9d75493e1c8fb03",
  measurementId: firebaseAppletConfig.measurementId || "G-2KD9LEDE56"
};

// Initialize Firebase App
let app: firebase.app.App;
if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

// Initialize Cloud Firestore
export const db = firebase.firestore(app);

// Enable Offline Persistence so app works smoothly offline
if (typeof window !== 'undefined') {
  db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence is not supported by this browser');
    }
  });
}

// Test Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDoc = await db.collection('test').doc('connection').get();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn('Firestore running in offline persistence mode.');
    }
    return false;
  }
}

// Firestore Collection References
export const batchesCollection = db.collection('exam_batches');
export const mistakesCollection = db.collection('mistake_notebook');

/**
 * Save a question batch to Firestore
 */
export async function saveBatchToFirestore(
  batch: QuestionBatch,
  folderId: string,
  subjectId: string = 'pyq'
): Promise<void> {
  try {
    const batchTitle =
      batch.title ||
      batch.name ||
      (batch as any).setName ||
      (batch as any).set?.name ||
      (batch as any).set?.title ||
      'Batch 1';

    const payload = {
      id: batch.id,
      folderId: folderId || batch.folderId || 'general',
      subjectId: subjectId || batch.subjectId || 'pyq',
      name: batchTitle,
      title: batchTitle,
      description: batch.description || '',
      questions: batch.questions || [],
      questionCount: (batch.questions || []).length,
      createdAt: batch.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    await batchesCollection.doc(batch.id).set(payload, { merge: true });
  } catch (error) {
    console.error('Error saving batch to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a batch from Firestore
 */
export async function deleteBatchFromFirestore(batchId: string): Promise<void> {
  try {
    await batchesCollection.doc(batchId).delete();
  } catch (error) {
    console.error('Error deleting batch from Firestore:', error);
    throw error;
  }
}

/**
 * Save a Mistake Notebook entry to Firestore
 */
export async function saveMistakeToFirestore(item: MistakeItem): Promise<void> {
  try {
    await mistakesCollection.doc(item.id).set(item, { merge: true });
  } catch (error) {
    console.error('Error saving mistake to Firestore:', error);
    throw error;
  }
}

/**
 * Delete a Mistake Notebook entry from Firestore
 */
export async function deleteMistakeFromFirestore(mistakeId: string): Promise<void> {
  try {
    await mistakesCollection.doc(mistakeId).delete();
  } catch (error) {
    console.error('Error deleting mistake from Firestore:', error);
    throw error;
  }
}

/**
 * Real-time Two-Way Sync for Question Batches
 */
export function subscribeToBatches(
  callback: (
    batchesByFolder: Record<string, QuestionBatch[]>,
    allCustomQuestions: Question[]
  ) => void
): () => void {
  return batchesCollection.onSnapshot(
    (snapshot) => {
      const folderMap: Record<string, QuestionBatch[]> = {};
      const questionsList: Question[] = [];

      snapshot.docs.forEach((doc) => {
        const data = doc.data() as any;
        const folderId = data.folderId || 'pyq-2025-exams';
        const batchTitle =
          data.title ||
          data.name ||
          data.setName ||
          data.set?.name ||
          data.set?.title ||
          'Batch 1';

        const normalizedBatch: QuestionBatch = {
          ...data,
          title: batchTitle,
          name: batchTitle,
        };

        if (!folderMap[folderId]) {
          folderMap[folderId] = [];
        }
        folderMap[folderId].push(normalizedBatch);

        if (Array.isArray(data.questions)) {
          data.questions.forEach((q: Question) => {
            questionsList.push(q);
          });
        }
      });

      callback(folderMap, questionsList);
    },
    (error) => {
      console.warn('Batches Firestore snapshot listener warning:', error);
    }
  );
}

/**
 * Real-time Two-Way Sync for Mistake Notebook
 */
export function subscribeToMistakes(
  callback: (mistakes: MistakeItem[]) => void
): () => void {
  return mistakesCollection.onSnapshot(
    (snapshot) => {
      const items: MistakeItem[] = [];
      snapshot.docs.forEach((doc) => {
        items.push(doc.data() as MistakeItem);
      });
      // Sort by savedAt descending
      items.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
      callback(items);
    },
    (error) => {
      console.warn('Mistakes Firestore snapshot listener warning:', error);
    }
  );
}
