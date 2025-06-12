// === core/src/task.rs ===
#[derive(Debug, Clone)]
pub struct Task {
    pub title: String,
    pub done: bool,
}

impl Task {
    pub fn new(title: &str) -> Self {
        Self {
            title: title.to_string(),
            done: false,
        }
    }
}













