// cli/src/main.rs
use core::{Task, TaskList};
use std::env;
use std::io::{self, Write};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 2 {
        print_help();
        return Ok(());
    }

    // Use a local database file
    let db_path = "freelist.db";
    let mut task_list = TaskList::new(db_path)?;

    match args[1].as_str() {
        "add" => {
            if args.len() < 3 {
                eprintln!("Usage: {} add <task_title> [tag]", args[0]);
                return Ok(());
            }
            
            let title = &args[2];
            let mut task = Task::new(title);
            
            if args.len() > 3 {
                task = task.with_tag(&args[3]);
            }
            
            let id = task_list.add(task)?;
            println!("Added task with ID: {}", id);
        }
        
        "list" => {
            let filter = args.get(2).map(|s| s.as_str()).unwrap_or("all");
            
            let tasks = match filter {
                "todo" => task_list.get_todo()?,
                "done" => task_list.get_completed()?,
                "all" => task_list.all()?,
                tag if tag.starts_with('#') => {
                    let tag_name = &tag[1..];
                    task_list.get_by_tag(tag_name)?
                }
                _ => {
                    eprintln!("Invalid filter. Use: all, todo, done, or #tag");
                    return Ok(());
                }
            };
            
            if tasks.is_empty() {
                println!("No tasks found.");
            } else {
                for task in tasks {
                    let status = if task.done { "✓" } else { "○" };
                    let tag = task.tag.map(|t| format!(" #{}", t)).unwrap_or_default();
                    let due = task.due_date
                        .map(|d| format!(" (due: {})", d.format("%Y-%m-%d")))
                        .unwrap_or_default();
                    
                    println!("{} [{}] {}{}{}", 
                        status, 
                        task.id.unwrap_or(0), 
                        task.title,
                        tag,
                        due
                    );
                }
            }
        }
        
        "done" => {
            if args.len() < 3 {
                eprintln!("Usage: {} done <task_id>", args[0]);
                return Ok(());
            }
            
            let id: i64 = args[2].parse()?;
            task_list.mark_done(id)?;
            println!("Marked task {} as done", id);
        }
        
        "undone" => {
            if args.len() < 3 {
                eprintln!("Usage: {} undone <task_id>", args[0]);
                return Ok(());
            }
            
            let id: i64 = args[2].parse()?;
            task_list.mark_undone(id)?;
            println!("Marked task {} as not done", id);
        }
        
        "delete" => {
            if args.len() < 3 {
                eprintln!("Usage: {} delete <task_id>", args[0]);
                return Ok(());
            }
            
            let id: i64 = args[2].parse()?;
            task_list.delete(id)?;
            println!("Deleted task {}", id);
        }
        
        "tags" => {
            let tags = task_list.get_all_tags()?;
            if tags.is_empty() {
                println!("No tags found.");
            } else {
                println!("Available tags:");
                for tag in tags {
                    println!("  #{}", tag);
                }
            }
        }
        
        "clear" => {
            print!("Are you sure you want to delete all tasks? (y/N): ");
            io::stdout().flush()?;
            
            let mut input = String::new();
            io::stdin().read_line(&mut input)?;
            
            if input.trim().to_lowercase() == "y" {
                task_list.clear_all()?;
                println!("All tasks deleted.");
            } else {
                println!("Cancelled.");
            }
        }
        
        "help" | "--help" | "-h" => {
            print_help();
        }
        
        _ => {
            eprintln!("Unknown command: {}", args[1]);
            print_help();
        }
    }

    Ok(())
}

fn print_help() {
    println!("FreeList CLI - Task Management");
    println!();
    println!("USAGE:");
    println!("    freelist <COMMAND> [OPTIONS]");
    println!();
    println!("COMMANDS:");
    println!("    add <title> [tag]    Add a new task");
    println!("    list [filter]        List tasks (all, todo, done, #tag)");
    println!("    done <id>            Mark task as done");
    println!("    undone <id>          Mark task as not done");
    println!("    delete <id>          Delete a task");
    println!("    tags                 List all tags");
    println!("    clear                Delete all tasks");
    println!("    help                 Show this help message");
    println!();
    println!("EXAMPLES:");
    println!("    freelist add \"Buy groceries\" shopping");
    println!("    freelist list todo");
    println!("    freelist list #shopping");
    println!("    freelist done 1");
}
