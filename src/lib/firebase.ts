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
  showSupportTab: boolean;
  showQueueTab: boolean;
  gameDuration: number;
  manualQueue: boolean;
  customLogoUrl?: string;
  useCustomLogo?: boolean;
  colors?: {
    useCustomColors?: boolean;
    queue?: {
      pageBg?: string;
      cardBg1?: string;
      cardBg2?: string;
      text?: string;
      joinButtonBg?: string;
      adminModalBg?: string;
      adminModalText?: string;
      adminModalTopBtnBg?: string;
      adminModalTopBtnText?: string;
      adminModalBottomBtnBg?: string;
      adminModalBottomBtnText?: string;
      infoModalText?: string;
      logoUseTextColor?: boolean;
    };
    menu?: {
      pageBg?: string;
      text?: string;
      logoUseTextColor?: boolean;
    };
  };
}

export interface DonationGoal {
  id: string;
  name: string;
  targetAmount: number;
  description: string;
  currentAmount: number;
  donations: Donation[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface DonationGoalInput {
  name: string;
  targetAmount: number;
  description: string;
  isActive: boolean;
}

export interface Donation {
  id: string;
  donaterName: string;
  donatedValue: number;
  status: 'created' | 'done' | 'fail' | 'cancel';
  createdAt: Date;
}

export interface SupportScheme {
  title: string;
  description: string;
  payLink: string;
  imageUrl?: string;
  updatedAt: Date;
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

export async function getDonationGoals(): Promise<DonationGoal[]> {
  const goalsRef = collection(db, 'donationGoals');
  const snapshot = await getDocs(goalsRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
  })) as DonationGoal[];
}

export async function saveDonationGoal(
  goalInput: DonationGoalInput & {
    id: string;
    currentAmount: number;
    donations: Donation[];
  }
): Promise<void> {
  const now = new Date();
  const goalWithTimestamps = {
    ...goalInput,
    createdAt: now,
    updatedAt: now,
  };
  const ref = doc(db, 'donationGoals', goalInput.id);
  await setDoc(ref, goalWithTimestamps, { merge: true });
}

export async function updateDonationGoal(goal: DonationGoal): Promise<void> {
  const updatedGoal = {
    ...goal,
    updatedAt: new Date(),
  };
  const ref = doc(db, 'donationGoals', goal.id);
  await setDoc(ref, updatedGoal, { merge: true });
}

export async function updateDonationStatus(
  donationId: string,
  status: 'done' | 'fail' | 'cancel'
): Promise<void> {
  // Найти donation в goals и обновить его статус
  const goals = await getDonationGoals();
  for (const goal of goals) {
    const donationIndex = goal.donations.findIndex(d => d.id === donationId);
    if (donationIndex !== -1) {
      const updatedDonations = [...goal.donations];
      updatedDonations[donationIndex] = {
        ...updatedDonations[donationIndex],
        status,
      };

      const updatedGoal = {
        ...goal,
        donations: updatedDonations,
        updatedAt: new Date(),
      };

      await updateDonationGoal(updatedGoal);
      break;
    }
  }
}

export async function hasOwnerAdmin(): Promise<boolean> {
  const qy = query(collection(db, 'admins'), where('owner', '==', true));
  const snapshot = await getDocs(qy);
  return !snapshot.empty;
}

export async function isAdminOwner(username: string): Promise<boolean> {
  if (!username) return false;
  const qy = query(
    collection(db, 'admins'),
    where('username', '==', username),
    where('owner', '==', true)
  );
  const snapshot = await getDocs(qy);
  return !snapshot.empty;
}

export async function getSupportScheme(): Promise<SupportScheme | null> {
  const ref = doc(db, 'config', 'supportScheme');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<SupportScheme, 'updatedAt'> & {
    updatedAt?: { toDate?: () => Date } | Date;
  };
  const maybeTs = data.updatedAt as { toDate?: () => Date } | Date | undefined;
  let updatedAt: Date;
  if (
    maybeTs &&
    typeof (maybeTs as { toDate?: () => Date }).toDate === 'function'
  ) {
    updatedAt = (maybeTs as { toDate: () => Date }).toDate();
  } else if (maybeTs instanceof Date) {
    updatedAt = maybeTs;
  } else {
    updatedAt = new Date();
  }
  return {
    title: data.title || '',
    description: data.description || '',
    payLink: data.payLink || '',
    imageUrl: data.imageUrl || '',
    updatedAt,
  } as SupportScheme;
}

export async function setSupportScheme(input: {
  title: string;
  description: string;
  payLink: string;
  imageUrl?: string;
}): Promise<void> {
  const ref = doc(db, 'config', 'supportScheme');
  await setDoc(
    ref,
    {
      title: input.title || '',
      description: input.description || '',
      payLink: input.payLink || '',
      imageUrl: input.imageUrl || '',
      updatedAt: new Date(),
    },
    { merge: true }
  );
}
