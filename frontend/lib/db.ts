import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('freelist.db');

export const initDb = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      due_date TEXT,
      tags TEXT,
      estimated_minutes INTEGER
    );
  `);
};

export const insertTask = async (title: string, done = 0) => {
  await db.runAsync('INSERT INTO tasks (title, done) VALUES (?, ?)', [title, done]);
};

export const fetchTasks = async () => {
  return await db.getAllAsync('SELECT * FROM tasks;');
};

export const markTaskDone = async (id: number, done = 1) => {
  await db.runAsync('UPDATE tasks SET done = ? WHERE id = ?', [done, id]);
};

export const deleteTask = async (id: number) => {
  await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
};
