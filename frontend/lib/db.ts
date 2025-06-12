// lib/db.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('another_thing.db');
// freelist, freelist2,  TODO NEED TO DELETE THESE

export const initDb = async () => {
  db.execAsync(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      details TEXT,
      due_date TEXT,
      is_recurring INTEGER,
      estimated_duration INTEGER,
      last_duration INTEGER,
      tag TEXT,
      parent_id INTEGER,
      created_at TEXT,
      updated_at TEXT
    );`
  );
};

export const insertTask = async (
  title: string,
  details: string = '',
  dueDate: string = '',
  isRecurring: number = 0,
  estimatedDuration: number = 0,
  lastDuration: number = 0,
  tag: string = '',
  parentId: number | null = null

) => {
  try {
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO tasks (title, done, details, due_date, is_recurring, estimated_duration, last_duration, created_at, updated_at, tag, parent_id) 
       VALUES (?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, details, dueDate, isRecurring, estimatedDuration, lastDuration, tag, parentId, now, now]
    );
    console.log('[DB] Task inserted:', title);
  } catch (error) {
    console.error('[DB] Failed to insert task:', error);
  }
};

export const fetchTasks = async (): Promise<{
  id: number;
  title: string;
  done: number;
  tag: string;
  due_date: string;
  parent_id: number | null;
}[]> => {
  const results = await db.getAllAsync(
    `SELECT id, title, done, tag, due_date, parent_id FROM tasks ORDER BY created_at DESC`
  );
  return results;
};


//export const fetchTasks = async () => {
//  console.log("FETCHING FROM DB");
//  //data = await db.getAllAsync('SELECT * FROM tasks;');
//  data = await db.getAllAsync('PRAGMA table_info(tasks);');
//  console.log(data)
//  console.log("GOT DATA?")
//  return await db.getAllAsync('SELECT * FROM tasks;');
//};

export const markTaskDone = async (id: number, done: number) => {
  const now = new Date().toISOString();
  await db.runAsync(`UPDATE tasks SET done = ?, updated_at = ? WHERE id = ?`, [done, now, id]);
};

export const deleteTask = async (id: number) => {
  await db.runAsync(`DELETE FROM tasks WHERE id = ?`, [id]);
  await db.runAsync(`DELETE FROM tasks WHERE parent_id = ?`, [id]);
};

