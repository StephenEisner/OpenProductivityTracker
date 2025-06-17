// frontend/lib/FreelistRust.ts
import { NativeModules } from 'react-native';
import { freelistFallback } from './FreelistRustFallback';

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

interface FreelistRustNativeModule {
  initializeDatabase(dbPath?: string): Promise<string>;
  addTask(title: string, tag?: string, dueDate?: string): Promise<number>;
  getTasks(filter: 'all' | 'todo' | 'done'): Promise<Task[]>;
  getTasksByTag(tag: string): Promise<Task[]>;
  markTaskDone(id: number, done: boolean): Promise<string>;
  deleteTask(id: number): Promise<string>;
  getAllTags(): Promise<string[]>;
  clearAllTasks(): Promise<string>;
}

const { FreelistRust } = NativeModules;

class FreelistRustAPI {
  private initialized = false;
  private useNative = false;

  constructor() {
    // Check if native module is available
    this.useNative = !!FreelistRust;
    
    if (this.useNative) {
      console.log('✅ Using native Rust module');
    } else {
      console.log('⚠️  Native module not found, using SQLite fallback');
    }
  }

  async initialize(dbPath?: string): Promise<void> {
    if (this.initialized) return;
    
    try {
      if (this.useNative) {
        await FreelistRust.initializeDatabase(dbPath);
        console.log('✅ Native Rust module initialized');
      } else {
        await freelistFallback.initialize(dbPath);
        console.log('✅ SQLite fallback initialized');
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize:', error);
      
      // If native fails, try fallback
      if (this.useNative) {
        console.log('🔄 Native module failed, trying SQLite fallback...');
        this.useNative = false;
        await freelistFallback.initialize(dbPath);
        this.initialized = true;
      } else {
        throw error;
      }
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('FreelistRust not initialized. Call initialize() first.');
    }
  }

  async addTask(title: string, tag?: string, dueDate?: string): Promise<number> {
    this.ensureInitialized();
    
    if (this.useNative) {
      return FreelistRust.addTask(title, tag || '', dueDate || '');
    } else {
      return freelistFallback.addTask(title, tag, dueDate);
    }
  }

  async getTasks(filter: 'all' | 'todo' | 'done' = 'all'): Promise<Task[]> {
    this.ensureInitialized();
    
    if (this.useNative) {
      return FreelistRust.getTasks(filter);
    } else {
      return freelistFallback.getTasks(filter);
    }
  }

  async getTasksByTag(tag: string): Promise<Task[]> {
    this.ensureInitialized();
    
    if (this.useNative) {
      return FreelistRust.getTasksByTag(tag);
    } else {
      return freelistFallback.getTasksByTag(tag);
    }
  }

  async markTaskDone(id: number, done: boolean = true): Promise<void> {
    this.ensureInitialized();
    
    if (this.useNative) {
      await FreelistRust.markTaskDone(id, done);
    } else {
      await freelistFallback.markTaskDone(id, done);
    }
  }

  async markTaskUndone(id: number): Promise<void> {
    return this.markTaskDone(id, false);
  }

  async deleteTask(id: number): Promise<void> {
    this.ensureInitialized();
    
    if (this.useNative) {
      await FreelistRust.deleteTask(id);
    } else {
      await freelistFallback.deleteTask(id);
    }
  }

  async getAllTags(): Promise<string[]> {
    this.ensureInitialized();
    
    if (this.useNative) {
      return FreelistRust.getAllTags();
    } else {
      return freelistFallback.getAllTags();
    }
  }

  async clearAllTasks(): Promise<void> {
    this.ensureInitialized();
    
    if (this.useNative) {
      await FreelistRust.clearAllTasks();
    } else {
      await freelistFallback.clearAllTasks();
    }
  }

  // Utility method to check which implementation is being used
  isUsingNative(): boolean {
    return this.useNative;
  }
}

export const freelistAPI = new FreelistRustAPI();
export default FreelistRust as FreelistRustNativeModule;
