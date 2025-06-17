#import "FreelistRust.h"
#import <React/RCTLog.h>

// C function declarations from Rust
extern int init_freelist(const char* db_path);
extern int init_freelist_memory(void);
extern long add_task(const char* title, const char* tag, const char* due_date);
extern char* get_tasks_json(const char* filter);
extern char* get_tasks_by_tag_json(const char* tag);
extern int mark_task_done(long id, int done);
extern int delete_task(long id);
extern char* get_all_tags_json(void);
extern int clear_all_tasks(void);
extern void free_string(char* ptr);

@implementation FreelistRust

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(initializeDatabase:(NSString *)dbPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    int result;
    
    if (dbPath == nil || [dbPath length] == 0) {
        result = init_freelist_memory();
    } else {
        const char* path_cstr = [dbPath UTF8String];
        result = init_freelist(path_cstr);
    }
    
    if (result == 0) {
        resolve(@"Database initialized successfully");
    } else {
        reject(@"INIT_ERROR", @"Failed to initialize database", nil);
    }
}

RCT_EXPORT_METHOD(addTask:(NSString *)title
                  tag:(NSString *)tag
                  dueDate:(NSString *)dueDate
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char* title_cstr = [title UTF8String];
    const char* tag_cstr = tag ? [tag UTF8String] : "";
    const char* due_date_cstr = dueDate ? [dueDate UTF8String] : "";
    
    long task_id = add_task(title_cstr, tag_cstr, due_date_cstr);
    
    if (task_id >= 0) {
        resolve(@(task_id));
    } else {
        reject(@"ADD_ERROR", @"Failed to add task", nil);
    }
}

RCT_EXPORT_METHOD(getTasks:(NSString *)filter
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char* filter_cstr = [filter UTF8String];
    char* json_result = get_tasks_json(filter_cstr);
    
    if (json_result != NULL) {
        NSString* json_string = [NSString stringWithUTF8String:json_result];
        free_string(json_result);
        
        NSError* error = nil;
        NSData* json_data = [json_string dataUsingEncoding:NSUTF8StringEncoding];
        NSArray* tasks = [NSJSONSerialization JSONObjectWithData:json_data options:0 error:&error];
        
        if (error) {
            reject(@"PARSE_ERROR", @"Failed to parse JSON", error);
        } else {
            resolve(tasks);
        }
    } else {
        reject(@"GET_ERROR", @"Failed to get tasks", nil);
    }
}

RCT_EXPORT_METHOD(getTasksByTag:(NSString *)tag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    const char* tag_cstr = [tag UTF8String];
    char* json_result = get_tasks_by_tag_json(tag_cstr);
    
    if (json_result != NULL) {
        NSString* json_string = [NSString stringWithUTF8String:json_result];
        free_string(json_result);
        
        NSError* error = nil;
        NSData* json_data = [json_string dataUsingEncoding:NSUTF8StringEncoding];
        NSArray* tasks = [NSJSONSerialization JSONObjectWithData:json_data options:0 error:&error];
        
        if (error) {
            reject(@"PARSE_ERROR", @"Failed to parse JSON", error);
        } else {
            resolve(tasks);
        }
    } else {
        reject(@"GET_ERROR", @"Failed to get tasks by tag", nil);
    }
}

RCT_EXPORT_METHOD(markTaskDone:(double)taskId
                  done:(BOOL)done
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    long id = (long)taskId;
    int done_int = done ? 1 : 0;
    int result = mark_task_done(id, done_int);
    
    if (result == 0) {
        resolve(@"Task updated successfully");
    } else {
        reject(@"UPDATE_ERROR", @"Failed to update task", nil);
    }
}

RCT_EXPORT_METHOD(deleteTask:(double)taskId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    long id = (long)taskId;
    int result = delete_task(id);
    
    if (result == 0) {
        resolve(@"Task deleted successfully");
    } else {
        reject(@"DELETE_ERROR", @"Failed to delete task", nil);
    }
}

RCT_EXPORT_METHOD(getAllTags:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    char* json_result = get_all_tags_json();
    
    if (json_result != NULL) {
        NSString* json_string = [NSString stringWithUTF8String:json_result];
        free_string(json_result);
        
        NSError* error = nil;
        NSData* json_data = [json_string dataUsingEncoding:NSUTF8StringEncoding];
        NSArray* tags = [NSJSONSerialization JSONObjectWithData:json_data options:0 error:&error];
        
        if (error) {
            reject(@"PARSE_ERROR", @"Failed to parse JSON", error);
        } else {
            resolve(tags);
        }
    } else {
        reject(@"GET_ERROR", @"Failed to get tags", nil);
    }
}

RCT_EXPORT_METHOD(clearAllTasks:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    int result = clear_all_tasks();
    
    if (result == 0) {
        resolve(@"All tasks cleared successfully");
    } else {
        reject(@"CLEAR_ERROR", @"Failed to clear tasks", nil);
    }
}

@end
