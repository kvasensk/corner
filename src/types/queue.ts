export interface QueueEntry {
  id: string;
  name: string;
  time: string;
  status: 'waiting' | 'playing' | 'done';
}
