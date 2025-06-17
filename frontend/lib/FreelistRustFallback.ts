// frontend/lib/FreelistRustFallback.ts
// Fallback implementation using the old SQLite approach for development

import * as SQLite from 'expo-sqlite';

export interface Task {
  id: number;
  title: string;
  details?: string;
  done: boolean;
  due_date?: string;
  is_recurring: boolean;
  estimated_duration?: number;
  last_duration?: number;
  tag?: string;
  parent_id?: number;
  created_at: string;
  updated_at: string;
}

class FreelistRustFallback {
  private db: SQLite.SQLiteDatabase;
  private initialized = false;

  constructor() {
    this.db = SQLite.openDatabaseSync('freelist_fallback.db');
  }

  async initialize(dbPath?: string): Promise<void> {
    if (this.initialized) return;
    
    console.log('🔄 Using fallback SQLite implementation');
    
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS tasks (
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
      );
    `);
    
    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('FreelistRust fallback not initialized. Call initialize() first.');
    }
  }

  async addTask(title: string, tag?: string, dueDate?: string): Promise<number> {
    this.ensureInitialized();
    
    const now = new Date().toISOString();
    const result = await this.db.runAsync(
      `INSERT INTO tasks (title, details, done, due_date, is_recurring, estimated_duration, created_at, updated_at, tag, parent_id) VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, ?)`,
      [title, '', dueDate || '', 0, 0, now, now, tag || '', null]
    );
    
    return result.lastInsertRowId;
  }

  async getTasks(filter: 'all' | 'todo' | 'done' = 'all'): Promise<Task[]> {
    this.ensureInitialized();
    
    let query = `SELECT id, title, details, done, due_date, is_recurring, estimated_duration, last_duration, tag, parent_id, created_at, updated_at FROM tasks`;
    const params: any[] = [];

    if (filter === 'done') {
      query += ` WHERE done = 1`;
    } else if (filter === 'todo') {
      query += ` WHERE done = 0`;
    }

    query += ` ORDER BY created_at DESC`;

    const results = await this.db.getAllAsync(query, params);
    
    return results.map((row: any) => ({
      id: row.id,
      title: row.title,
      details: row.details || undefined,
      done: row.done === 1,
      due_date: row.due_date || undefined,
      is_recurring: row.is_recurring === 1,
      estimated_duration: row.estimated_duration || undefined,
      last_duration: row.last_duration || undefined,
      tag: row.tag || undefined,
      parent_id: row.parent_id || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async getTasksByTag(tag: string): Promise<Task[]> {
    this.ensureInitialized();
    
    const results = await this.db.getAllAsync(
      `SELECT id, title, details, done, due_date, is_recurring, estimated_duration, last_duration, tag, parent_id, created_at, updated_at FROM tasks WHERE tag = ? ORDER BY created_at DESC`,
      [tag]
    );
    
    return results.map((row: any) => ({
      id: row.id,
      title: row.title,
      details: row.details || undefined,
      done: row.done === 1,
      due_date: row.due_date || undefined,
      is_recurring: row.is_recurring === 1,
      estimated_duration: row.estimated_duration || undefined,
      last_duration: row.last_duration || undefined,
      tag: row.tag || undefined,
      parent_id: row.parent_id || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async markTaskDone(id: number, done: boolean = true): Promise<void> {
    this.ensureInitialized();
    
    const now = new Date().toISOString();
    await this.db.runAsync(
      `UPDATE tasks SET done = ?, updated_at = ? WHERE id = ?`,
      [done ? 1 : 0, now, id]
    );
  }

  async markTaskUndone(id: number): Promise<void> {
    return this.markTaskDone(id, false);
  }

  async deleteTask(id: number): Promise<void> {
    this.ensureInitialized();
    
    await this.db.runAsync(`DELETE FROM tasks WHERE id = ?`, [id]);
    await this.db.runAsync(`DELETE FROM tasks WHERE parent_id = ?`, [id]);
  }

  async getAllTags(): Promise<string[]> {
    this.ensureInitialized();
    
    const results = await this.db.getAllAsync(
      `SELECT DISTINCT tag FROM tasks WHERE tag IS NOT NULL AND tag != ''`
    );
    
    return results.map((row: any) => row.tag);
  }

  async clearAllTasks(): Promise<void> {
    this.ensureInitialized();
    
    await this.db.execAsync(`DELETE FROM tasks;`);
  }
}

export const freelistFallback = new FreelistRustFallback();
