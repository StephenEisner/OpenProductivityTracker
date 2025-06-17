#!/bin/bash
# build.sh - Automated build script for FreeList

set -e  # Exit on any error

echo "🚀 FreeList Build Script"
echo "========================"

# Check if we're in the right directory and detect project type
if [ ! -f "core/Cargo.toml" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Detect project type
PROJECT_TYPE="unknown"
if [ -f "frontend/app.json" ] || [ -f "frontend/app.config.js" ]; then
    PROJECT_TYPE="expo"
    echo "📱 Detected Expo project"
elif [ -f "frontend/android/app/build.gradle" ]; then
    PROJECT_TYPE="react-native"
    echo "📱 Detected React Native project"
else
    echo "❌ Could not detect project type"
    echo "Expected: Expo project (app.json) or React Native project (android/app/build.gradle)"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists cargo; then
    echo "❌ Rust/Cargo not found. Please install Rust: https://rustup.rs/"
    exit 1
fi

if ! command_exists npx; then
    echo "❌ Node.js/NPM not found. Please install Node.js"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Parse command line arguments
BUILD_ANDROID=false
BUILD_IOS=false
RUN_APP=false
PLATFORM=""

while [[ $# -gt 0 ]]; do
    case $1 in
        android)
            BUILD_ANDROID=true
            PLATFORM="android"
            shift
            ;;
        ios)
            BUILD_IOS=true
            PLATFORM="ios"
            shift
            ;;
        both)
            BUILD_ANDROID=true
            BUILD_IOS=true
            shift
            ;;
        --run)
            RUN_APP=true
            shift
            ;;
        *)
            echo "Usage: $0 [android|ios|both] [--run]"
            echo "  android    Build for Android only"
            echo "  ios        Build for iOS only (macOS required)"
            echo "  both       Build for both platforms"
            echo "  --run      Run the app after building"
            exit 1
            ;;
    esac
done

# Default to Android if no platform specified
if [ "$BUILD_ANDROID" = false ] && [ "$BUILD_IOS" = false ]; then
    echo "ℹ️  No platform specified, defaulting to Android"
    BUILD_ANDROID=true
    PLATFORM="android"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# For Expo projects, make sure android folder exists
if [ "$PROJECT_TYPE" = "expo" ]; then
    if [ ! -d "android" ]; then
        echo "🔧 Generating Android project files..."
        npx expo prebuild --platform android --clean
    fi
fi

cd ..

# Build Rust core
echo "🦀 Building Rust core..."
cd core

# Update core/src/lib.rs to include ffi module
if ! grep -q "pub mod ffi;" src/lib.rs; then
    echo "📝 Adding FFI module to lib.rs..."
    echo "pub mod ffi;" >> src/lib.rs
fi

# Android build
if [ "$BUILD_ANDROID" = true ]; then
    echo "🤖 Building for Android..."
    
    # Check for Android NDK
    if [ -z "$ANDROID_NDK_HOME" ]; then
        if [ -d "$HOME/Android/Sdk/ndk" ]; then
            export ANDROID_NDK_HOME="$HOME/Android/Sdk/ndk/$(ls $HOME/Android/Sdk/ndk | sort -V | tail -1)"
            echo "📱 Found Android NDK at: $ANDROID_NDK_HOME"
        else
            echo "❌ Android NDK not found. Please set ANDROID_NDK_HOME or install Android Studio with NDK"
            exit 1
        fi
    fi
    
    # Add NDK tools to PATH
    export PATH="$ANDROID_NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin:$PATH"
    
    # Install Android targets if not already installed
    echo "🎯 Installing Android Rust targets..."
    rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android
    
    # Create .cargo/config.toml for Android
    mkdir -p .cargo
    cat > .cargo/config.toml << EOF
[target.aarch64-linux-android]
ar = "aarch64-linux-android-ar"
linker = "aarch64-linux-android-clang"

[target.armv7-linux-androideabi]
ar = "arm-linux-androideabi-ar"
linker = "armv7a-linux-androideabi-clang"

[target.x86_64-linux-android]
ar = "x86_64-linux-android-ar"
linker = "x86_64-linux-android-clang"

