import trainingsData from '../Trainings_normalized_bodyweight.json';

import { bulkImport, clearAllData, getWorkoutStats } from './database';

// Generate a date going backwards from today (one session per week)
function generateSessionDate(sessionIndex: number, totalSessions: number): string {
  const today = new Date();
  // Start from the oldest session and go forward
  // So session_1 is the oldest, session_39 is the most recent
  const weeksAgo = totalSessions - sessionIndex - 1;
  const sessionDate = new Date(today);
  sessionDate.setDate(today.getDate() - weeksAgo * 7);
  return sessionDate.toISOString();
}

export type ImportStats = {
  totalSessions: number;
  totalSets: number;
  uniqueExercises: number;
  dateRange: { from: string; to: string };
};

export function getImportPreview(): ImportStats {
  const totalSessions = trainingsData.workouts.length;

  // Count total sets and unique exercises
  let totalSets = 0;
  const uniqueExercises = new Set<string>();

  trainingsData.workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      uniqueExercises.add(`${exercise.name}|${exercise.category}`);
      // Count only valid sets (not raw unparsed ones)
      exercise.sets.forEach((set) => {
        if (!('raw' in set)) {
          totalSets++;
        }
      });
    });
  });

  // Calculate date range
  const fromDate = generateSessionDate(0, totalSessions);
  const toDate = generateSessionDate(totalSessions - 1, totalSessions);

  return {
    totalSessions,
    totalSets,
    uniqueExercises: uniqueExercises.size,
    dateRange: {
      from: new Date(fromDate).toLocaleDateString(),
      to: new Date(toDate).toLocaleDateString(),
    },
  };
}

export async function importTrainingsToDatabase(clearExisting: boolean = true): Promise<{
  workoutsCreated: number;
  exercisesCreated: number;
  setsCreated: number;
}> {
  // Optionally clear existing data
  if (clearExisting) {
    await clearAllData();
  }

  const totalSessions = trainingsData.workouts.length;

  // Prepare data for bulk import
  const workouts: { date: string; notes?: string }[] = [];
  const exercises: { name: string; category: string }[] = [];
  const sets: {
    workoutIndex: number;
    exerciseName: string;
    exerciseCategory: string;
    weight: number;
    reps: number;
    loadType: 'weighted' | 'bodyweight';
    setOrder: number;
  }[] = [];

  // Track unique exercises
  const exerciseSet = new Set<string>();

  // Process each workout session
  trainingsData.workouts.forEach((workout, workoutIndex) => {
    const sessionDate = generateSessionDate(workoutIndex, totalSessions);

    // Add workout
    workouts.push({
      date: sessionDate,
      notes: `Imported from session ${workout.session_id}`,
    });

    // Track set order within the workout
    let setOrder = 0;

    // Process each exercise in the session
    workout.exercises.forEach((exercise) => {
      const exerciseKey = `${exercise.name}|${exercise.category}`;

      // Add exercise if not already added
      if (!exerciseSet.has(exerciseKey)) {
        exerciseSet.add(exerciseKey);
        exercises.push({
          name: exercise.name,
          category: exercise.category,
        });
      }

      // Add each set
      exercise.sets.forEach((set) => {
        // Skip unparsed raw sets
        if ('raw' in set) {
          return;
        }

        const isBodyweight =
          set.weight === null || ('loadType' in set && set.loadType === 'bodyweight');

        sets.push({
          workoutIndex,
          exerciseName: exercise.name,
          exerciseCategory: exercise.category,
          weight: isBodyweight ? 1 : set.weight,
          reps: set.reps,
          loadType: isBodyweight ? 'bodyweight' : 'weighted',
          setOrder: setOrder++,
        });
      });
    });
  });

  // Perform bulk import
  const result = await bulkImport({ workouts, exercises, sets });

  return result;
}

// Get current database stats (for comparison)
export async function getDatabaseStats() {
  return await getWorkoutStats();
}
