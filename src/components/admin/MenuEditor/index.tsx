import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ImageUploader from '../ImageUploader';
import styles from './MenuEditor.module.css';

// ... остальной код без изменений ...
