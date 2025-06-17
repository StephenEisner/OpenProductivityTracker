#!/bin/bash
# build-ios.sh - iOS-specific build script

set -e

echo "🍎 Building FreeList for iOS..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ iOS builds require macOS"
    exit 1
fi

# Check for Xcode
if ! command -v xcode-select >/dev/null 2>&1; then
    echo "❌ Xcode not found. Please install Xcode from the App Store"
    exit 1
fi

# Install iOS Rust targets
echo "🎯 Installing iOS Rust targets..."
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# Check if we're in the core directory
if [ ! -f "Cargo.toml" ]; then
    echo "❌ Please run this script from the core directory"
    exit 1
fi

# Create iOS output directory
mkdir -p ../frontend/ios/libs

echo "🔨 Building Rust library for iOS..."

# Build for iOS device (arm64)
echo "  - Building for iOS device (arm64)..."
cargo build --target aarch64-apple-ios --release

# Build for iOS simulator (x86_64 - Intel Macs)
echo "  - Building for iOS simulator (x86_64)..."
cargo build --target x86_64-apple-ios --release

# Build for iOS simulator (arm64 - Apple Silicon Macs)
echo "  - Building for iOS simulator (arm64)..."
cargo build --target aarch64-apple-ios-sim --release

# Create universal library for simulators
echo "  - Creating universal simulator library..."
lipo -create \
    target/x86_64-apple-ios/release/libcore.a \
    target/aarch64-apple-ios-sim/release/libcore.a \
    -output target/libcore-sim.a

# Create final universal library (device + simulator)
echo "  - Creating universal library..."
lipo -create \
    target/aarch64-apple-ios/release/libcore.a \
    target/libcore-sim.a \
    -output target/libcore-universal.a

# Copy to iOS project
cp target/libcore-universal.a ../frontend/ios/libs/

# Create header file with C function declarations
cat > ../frontend/ios/libs/freelist_core.h << 'EOF'
#ifndef FREELIST_CORE_H
#define FREELIST_CORE_H

#include <stdint.h>

// Initialize database
int init_freelist(const char* db_path);
int init_freelist_memory(void);

// Task operations
int64_t add_task(const char* title, const char* tag, const char* due_date);
char* get_tasks_json(const char* filter);
char* get_tasks_by_tag_json(const char* tag);
int mark_task_done(int64_t id, int done);
int delete_task(int64_t id);

// Utility operations
char* get_all_tags_json(void);
int clear_all_tasks(void);
void free_string(char* ptr);

#endif /* FREELIST_CORE_H */
EOF

echo "✅ iOS build complete!"
echo ""
echo "📁 Generated files:"
echo "  - ../frontend/ios/libs/libcore-universal.a"
echo "  - ../frontend/ios/libs/freelist_core.h"
echo ""
echo "📝 Next steps:"
echo "1. Add the .a file to your Xcode project"
echo "2. Add the header to your bridging header"
echo "3. Build and run with: cd ../frontend && npx expo run:ios"
