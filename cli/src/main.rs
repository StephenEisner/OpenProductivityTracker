use core::task::Task;
use core::task_list::TaskList;

fn main() {
    let mut list = TaskList::new();
    list.add(Task::new("Buy groceries"));
    list.add(Task::new("Clean fridge"));
    for task in list.all() {
        println!("- {}", task.title);
    }
}
