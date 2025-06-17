// core/src/ffi.rs
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::sync::Mutex;
use crate::{TaskList, Task};
use serde_json;

// Global task list instance with thread safety
static TASK_LIST: Mutex<Option<TaskList>> = Mutex::new(None);

#[no_mangle]
pub extern "C" fn init_freelist(db_path: *const c_char) -> i32 {
    let path_str = if db_path.is_null() {
        return -1;
    } else {
        match unsafe { CStr::from_ptr(db_path) }.to_str() {
            Ok(s) => s,
            Err(_) => return -1,
        }
    };

    match TaskList::new(path_str) {
        Ok(task_list) => {
            let mut guard = TASK_LIST.lock().unwrap();
            *guard = Some(task_list);
            0 // Success
        }
        Err(_) => -1, // Error
    }
}

#[no_mangle]
pub extern "C" fn init_freelist_memory() -> i32 {
    match TaskList::new_in_memory() {
        Ok(task_list) => {
            let mut guard = TASK_LIST.lock().unwrap();
            *guard = Some(task_list);
            0 // Success
        }
        Err(_) => -1, // Error
    }
}

#[no_mangle]
pub extern "C" fn add_task(title: *const c_char, tag: *const c_char, due_date: *const c_char) -> i64 {
    let title_str = match unsafe { CStr::from_ptr(title) }.to_str() {
        Ok(s) => s,
        Err(_) => return -1,
    };

    let mut task = Task::new(title_str);
    
    // Add tag if provided
    if !tag.is_null() {
        if let Ok(tag_str) = unsafe { CStr::from_ptr(tag) }.to_str() {
            if !tag_str.is_empty() {
                task = task.with_tag(tag_str);
            }
        }
    }

    // Add due date if provided
    if !due_date.is_null() {
        if let Ok(due_str) = unsafe { CStr::from_ptr(due_date) }.to_str() {
            if !due_str.is_empty() {
                // Try to parse the date string (assuming ISO format)
                if let Ok(parsed_date) = chrono::DateTime::parse_from_rfc3339(due_str) {
                    task = task.with_due_date(parsed_date.with_timezone(&chrono::Utc));
                }
            }
        }
    }

    let mut guard = TASK_LIST.lock().unwrap();
    if let Some(ref mut task_list) = *guard {
        match task_list.add(task) {
            Ok(id) => id,
            Err(_) => -1,
        }
    } else {
        -1
    }
}

#[no_mangle]
pub extern "C" fn get_tasks_json(filter: *const c_char) -> *mut c_char {
    let filter_str = if filter.is_null() {
        "all"
    } else {
        match unsafe { CStr::from_ptr(filter) }.to_str() {
            Ok(s) => s,
            Err(_) => "all",
        }
    };

    let guard = TASK_LIST.lock().unwrap();
    if let Some(ref task_list) = *guard {
        let tasks = match filter_str {
            "todo" => task_list.get_todo().unwrap_or_default(),
            "done" => task_list.get_completed().unwrap_or_default(),
            _ => task_list.all().unwrap_or_default(),
        };

        match serde_json::to_string(&tasks) {
            Ok(json) => match CString::new(json) {
                Ok(c_string) => c_string.into_raw(),
                Err(_) => std::ptr::null_mut(),
            },
            Err(_) => std::ptr::null_mut(),
        }
    } else {
        std::ptr::null_mut()
    }
}

#[no_mangle]
pub extern "C" fn get_tasks_by_tag_json(tag: *const c_char) -> *mut c_char {
    let tag_str = match unsafe { CStr::from_ptr(tag) }.to_str() {
        Ok(s) => s,
        Err(_) => return std::ptr::null_mut(),
    };

    let guard = TASK_LIST.lock().unwrap();
    if let Some(ref task_list) = *guard {
        let tasks = task_list.get_by_tag(tag_str).unwrap_or_default();
        
        match serde_json::to_string(&tasks) {
            Ok(json) => match CString::new(json) {
                Ok(c_string) => c_string.into_raw(),
                Err(_) => std::ptr::null_mut(),
            },
            Err(_) => std::ptr::null_mut(),
        }
    } else {
        std::ptr::null_mut()
    }
}

#[no_mangle]
pub extern "C" fn mark_task_done(id: i64, done: i32) -> i32 {
    let mut guard = TASK_LIST.lock().unwrap();
    if let Some(ref mut task_list) = *guard {
        let result = if done == 1 {
            task_list.mark_done(id)
        } else {
            task_list.mark_undone(id)
        };
        
        match result {
            Ok(_) => 0,
            Err(_) => -1,
        }
    } else {
        -1
    }
}

#[no_mangle]
pub extern "C" fn delete_task(id: i64) -> i32 {
    let mut guard = TASK_LIST.lock().unwrap();
    if let Some(ref mut task_list) = *guard {
        match task_list.delete(id) {
            Ok(_) => 0,
            Err(_) => -1,
        }
    } else {
        -1
    }
}

#[no_mangle]
pub extern "C" fn get_all_tags_json() -> *mut c_char {
    let guard = TASK_LIST.lock().unwrap();
    if let Some(ref task_list) = *guard {
        match task_list.get_all_tags() {
            Ok(tags) => match serde_json::to_string(&tags) {
                Ok(json) => match CString::new(json) {
                    Ok(c_string) => c_string.into_raw(),
                    Err(_) => std::ptr::null_mut(),
                },
                Err(_) => std::ptr::null_mut(),
            },
            Err(_) => std::ptr::null_mut(),
        }
    } else {
        std::ptr::null_mut()
    }
}

#[no_mangle]
pub extern "C" fn clear_all_tasks() -> i32 {
    let mut guard = TASK_LIST.lock().unwrap();
    if let Some(ref mut task_list) = *guard {
        match task_list.clear_all() {
            Ok(_) => 0,
            Err(_) => -1,
        }
    } else {
        -1
    }
}

#[no_mangle]
pub extern "C" fn free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe {
            let _ = CString::from_raw(ptr);
        }
    }
}
