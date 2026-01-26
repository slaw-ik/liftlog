import * as SQLite from 'expo-sqlite';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// ============================================================================
// Types
// ============================================================================

export type Workout = {
  id: number;
  date: string; // ISO string
  notes: string | null;
  created_at: string;
};

export type Exercise = {
  id: number;
  name: string;
  category: string; // ТЯГИ, ЖИМЫ, НОГИ
  created_at: string;
};

export type WorkoutSet = {
  id: number;
  workout_id: number;
  exercise_id: number;
  weight: number;
  reps: number;
  load_type: 'weighted' | 'bodyweight';
  set_order: number;
  created_at: string;
};

// Joined type for display
export type SetWithDetails = WorkoutSet & {
  exercise_name: string;
  exercise_category: string;
  workout_date: string;
};

// ============================================================================
// Database Initialization
// ============================================================================

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  db = await SQLite.openDatabaseAsync('liftlog.db');
  await initializeSchema();
  return db;
}

async function initializeSchema(): Promise<void> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Workouts table (workout sessions)
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Exercises table (exercise definitions)
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(name, category)
    );

    -- Sets table (individual sets logged)
    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      weight REAL NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL,
      load_type TEXT NOT NULL DEFAULT 'weighted',
      set_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    );

    -- Indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_sets_workout ON sets(workout_id);
    CREATE INDEX IF NOT EXISTS idx_sets_exercise ON sets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
    CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
  `);
}

// ============================================================================
// Workout Operations
// ============================================================================

export async function createWorkout(date: string, notes?: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync('INSERT INTO workouts (date, notes) VALUES (?, ?)', [
    date,
    notes ?? null,
  ]);
  return result.lastInsertRowId;
}

export async function getWorkout(id: number): Promise<Workout | null> {
  const database = await getDatabase();
  return await database.getFirstAsync<Workout>('SELECT * FROM workouts WHERE id = ?', [id]);
}

export async function getAllWorkouts(): Promise<Workout[]> {
  const database = await getDatabase();
  return await database.getAllAsync<Workout>('SELECT * FROM workouts ORDER BY date DESC');
}

export async function getWorkoutsByDateRange(from: string, to: string): Promise<Workout[]> {
  const database = await getDatabase();
  return await database.getAllAsync<Workout>(
    'SELECT * FROM workouts WHERE date BETWEEN ? AND ? ORDER BY date DESC',
    [from, to]
  );
}

export async function updateWorkout(id: number, date: string, notes?: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE workouts SET date = ?, notes = ? WHERE id = ?', [
    date,
    notes ?? null,
    id,
  ]);
}

export async function deleteWorkout(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM workouts WHERE id = ?', [id]);
}

// ============================================================================
// Exercise Operations
// ============================================================================

export async function createExercise(name: string, category: string): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT OR IGNORE INTO exercises (name, category) VALUES (?, ?)',
    [name, category]
  );

  // If insert was ignored (duplicate), get the existing ID
  if (result.lastInsertRowId === 0) {
    const existing = await database.getFirstAsync<Exercise>(
      'SELECT id FROM exercises WHERE name = ? AND category = ?',
      [name, category]
    );
    return existing?.id ?? 0;
  }

  return result.lastInsertRowId;
}

export async function getOrCreateExercise(name: string, category: string): Promise<number> {
  const database = await getDatabase();

  // Try to get existing
  const existing = await database.getFirstAsync<Exercise>(
    'SELECT id FROM exercises WHERE name = ? AND category = ?',
    [name, category]
  );

  if (existing) {
    return existing.id;
  }

  // Create new
  const result = await database.runAsync('INSERT INTO exercises (name, category) VALUES (?, ?)', [
    name,
    category,
  ]);
  return result.lastInsertRowId;
}

export async function getExercise(id: number): Promise<Exercise | null> {
  const database = await getDatabase();
  return await database.getFirstAsync<Exercise>('SELECT * FROM exercises WHERE id = ?', [id]);
}

export async function getAllExercises(): Promise<Exercise[]> {
  const database = await getDatabase();
  return await database.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY category, name');
}

export async function getExercisesByCategory(category: string): Promise<Exercise[]> {
  const database = await getDatabase();
  return await database.getAllAsync<Exercise>(
    'SELECT * FROM exercises WHERE category = ? ORDER BY name',
    [category]
  );
}

export async function getCategories(): Promise<string[]> {
  const database = await getDatabase();
  const results = await database.getAllAsync<{ category: string }>(
    'SELECT DISTINCT category FROM exercises ORDER BY category'
  );
  return results.map((r) => r.category);
}

export async function updateExercise(id: number, name: string, category: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE exercises SET name = ?, category = ? WHERE id = ?', [
    name,
    category,
    id,
  ]);
}

export async function deleteExercise(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
}

// ============================================================================
// Set Operations
// ============================================================================

export async function createSet(
  workoutId: number,
  exerciseId: number,
  weight: number,
  reps: number,
  loadType: 'weighted' | 'bodyweight' = 'weighted',
  setOrder: number = 0
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO sets (workout_id, exercise_id, weight, reps, load_type, set_order) VALUES (?, ?, ?, ?, ?, ?)',
    [workoutId, exerciseId, weight, reps, loadType, setOrder]
  );
  return result.lastInsertRowId;
}

export async function getSet(id: number): Promise<WorkoutSet | null> {
  const database = await getDatabase();
  return await database.getFirstAsync<WorkoutSet>('SELECT * FROM sets WHERE id = ?', [id]);
}

export async function getSetsByWorkout(workoutId: number): Promise<SetWithDetails[]> {
  const database = await getDatabase();
  return await database.getAllAsync<SetWithDetails>(
    `
    SELECT 
      s.*,
      e.name as exercise_name,
      e.category as exercise_category,
      w.date as workout_date
    FROM sets s
    JOIN exercises e ON s.exercise_id = e.id
    JOIN workouts w ON s.workout_id = w.id
    WHERE s.workout_id = ?
    ORDER BY s.set_order, s.created_at
  `,
    [workoutId]
  );
}

export async function getSetsByExercise(exerciseId: number): Promise<SetWithDetails[]> {
  const database = await getDatabase();
  return await database.getAllAsync<SetWithDetails>(
    `
    SELECT 
      s.*,
      e.name as exercise_name,
      e.category as exercise_category,
      w.date as workout_date
    FROM sets s
    JOIN exercises e ON s.exercise_id = e.id
    JOIN workouts w ON s.workout_id = w.id
    WHERE s.exercise_id = ?
    ORDER BY w.date DESC, s.set_order
  `,
    [exerciseId]
  );
}

export async function getAllSetsWithDetails(limit?: number): Promise<SetWithDetails[]> {
  const database = await getDatabase();
  const query = `
    SELECT 
      s.*,
      e.name as exercise_name,
      e.category as exercise_category,
      w.date as workout_date
    FROM sets s
    JOIN exercises e ON s.exercise_id = e.id
    JOIN workouts w ON s.workout_id = w.id
    ORDER BY w.date DESC, s.set_order
    ${limit ? `LIMIT ${limit}` : ''}
  `;
  return await database.getAllAsync<SetWithDetails>(query);
}

export async function updateSet(
  id: number,
  weight: number,
  reps: number,
  loadType?: 'weighted' | 'bodyweight'
): Promise<void> {
  const database = await getDatabase();
  if (loadType) {
    await database.runAsync('UPDATE sets SET weight = ?, reps = ?, load_type = ? WHERE id = ?', [
      weight,
      reps,
      loadType,
      id,
    ]);
  } else {
    await database.runAsync('UPDATE sets SET weight = ?, reps = ? WHERE id = ?', [
      weight,
      reps,
      id,
    ]);
  }
}

export async function deleteSet(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM sets WHERE id = ?', [id]);
}

// ============================================================================
// Statistics & Aggregations
// ============================================================================

export async function getWorkoutStats(): Promise<{
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  uniqueExercises: number;
}> {
  const database = await getDatabase();

  const stats = await database.getFirstAsync<{
    totalWorkouts: number;
    totalSets: number;
    totalVolume: number;
    uniqueExercises: number;
  }>(`
    SELECT
      (SELECT COUNT(*) FROM workouts) as totalWorkouts,
      (SELECT COUNT(*) FROM sets) as totalSets,
      (SELECT COALESCE(SUM(weight * reps), 0) FROM sets) as totalVolume,
      (SELECT COUNT(*) FROM exercises) as uniqueExercises
  `);

  return stats ?? { totalWorkouts: 0, totalSets: 0, totalVolume: 0, uniqueExercises: 0 };
}

export async function getWeeklyStats(): Promise<{
  sets: number;
  volume: number;
  days: number;
}> {
  const database = await getDatabase();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();

  const stats = await database.getFirstAsync<{
    sets: number;
    volume: number;
    days: number;
  }>(
    `
    SELECT
      COUNT(s.id) as sets,
      COALESCE(SUM(s.weight * s.reps), 0) as volume,
      COUNT(DISTINCT date(w.date)) as days
    FROM sets s
    JOIN workouts w ON s.workout_id = w.id
    WHERE w.date >= ?
  `,
    [weekAgoStr]
  );

  return stats ?? { sets: 0, volume: 0, days: 0 };
}

export async function getTodaySets(): Promise<SetWithDetails[]> {
  const database = await getDatabase();
  const today = new Date().toISOString().split('T')[0];

  return await database.getAllAsync<SetWithDetails>(
    `
    SELECT 
      s.*,
      e.name as exercise_name,
      e.category as exercise_category,
      w.date as workout_date
    FROM sets s
    JOIN exercises e ON s.exercise_id = e.id
    JOIN workouts w ON s.workout_id = w.id
    WHERE date(w.date) = ?
    ORDER BY s.created_at DESC
  `,
    [today]
  );
}

export async function getExerciseMaxWeight(exerciseId: number): Promise<number> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ max: number }>(
    'SELECT MAX(weight) as max FROM sets WHERE exercise_id = ?',
    [exerciseId]
  );
  return result?.max ?? 0;
}

// ============================================================================
// Bulk Operations (for import)
// ============================================================================

export async function bulkImport(data: {
  workouts: { date: string; notes?: string }[];
  exercises: { name: string; category: string }[];
  sets: {
    workoutIndex: number; // Index into workouts array
    exerciseName: string;
    exerciseCategory: string;
    weight: number;
    reps: number;
    loadType: 'weighted' | 'bodyweight';
    setOrder: number;
  }[];
}): Promise<{ workoutsCreated: number; exercisesCreated: number; setsCreated: number }> {
  const database = await getDatabase();

  let workoutsCreated = 0;
  let exercisesCreated = 0;
  let setsCreated = 0;

  // Use a transaction for better performance
  await database.withTransactionAsync(async () => {
    // 1. Create all workouts and map indices to IDs
    const workoutIdMap: number[] = [];
    for (const workout of data.workouts) {
      const result = await database.runAsync('INSERT INTO workouts (date, notes) VALUES (?, ?)', [
        workout.date,
        workout.notes ?? null,
      ]);
      workoutIdMap.push(result.lastInsertRowId);
      workoutsCreated++;
    }

    // 2. Create exercises and build name+category -> id map
    const exerciseIdMap = new Map<string, number>();
    for (const exercise of data.exercises) {
      const key = `${exercise.name}|${exercise.category}`;
      if (!exerciseIdMap.has(key)) {
        const existing = await database.getFirstAsync<{ id: number }>(
          'SELECT id FROM exercises WHERE name = ? AND category = ?',
          [exercise.name, exercise.category]
        );

        if (existing) {
          exerciseIdMap.set(key, existing.id);
        } else {
          const result = await database.runAsync(
            'INSERT INTO exercises (name, category) VALUES (?, ?)',
            [exercise.name, exercise.category]
          );
          exerciseIdMap.set(key, result.lastInsertRowId);
          exercisesCreated++;
        }
      }
    }

    // 3. Create all sets
    for (const set of data.sets) {
      const workoutId = workoutIdMap[set.workoutIndex];
      const exerciseKey = `${set.exerciseName}|${set.exerciseCategory}`;
      const exerciseId = exerciseIdMap.get(exerciseKey);

      if (workoutId && exerciseId) {
        await database.runAsync(
          'INSERT INTO sets (workout_id, exercise_id, weight, reps, load_type, set_order) VALUES (?, ?, ?, ?, ?, ?)',
          [workoutId, exerciseId, set.weight, set.reps, set.loadType, set.setOrder]
        );
        setsCreated++;
      }
    }
  });

  return { workoutsCreated, exercisesCreated, setsCreated };
}

// ============================================================================
// Data Management
// ============================================================================

export async function clearAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM sets;
    DELETE FROM exercises;
    DELETE FROM workouts;
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

// ============================================================================
// Default Data Seeding
// ============================================================================

export type DefaultExerciseDefinition = {
  name: string;
  category: string;
};

export async function seedDefaultExercises(
  exercises: DefaultExerciseDefinition[]
): Promise<number> {
  const database = await getDatabase();
  let created = 0;

  await database.withTransactionAsync(async () => {
    for (const exercise of exercises) {
      const existing = await database.getFirstAsync<{ id: number }>(
        'SELECT id FROM exercises WHERE name = ? AND category = ?',
        [exercise.name, exercise.category]
      );

      if (!existing) {
        await database.runAsync('INSERT INTO exercises (name, category) VALUES (?, ?)', [
          exercise.name,
          exercise.category,
        ]);
        created++;
      }
    }
  });

  return created;
}

export async function hasExercises(): Promise<boolean> {
  const database = await getDatabase();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM exercises'
  );
  return (result?.count ?? 0) > 0;
}
