
// lib/db.ts
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('freelist.db'); // async-capable version
//-const db = SQLite.openDatabaseSync('another_thing.db');
// freelist, freelist2, another-thing  TODO NEED TO DELETE THESE
// these databases are empty, but they just have been dropped. Not sure if there is more that needs ot be done

export const initDb = async () => {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      details TEXT,
      done INTEGER,
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
  tag: string = '',
  parentId: number | null = null
) => {
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO tasks (title, details, done, due_date, is_recurring, estimated_duration, created_at, updated_at, tag, parent_id) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
    [title, details, dueDate, isRecurring, estimatedDuration, now, now, tag, parentId]
  );
};

export const fetchTasks = async (filter: 'all' | 'done' | 'todo' = 'all', tag?: string): Promise<{
  id: number;
  title: string;
  done: number;
  tag: string;
  due_date: string;
  parent_id: number | null;
}[]> => {
  let query = `SELECT id, title, done, tag, due_date, parent_id FROM tasks`;
  const conditions: string[] = [];
  const params: any[] = [];

  if (filter === 'done') {
    conditions.push(`done = 1`);
  } else if (filter === 'todo') {
    conditions.push(`done = 0`);
  }

  if (tag) {
    conditions.push(`tag = ?`);
    params.push(tag);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  query += ` ORDER BY created_at DESC`;

  const results = await db.getAllAsync(query, params);
  return results;
};

export const fetchAllTags = async (): Promise<string[]> => {
  const results = await db.getAllAsync(`SELECT DISTINCT tag FROM tasks WHERE tag IS NOT NULL AND tag != ''`);
  return results.map((row: { tag: string }) => row.tag);
};

export const markTaskDone = async (id: number, done: number) => {
  const now = new Date().toISOString();
  await db.runAsync(`UPDATE tasks SET done = ?, updated_at = ? WHERE id = ?`, [done, now, id]);
};

export const deleteTask = async (id: number) => {
  await db.runAsync(`DELETE FROM tasks WHERE id = ?`, [id]);
  await db.runAsync(`DELETE FROM tasks WHERE parent_id = ?`, [id]);
};

export const clearDatabase = async () => {
  await db.execAsync(`DROP TABLE IF EXISTS tasks;`);
  await initDb();
};

