#!/bin/bash
# setup-native-module.sh - Setup script for React Native native module

echo "🔧 Setting up FreeList native module..."

# Check if this is an Expo project
if [ -f "frontend/app.json" ] || [ -f "frontend/app.config.js" ]; then
    echo "📱 Detected Expo project"
    
    # Get package name from app.json or app.config.js
    if [ -f "frontend/app.json" ]; then
        PACKAGE_NAME=$(node -e "console.log(JSON.parse(require('fs').readFileSync('frontend/app.json', 'utf8')).expo?.android?.package || 'com.yourapp.freelist')")
    elif [ -f "frontend/app.config.js" ]; then
        PACKAGE_NAME=$(cd frontend && node -e "console.log(require('./app.config.js').expo?.android?.package || 'com.yourapp.freelist')")
    else
        PACKAGE_NAME="com.yourapp.freelist"
    fi
    
    echo "📦 Using package name: $PACKAGE_NAME"
    
    # Check if android folder exists, if not, we need to prebuild
    if [ ! -d "frontend/android" ]; then
        echo "🔧 Android folder not found. Running expo prebuild..."
        cd frontend
        npx expo prebuild --platform android
        cd ..
        echo "✅ Expo prebuild completed"
    fi
    
elif [ -f "frontend/android/app/build.gradle" ]; then
    echo "📱 Detected standard React Native project"
    PACKAGE_NAME=$(grep "applicationId" frontend/android/app/build.gradle | sed 's/.*"\(.*\)".*/\1/')
    echo "📦 Detected package name: $PACKAGE_NAME"
else
    echo "❌ Could not detect project type or find configuration files"
    echo "Please run this script from the project root directory"
    echo "Expected structure:"
    echo "  project/"
    echo "  ├── core/"
    echo "  └── frontend/"
    echo "      ├── app.json (for Expo)"
    echo "      └── android/ (for React Native)"
    exit 1
fi

# Convert package name to directory structure
PACKAGE_DIR=$(echo $PACKAGE_NAME | tr '.' '/')
JAVA_DIR="frontend/android/app/src/main/java/$PACKAGE_DIR"

# Create Java directory if it doesn't exist
mkdir -p "$JAVA_DIR"

echo "📁 Creating Java files in: $JAVA_DIR"

# Create FreelistRustModule.java with correct package name
cat > "$JAVA_DIR/FreelistRustModule.java" << EOF
package $PACKAGE_NAME;

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
EOF

# Create FreelistRustPackage.java with correct package name
cat > "$JAVA_DIR/FreelistRustPackage.java" << EOF
package $PACKAGE_NAME;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class FreelistRustPackage implements ReactPackage {

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new FreelistRustModule(reactContext));
        return modules;
    }
}
EOF

# Update MainApplication.java if it exists
MAIN_APP_FILE="$JAVA_DIR/MainApplication.java"
if [ -f "$MAIN_APP_FILE" ]; then
    echo "📝 Updating MainApplication.java..."
    
    # Check if FreelistRustPackage is already added
    if ! grep -q "FreelistRustPackage" "$MAIN_APP_FILE"; then
        # Create a backup
        cp "$MAIN_APP_FILE" "$MAIN_APP_FILE.backup"
        
        # Add the import and package
        sed -i.tmp '/import com.facebook.react.shell.MainReactPackage;/a\
import '"$PACKAGE_NAME"'.FreelistRustPackage;' "$MAIN_APP_FILE"
        
        sed -i.tmp '/new MainReactPackage(),/a\
              new FreelistRustPackage(),' "$MAIN_APP_FILE"
        
        rm "$MAIN_APP_FILE.tmp"
        echo "✅ MainApplication.java updated successfully"
    else
        echo "✅ MainApplication.java already contains FreelistRustPackage"
    fi
else
    echo "⚠️  MainApplication.java not found at: $MAIN_APP_FILE"
    echo "   Please create it manually or use the Expo/React Native CLI to generate it"
fi

echo ""
echo "✅ Native module setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: chmod +x build.sh && ./build.sh android"
echo "2. Test the app: cd frontend && npx expo run:android"
echo ""
echo "📁 Created files:"
echo "  - $JAVA_DIR/FreelistRustModule.java"
echo "  - $JAVA_DIR/FreelistRustPackage.java"
if [ -f "$MAIN_APP_FILE" ]; then
    echo "  - Updated: $MAIN_APP_FILE"
fi
