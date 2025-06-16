// core/src/task.rs
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: Option<i64>,
    pub title: String,
    pub details: Option<String>,
    pub done: bool,
    pub due_date: Option<DateTime<Utc>>,
    pub is_recurring: bool,
    pub estimated_duration: Option<i32>, // in minutes
    pub last_duration: Option<i32>,     // in minutes
    pub tag: Option<String>,
    pub parent_id: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Task {
    pub fn new(title: &str) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            title: title.to_string(),
            details: None,
            done: false,
            due_date: None,
            is_recurring: false,
            estimated_duration: None,
            last_duration: None,
            tag: None,
            parent_id: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn with_details(mut self, details: &str) -> Self {
        self.details = Some(details.to_string());
        self.updated_at = Utc::now();
        self
    }

    pub fn with_tag(mut self, tag: &str) -> Self {
        self.tag = Some(tag.to_string());
        self.updated_at = Utc::now();
        self
    }

    pub fn with_due_date(mut self, due_date: DateTime<Utc>) -> Self {
        self.due_date = Some(due_date);
        self.updated_at = Utc::now();
        self
    }

    pub fn with_parent(mut self, parent_id: i64) -> Self {
        self.parent_id = Some(parent_id);
        self.updated_at = Utc::now();
        self
    }

    pub fn mark_done(&mut self) {
        self.done = true;
        self.updated_at = Utc::now();
    }

    pub fn mark_undone(&mut self) {
        self.done = false;
        self.updated_at = Utc::now();
    }

    pub fn set_estimated_duration(&mut self, minutes: i32) {
        self.estimated_duration = Some(minutes);
        self.updated_at = Utc::now();
    }

    pub fn record_duration(&mut self, minutes: i32) {
        self.last_duration = Some(minutes);
        self.updated_at = Utc::now();
    }

    pub fn is_overdue(&self) -> bool {
        if let Some(due_date) = self.due_date {
            !self.done && Utc::now() > due_date
        } else {
            false
        }
    }

    pub fn is_subtask(&self) -> bool {
        self.parent_id.is_some()
    }
}



