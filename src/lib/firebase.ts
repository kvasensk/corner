import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };

export interface PlatformConfig {
  showMenuTab: boolean;
  showQueueTab: boolean;
  gameDuration: number;
  manualQueue: boolean;
  customLogoUrl?: string;
  useCustomLogo?: boolean;
}

export async function authorizeAdmin(
  username: string,
  password: string
): Promise<boolean> {
  const q = query(collection(db, 'admins'), where('username', '==', username));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return false;
  }
  const doc = snapshot.docs[0];
  const data = doc.data();
  return data.password === password;
}

export async function getPlatformConfig(): Promise<PlatformConfig | null> {
  const ref = doc(db, 'config', 'platform');
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as PlatformConfig) : null;
}

export async function setPlatformConfig(config: PlatformConfig): Promise<void> {
  const ref = doc(db, 'config', 'platform');
  await setDoc(ref, config, { merge: true });
}

export async function getMenuItems() {
  const itemsRef = collection(db, 'menu', 'items', 'items');
  const snapshot = await getDocs(itemsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
