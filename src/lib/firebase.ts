import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  setLogLevel, 
  doc, 
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const customDbId = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? firebaseConfigJson.firestoreDatabaseId
  : undefined;

let firestoreDb;
try {
  firestoreDb = customDbId 
    ? initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      }, customDbId)
    : initializeFirestore(app, {
        experimentalForceLongPolling: true,
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
} catch (e) {
  firestoreDb = customDbId ? getFirestore(app, customDbId) : getFirestore(app);
}

export const db = firestoreDb;

// Silence verbose connection logs to prevent console alarm errors
setLogLevel('silent');

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system_settings', 'general'));
  } catch (_error) {
    // Silently ignore initial connection check error as Firestore handles offline cache transparently
  }
}

export default app;
