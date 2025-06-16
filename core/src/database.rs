// core/src/database.rs
use rusqlite::{Connection, Result, params};
use std::path::Path;
use crate::task::Task;
use chrono::{DateTime, Utc};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new<P: AsRef<Path>>(db_path: P) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }

    pub fn new_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                details TEXT,
                done INTEGER NOT NULL DEFAULT 0,
                due_date TEXT,
                is_recurring INTEGER NOT NULL DEFAULT 0,
                estimated_duration INTEGER,
                last_duration INTEGER,
                tag TEXT,
                parent_id INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(parent_id) REFERENCES tasks(id)
            )",
            [],
        )?;

        // Create indexes for better performance
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_done ON tasks(done)",
            [],
        )?;
        
        self.conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_tag ON tasks(tag)",
            [],
        )?;

        Ok(())
    }

    pub fn insert_task(&self, task: &Task) -> Result<i64> {
        let now = Utc::now().to_rfc3339();
        
        self.conn.execute(
            "INSERT INTO tasks (
                title, details, done, due_date, is_recurring, 
                estimated_duration, last_duration, tag, parent_id, 
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                task.title,
                task.details,
                if task.done { 1 } else { 0 },
                task.due_date.as_ref().map(|d| d.to_rfc3339()),
                if task.is_recurring { 1 } else { 0 },
                task.estimated_duration,
                task.last_duration,
                task.tag,
                task.parent_id,
                now,
                now
            ],
        )?;

        Ok(self.conn.last_insert_rowid())
    }

    pub fn fetch_tasks(&self, filter: TaskFilter) -> Result<Vec<Task>> {
        let mut query = String::from(
            "SELECT id, title, details, done, due_date, is_recurring, 
             estimated_duration, last_duration, tag, parent_id, 
             created_at, updated_at FROM tasks"
        );
        
        let mut conditions = Vec::new();
        let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        match filter.status {
            Some(TaskStatus::Done) => {
                conditions.push("done = 1");
            }
            Some(TaskStatus::Todo) => {
                conditions.push("done = 0");
            }
            None => {}
        }

        if let Some(tag) = &filter.tag {
            conditions.push("tag = ?");
            params.push(Box::new(tag.clone()));
        }

        if let Some(parent_id) = filter.parent_id {
            conditions.push("parent_id = ?");
            params.push(Box::new(parent_id));
        }

        if !conditions.is_empty() {
            query.push_str(" WHERE ");
            query.push_str(&conditions.join(" AND "));
        }

        query.push_str(" ORDER BY created_at DESC");

        let mut stmt = self.conn.prepare(&query)?;
        let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();
        
        let task_iter = stmt.query_map(&param_refs[..], |row| {
            let due_date_str: Option<String> = row.get(4)?;
            let due_date = due_date_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                .map(|dt| dt.with_timezone(&Utc));

            let created_at_str: String = row.get(10)?;
            let updated_at_str: String = row.get(11)?;
            
            let created_at = DateTime::parse_from_rfc3339(&created_at_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());
                
            let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());

            Ok(Task {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                details: row.get(2)?,
                done: row.get::<_, i32>(3)? == 1,
                due_date,
                is_recurring: row.get::<_, i32>(5)? == 1,
                estimated_duration: row.get(6)?,
                last_duration: row.get(7)?,
                tag: row.get(8)?,
                parent_id: row.get(9)?,
                created_at,
                updated_at,
            })
        })?;

        let mut tasks = Vec::new();
        for task in task_iter {
            tasks.push(task?);
        }

        Ok(tasks)
    }

    pub fn fetch_all_tags(&self) -> Result<Vec<String>> {
        let mut stmt = self.conn.prepare(
            "SELECT DISTINCT tag FROM tasks WHERE tag IS NOT NULL AND tag != '' ORDER BY tag"
        )?;
        
        let tag_iter = stmt.query_map([], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        let mut tags = Vec::new();
        for tag in tag_iter {
            tags.push(tag?);
        }

        Ok(tags)
    }

    pub fn update_task_status(&self, id: i64, done: bool) -> Result<()> {
        let now = Utc::now().to_rfc3339();
        self.conn.execute(
            "UPDATE tasks SET done = ?1, updated_at = ?2 WHERE id = ?3",
            params![if done { 1 } else { 0 }, now, id],
        )?;
        Ok(())
    }

    pub fn delete_task(&self, id: i64) -> Result<()> {
        // Delete subtasks first
        self.conn.execute("DELETE FROM tasks WHERE parent_id = ?1", params![id])?;
        // Then delete the task itself
        self.conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn clear_all_tasks(&self) -> Result<()> {
        self.conn.execute("DELETE FROM tasks", [])?;
        Ok(())
    }

    pub fn get_task_by_id(&self, id: i64) -> Result<Option<Task>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, title, details, done, due_date, is_recurring, 
             estimated_duration, last_duration, tag, parent_id, 
             created_at, updated_at FROM tasks WHERE id = ?1"
        )?;

        let mut task_iter = stmt.query_map([id], |row| {
            let due_date_str: Option<String> = row.get(4)?;
            let due_date = due_date_str.and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                .map(|dt| dt.with_timezone(&Utc));

            let created_at_str: String = row.get(10)?;
            let updated_at_str: String = row.get(11)?;
            
            let created_at = DateTime::parse_from_rfc3339(&created_at_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());
                
            let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());

            Ok(Task {
                id: Some(row.get(0)?),
                title: row.get(1)?,
                details: row.get(2)?,
                done: row.get::<_, i32>(3)? == 1,
                due_date,
                is_recurring: row.get::<_, i32>(5)? == 1,
                estimated_duration: row.get(6)?,
                last_duration: row.get(7)?,
                tag: row.get(8)?,
                parent_id: row.get(9)?,
                created_at,
                updated_at,
            })
        })?;

        match task_iter.next() {
            Some(task) => Ok(Some(task?)),
            None => Ok(None),
        }
    }
}

#[derive(Debug, Default)]
pub struct TaskFilter {
    pub status: Option<TaskStatus>,
    pub tag: Option<String>,
    pub parent_id: Option<i64>,
}

#[derive(Debug)]
pub enum TaskStatus {
    Done,
    Todo,
}