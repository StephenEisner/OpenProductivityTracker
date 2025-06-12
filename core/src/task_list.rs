// === core/src/task_list.rs ===
use super::task::Task;

pub struct TaskList {
    tasks: Vec<Task>,
}

impl TaskList {
    pub fn new() -> Self {
        Self { tasks: vec![] }
    }

    pub fn add(&mut self, task: Task) {
        self.tasks.push(task);
    }

    pub fn all(&self) -> &[Task] {
        &self.tasks
    }
}
