import type { Timestamp } from 'firebase/firestore';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price?: string;
  price02?: string;
  price03?: string;
  type: string;
  picture?: string;
  section: string;
  order?: number;
  createdAt?: Timestamp | number;
  visible?: boolean;
}
