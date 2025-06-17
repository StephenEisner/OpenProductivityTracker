#!/bin/bash
# setup-ios-xcframework.sh - Modern iOS setup using XCFramework

set -e

echo "🍎 FreeList iOS Setup (XCFramework - Modern Approach)"
echo "===================================================="

# Check macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ iOS development requires macOS"
    exit 1
fi

# Check Rust
if ! command -v cargo >/dev/null 2>&1; then
    echo "❌ Rust not found. Install from: https://rustup.rs/"
    exit 1
fi

# Check project structure
if [ ! -f "core/Cargo.toml" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Run this from project root (where core/ and frontend/ exist)"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Prebuild if needed (Expo)
if [ -f "app.json" ] && [ ! -d "ios" ]; then
    echo "🔧 Generating iOS project..."
    npx expo prebuild --platform ios --clean
fi

cd ..

# Install iOS Rust targets
echo "🎯 Installing iOS Rust targets..."
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# Build Rust for iOS
echo "🦀 Building Rust library..."
cd core

# Make sure FFI module is included
if ! grep -q "pub mod ffi;" src/lib.rs; then
    echo "pub mod ffi;" >> src/lib.rs
fi

# Create build directories
mkdir -p build/device
mkdir -p build/simulator
mkdir -p ../frontend/ios/frameworks

# Build for device
echo "  Building for iOS device (arm64)..."
cargo build --target aarch64-apple-ios --release
cp target/aarch64-apple-ios/release/libcore.a build/device/

# Build for simulator - only build what's available
echo "  Building for iOS simulator..."
SIMULATOR_LIBS=()

# Try building for x86_64 (Intel simulator)
if cargo build --target x86_64-apple-ios --release 2>/dev/null; then
    echo "    ✅ Built for x86_64 simulator"
    SIMULATOR_LIBS+=("target/x86_64-apple-ios/release/libcore.a")
else
    echo "    ⚠️  Skipped x86_64 simulator (not available)"
fi

# Try building for aarch64-apple-ios-sim (Apple Silicon simulator)
if cargo build --target aarch64-apple-ios-sim --release 2>/dev/null; then
    echo "    ✅ Built for aarch64 simulator"
    SIMULATOR_LIBS+=("target/aarch64-apple-ios-sim/release/libcore.a")
else
    echo "    ⚠️  Skipped aarch64 simulator (not available)"
fi

# Create simulator universal library if we have multiple architectures
if [ ${#SIMULATOR_LIBS[@]} -gt 1 ]; then
    echo "  Creating universal simulator library..."
    lipo -create "${SIMULATOR_LIBS[@]}" -output build/simulator/libcore.a
elif [ ${#SIMULATOR_LIBS[@]} -eq 1 ]; then
    echo "  Using single simulator architecture..."
    cp "${SIMULATOR_LIBS[0]}" build/simulator/libcore.a
else
    echo "  ❌ No simulator libraries built"
    exit 1
fi

# Create XCFramework (modern approach)
echo "  Creating XCFramework..."
xcodebuild -create-xcframework \
    -library build/device/libcore.a \
    -library build/simulator/libcore.a \
    -output ../frontend/ios/frameworks/FreelistCore.xcframework

cd ..

# Create Objective-C bridge files
echo "📝 Creating Objective-C bridge..."

cat > frontend/ios/FreelistRust.h << 'EOF'
#import <React/RCTBridgeModule.h>

@interface FreelistRust : NSObject <RCTBridgeModule>
@end
EOF

cat > frontend/ios/FreelistRust.m << 'EOF'
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
EOF

echo ""
echo "✅ XCFramework setup complete!"
echo ""
echo "🔧 Manual Xcode steps (much simpler with XCFramework):"
echo ""
echo "1. Open your Xcode project:"
PROJECT_FILE=$(find frontend/ios -name "*.xcworkspace" -o -name "*.xcodeproj" | head -1)
if [ -n "$PROJECT_FILE" ]; then
    echo "   open $PROJECT_FILE"
else
    echo "   open frontend/ios/*.xcworkspace"
fi
echo ""
echo "2. Add the XCFramework:"
echo "   - Drag ios/frameworks/FreelistCore.xcframework into your project"
echo "   - Make sure it's added to your target"
echo ""
echo "3. Add the Objective-C bridge files:"
echo "   - Drag ios/FreelistRust.h and ios/FreelistRust.m into your project"
echo ""
echo "4. Build and test:"
echo "   cd frontend && npx expo run:ios"
echo ""
echo "🦀 XCFramework automatically handles device vs simulator!"
echo "   No more architecture conflicts!"