[target.i686-linux-android]
ar = "i686-linux-android-ar"
linker = "i686-linux-android-clang"
EOF
    
    # Create jniLibs directories
    mkdir -p ../frontend/android/app/src/main/jniLibs/{arm64-v8a,armeabi-v7a,x86_64,x86}
    
    # Build for each Android architecture
    echo "🔨 Building for Android architectures..."
    
    echo "  - Building for arm64-v8a..."
    cargo build --target aarch64-linux-android --release
    cp target/aarch64-linux-android/release/libcore.so ../frontend/android/app/src/main/jniLibs/arm64-v8a/
    
    echo "  - Building for armeabi-v7a..."
    cargo build --target armv7-linux-androideabi --release
    cp target/armv7-linux-androideabi/release/libcore.so ../frontend/android/app/src/main/jniLibs/armeabi-v7a/
    
    echo "  - Building for x86_64..."
    cargo build --target x86_64-linux-android --release
    cp target/x86_64-linux-android/release/libcore.so ../frontend/android/app/src/main/jniLibs/x86_64/
    
    echo "  - Building for x86..."
    cargo build --target i686-linux-android --release
    cp target/i686-linux-android/release/libcore.so ../frontend/android/app/src/main/jniLibs/x86/
    
    echo "✅ Android build complete!"
fi

# iOS build
if [ "$BUILD_IOS" = true ]; then
    echo "🍎 Building for iOS..."
    
    # Check if we're on macOS
    if [[ "$OSTYPE" != "darwin"* ]]; then
        echo "❌ iOS builds require macOS"
        exit 1
    fi
    
    # Check for Xcode
    if ! command_exists xcode-select; then
        echo "❌ Xcode not found. Please install Xcode from the App Store"
        exit 1
    fi
    
    # Install iOS targets
    echo "🎯 Installing iOS Rust targets..."
    rustup target add aarch64-apple-ios x86_64-apple-ios
    
    # Create iOS libs directory
    mkdir -p ../frontend/ios/libs
    
    # Build for iOS architectures
    echo "🔨 Building for iOS architectures..."
    
    echo "  - Building for iOS device (arm64)..."
    cargo build --target aarch64-apple-ios --release
    
    echo "  - Building for iOS simulator (x86_64)..."
    cargo build --target x86_64-apple-ios --release
    
    # Create universal library
    echo "  - Creating universal library..."
    lipo -create \
        target/aarch64-apple-ios/release/libcore.a \
        target/x86_64-apple-ios/release/libcore.a \
        -output target/libcore-universal.a
    
    # Copy to iOS project
    cp target/libcore-universal.a ../frontend/ios/libs/
    
    echo "✅ iOS build complete!"
fi

cd ..

# Verify builds
echo "🔍 Verifying builds..."

if [ "$BUILD_ANDROID" = true ]; then
    ANDROID_LIBS=$(find frontend/android/app/src/main/jniLibs -name "libcore.so" | wc -l)
    if [ "$ANDROID_LIBS" -eq 4 ]; then
        echo "✅ Android: All 4 architecture libraries found"
    else
        echo "⚠️  Android: Only $ANDROID_LIBS/4 architecture libraries found"
    fi
fi

if [ "$BUILD_IOS" = true ]; then
    if [ -f "frontend/ios/libs/libcore-universal.a" ]; then
        echo "✅ iOS: Universal library found"
    else
        echo "❌ iOS: Universal library not found"
    fi
fi

# Update package registration if needed
echo "📝 Updating package registration..."

# Check if MainApplication.java needs to be updated
MAIN_APP_FILE="frontend/android/app/src/main/java/com/yourapp/MainApplication.java"
if [ -f "$MAIN_APP_FILE" ]; then
    if ! grep -q "FreelistRustPackage" "$MAIN_APP_FILE"; then
        echo "⚠️  MainApplication.java needs to be updated to include FreelistRustPackage"
        echo "   Please add 'new FreelistRustPackage()' to the getPackages() method"
    fi
else
    echo "⚠️  MainApplication.java not found. Please create it manually."
fi

# Run the app if requested
if [ "$RUN_APP" = true ]; then
    echo "🚀 Starting the app..."
    cd frontend
    
    if [ "$PLATFORM" = "android" ]; then
        echo "🤖 Running on Android..."
        npx expo run:android
    elif [ "$PLATFORM" = "ios" ]; then
        echo "🍎 Running on iOS..."
        npx expo run:ios
    else
        echo "📱 Starting Expo development server..."
        npx expo start
    fi
else
    echo ""
    echo "🎉 Build complete!"
    echo ""
    echo "To run the app:"
    if [ "$BUILD_ANDROID" = true ]; then
        echo "  Android: cd frontend && npx expo run:android"
    fi
    if [ "$BUILD_IOS" = true ]; then
        echo "  iOS: cd frontend && npx expo run:ios"
    fi
    echo "  Development: cd frontend && npx expo start"
    echo ""
    echo "Make sure to update MainApplication.java to include FreelistRustPackage!"
fi
