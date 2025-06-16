// core/src/task_list.rs
use crate::task::Task;
use crate::database::{Database, TaskFilter, TaskStatus};
use std::path::Path;

pub struct TaskList {
    db: Database,
}

impl TaskList {
    pub fn new<P: AsRef<Path>>(db_path: P) -> Result<Self, Box<dyn std::error::Error>> {
        let db = Database::new(db_path)?;
        Ok(TaskList { db })
    }

    pub fn new_in_memory() -> Result<Self, Box<dyn std::error::Error>> {
        let db = Database::new_in_memory()?;
        Ok(TaskList { db })
    }

    pub fn add(&mut self, mut task: Task) -> Result<i64, Box<dyn std::error::Error>> {
        let id = self.db.insert_task(&task)?;
        task.id = Some(id);
        Ok(id)
    }

    pub fn all(&self) -> Result<Vec<Task>, Box<dyn std::error::Error>> {
        let filter = TaskFilter::default();
        Ok(self.db.fetch_tasks(filter)?)
    }

    pub fn get_todo(&self) -> Result<Vec<Task>, Box<dyn std::error::Error>> {
        let filter = TaskFilter {
            status: Some(TaskStatus::Todo),
            ..Default::default()
        };
        Ok(self.db.fetch_tasks(filter)?)
    }

    pub fn get_completed(&self) -> Result<Vec<Task>, Box<dyn std::error::Error>> {
        let filter = TaskFilter {
            status: Some(TaskStatus::Done),
            ..Default::default()
        };
        Ok(self.db.fetch_tasks(filter)?)
    }

    pub fn get_by_tag(&self, tag: &str) -> Result<Vec<Task>, Box<dyn std::error::Error>> {
        let filter = TaskFilter {
            tag: Some(tag.to_string()),
            ..Default::default()
        };
        Ok(self.db.fetch_tasks(filter)?)
    }

    pub fn get_subtasks(&self, parent_id: i64) -> Result<Vec<Task>, Box<dyn std::error::Error>> {
        let filter = TaskFilter {
            parent_id: Some(parent_id),
            ..Default::default()
        };
        Ok(self.db.fetch_tasks(filter)?)
    }

    pub fn get_by_id(&self, id: i64) -> Result<Option<Task>, Box<dyn std::error::Error>> {
        Ok(self.db.get_task_by_id(id)?)
    }

    pub fn mark_done(&mut self, id: i64) -> Result<(), Box<dyn std::error::Error>> {
        self.db.update_task_status(id, true)?;
        Ok(())
    }

    pub fn mark_undone(&mut self, id: i64) -> Result<(), Box<dyn std::error::Error>> {
        self.db.update_task_status(id, false)?;
        Ok(())
    }

    pub fn delete(&mut self, id: i64) -> Result<(), Box<dyn std::error::Error>> {
        self.db.delete_task(id)?;
        Ok(())
    }

    pub fn clear_all(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        self.db.clear_all_tasks()?;
        Ok(())
    }

    pub fn get_all_tags(&self) -> Result<Vec<String>, Box<dyn std::error::Error>> {
        Ok(self.db.fetch_all_tags()?)
    }

    pub fn get_overdue(&self) -> Result<Vec<Task>, Box<dyn std::error::Error>> {
        let all_tasks = self.get_todo()?;
        Ok(all_tasks.into_iter().filter(|task| task.is_overdue()).collect())
    }
}
