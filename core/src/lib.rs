// core/src/lib.rs
pub mod task;
pub mod task_list;
pub mod database;

pub use task::Task;
pub use task_list::TaskList;
pub use database::{Database, TaskFilter, TaskStatus};

// Re-export commonly used types
pub use chrono::{DateTime, Utc};

pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }

    #[test]
    fn test_task_creation() {
        let task = Task::new("Test task")
            .with_details("Test details")
            .with_tag("test");
        
        assert_eq!(task.title, "Test task");
        assert_eq!(task.details, Some("Test details".to_string()));
        assert_eq!(task.tag, Some("test".to_string()));
        assert!(!task.done);
    }

    #[test]
    fn test_task_list_in_memory() -> Result<(), Box<dyn std::error::Error>> {
        let mut task_list = TaskList::new_in_memory()?;
        
        let task = Task::new("Test task").with_tag("test");
        let id = task_list.add(task)?;
        
        let tasks = task_list.all()?;
        assert_eq!(tasks.len(), 1);
        assert_eq!(tasks[0].title, "Test task");
        
        task_list.mark_done(id)?;
        let completed = task_list.get_completed()?;
        assert_eq!(completed.len(), 1);
        assert!(completed[0].done);
        
        Ok(())
    }
}
