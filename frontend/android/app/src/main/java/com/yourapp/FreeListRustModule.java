// frontend/android/app/src/main/java/com/yourapp/FreelistRustModule.java
package com.yourapp;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import org.json.JSONArray;
import org.json.JSONObject;

public class FreelistRustModule extends ReactContextBaseJavaModule {

    // Load the native library
    static {
        System.loadLibrary("core");
    }

    // Native function declarations
    private native int initFreelist(String dbPath);
    private native int initFreelistMemory();
    private native long addTask(String title, String tag, String dueDate);
    private native String getTasksJson(String filter);
    private native String getTasksByTagJson(String tag);
    private native int markTaskDone(long id, int done);
    private native int deleteTask(long id);
    private native String getAllTagsJson();
    private native int clearAllTasks();
    private native void freeString(long ptr);

    public FreelistRustModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "FreelistRust";
    }

    @ReactMethod
    public void initializeDatabase(String dbPath, Promise promise) {
        try {
            int result;
            if (dbPath == null || dbPath.isEmpty()) {
                result = initFreelistMemory();
            } else {
                result = initFreelist(dbPath);
            }
            
            if (result == 0) {
                promise.resolve("Database initialized successfully");
            } else {
                promise.reject("INIT_ERROR", "Failed to initialize database");
            }
        } catch (Exception e) {
            promise.reject("INIT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void addTask(String title, String tag, String dueDate, Promise promise) {
        try {
            long taskId = addTask(title, tag, dueDate);
            if (taskId >= 0) {
                promise.resolve((double) taskId);
            } else {
                promise.reject("ADD_ERROR", "Failed to add task");
            }
        } catch (Exception e) {
            promise.reject("ADD_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getTasks(String filter, Promise promise) {
        try {
            String jsonResult = getTasksJson(filter);
            if (jsonResult != null) {
                JSONArray jsonArray = new JSONArray(jsonResult);
                WritableArray tasksArray = convertJsonArrayToWritableArray(jsonArray);
                promise.resolve(tasksArray);
            } else {
                promise.reject("GET_ERROR", "Failed to get tasks");
            }
        } catch (Exception e) {
            promise.reject("GET_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getTasksByTag(String tag, Promise promise) {
        try {
            String jsonResult = getTasksByTagJson(tag);
            if (jsonResult != null) {
                JSONArray jsonArray = new JSONArray(jsonResult);
                WritableArray tasksArray = convertJsonArrayToWritableArray(jsonArray);
                promise.resolve(tasksArray);
            } else {
                promise.reject("GET_ERROR", "Failed to get tasks by tag");
            }
        } catch (Exception e) {
            promise.reject("GET_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void markTaskDone(double id, boolean done, Promise promise) {
        try {
            int result = markTaskDone((long) id, done ? 1 : 0);
            if (result == 0) {
                promise.resolve("Task updated successfully");
            } else {
                promise.reject("UPDATE_ERROR", "Failed to update task");
            }
        } catch (Exception e) {
            promise.reject("UPDATE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void deleteTask(double id, Promise promise) {
        try {
            int result = deleteTask((long) id);
            if (result == 0) {
                promise.resolve("Task deleted successfully");
            } else {
                promise.reject("DELETE_ERROR", "Failed to delete task");
            }
        } catch (Exception e) {
            promise.reject("DELETE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getAllTags(Promise promise) {
        try {
            String jsonResult = getAllTagsJson();
            if (jsonResult != null) {
                JSONArray jsonArray = new JSONArray(jsonResult);
                WritableArray tagsArray = convertJsonArrayToWritableArray(jsonArray);
                promise.resolve(tagsArray);
            } else {
                promise.reject("GET_ERROR", "Failed to get tags");
            }
        } catch (Exception e) {
            promise.reject("GET_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void clearAllTasks(Promise promise) {
        try {
            int result = clearAllTasks();
            if (result == 0) {
                promise.resolve("All tasks cleared successfully");
            } else {
                promise.reject("CLEAR_ERROR", "Failed to clear tasks");
            }
        } catch (Exception e) {
            promise.reject("CLEAR_ERROR", e.getMessage());
        }
    }

    // Helper method to convert JSONArray to WritableArray
    private WritableArray convertJsonArrayToWritableArray(JSONArray jsonArray) throws Exception {
        WritableArray writableArray = new WritableNativeArray();
        
        for (int i = 0; i < jsonArray.length(); i++) {
            Object item = jsonArray.get(i);
            if (item instanceof JSONObject) {
                writableArray.pushMap(convertJsonObjectToWritableMap((JSONObject) item));
            } else if (item instanceof String) {
                writableArray.pushString((String) item);
            } else if (item instanceof Integer) {
                writableArray.pushInt((Integer) item);
            } else if (item instanceof Double) {
                writableArray.pushDouble((Double) item);
            } else if (item instanceof Boolean) {
                writableArray.pushBoolean((Boolean) item);
            }
        }
        
        return writableArray;
    }

    // Helper method to convert JSONObject to WritableMap
    private WritableMap convertJsonObjectToWritableMap(JSONObject jsonObject) throws Exception {
        WritableMap writableMap = new WritableNativeMap();
        
        java.util.Iterator<String> keys = jsonObject.keys();
        while (keys.hasNext()) {
            String key = keys.next();
            Object value = jsonObject.get(key);
            
            if (value instanceof String) {
                writableMap.putString(key, (String) value);
            } else if (value instanceof Integer) {
                writableMap.putInt(key, (Integer) value);
            } else if (value instanceof Double) {
                writableMap.putDouble(key, (Double) value);
            } else if (value instanceof Boolean) {
                writableMap.putBoolean(key, (Boolean) value);
            } else if (value == JSONObject.NULL) {
                writableMap.putNull(key);
            } else if (value instanceof JSONObject) {
                writableMap.putMap(key, convertJsonObjectToWritableMap((JSONObject) value));
            } else if (value instanceof JSONArray) {
                writableMap.putArray(key, convertJsonArrayToWritableArray((JSONArray) value));
            }
        }
        
        return writableMap;
    }
}
