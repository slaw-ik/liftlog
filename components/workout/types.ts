import { Exercise } from '@/lib/database';

export type WorkoutSection = {
  id: string;
  name: string;
  exercises: Exercise[];
};
