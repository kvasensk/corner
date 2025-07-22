import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyD-KH-UZlJ54Jv8Rk_PsaVUm_eZFycfvZE',
  authDomain: 'billiard-56ce2.firebaseapp.com',
  projectId: 'billiard-56ce2',
  storageBucket: 'billiard-56ce2.firebasestorage.app',
  messagingSenderId: '872814493903',
  appId: '1:872814493903:web:0e1a41b86aef83c15937ba',
  measurementId: 'G-SXG42XBNH7',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
