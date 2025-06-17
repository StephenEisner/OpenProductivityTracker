#!/bin/bash
# setup-ios.sh - Setup script for iOS native module

echo "🍎 Setting up FreeList iOS native module..."

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ iOS development requires macOS"
    exit 1
fi

# Check if this is an Expo project
if [ -f "frontend/app.json" ] || [ -f "frontend/app.config.js" ]; then
    echo "📱 Detected Expo project"
    
    # Check if iOS folder exists, if not, we need to prebuild
    if [ ! -d "frontend/ios" ]; then
        echo "🔧 iOS folder not found. Running expo prebuild..."
        cd frontend
        npx expo prebuild --platform ios
        cd ..
        echo "✅ Expo prebuild completed"
    fi
elif [ -d "frontend/ios" ]; then
    echo "📱 Detected React Native project with iOS folder"
else
    echo "❌ Could not detect iOS project"
    exit 1
fi

# Build the Rust library
echo "🦀 Building Rust library for iOS..."
cd core
chmod +x build-ios.sh
./build-ios.sh
cd ..

# Copy Objective-C files
echo "📝 Setting up Objective-C bridge files..."
cp ios_native_module.h frontend/ios/FreelistRust.h
cp ios_native_module_impl.m frontend/ios/FreelistRust.m

# Check if the files were created in the iOS project
IOS_PROJECT_DIR="frontend/ios"
PROJECT_FILE=$(find "$IOS_PROJECT_DIR" -name "*.xcodeproj" -o -name "*.xcworkspace" | head -1)

if [ -z "$PROJECT_FILE" ]; then
    echo "❌ Could not find Xcode project file"
    exit 1
fi

PROJECT_NAME=$(basename "$PROJECT_FILE" | sed 's/\.[^.]*$//')
echo "📱 Found project: $PROJECT_NAME"

# Instructions for manual Xcode setup
echo ""
echo "✅ Setup complete! Next steps:"
echo ""
echo "🔧 Manual Xcode Configuration Required:"
echo ""
echo "1. Open Xcode project:"
echo "   open $PROJECT_FILE"
echo ""
echo "2. Add the static library:"
echo "   - Right-click your project in Xcode"
echo "   - Add Files to \"$PROJECT_NAME\""
echo "   - Select: ios/libs/libcore-universal.a"
echo "   - Make sure 'Add to target' is checked"
echo ""
echo "3. Add the Objective-C files:"
echo "   - Add Files to \"$PROJECT_NAME\""
echo "   - Select: ios/FreelistRust.h and ios/FreelistRust.m"
echo ""
echo "4. Configure Build Settings:"
echo "   - Select your project in Xcode"
echo "   - Go to Build Settings"
echo "   - Search for 'Library Search Paths'"
echo "   - Add: \$(SRCROOT)/libs"
echo ""
echo "5. Link the library:"
echo "   - Go to Build Phases"
echo "   - Expand 'Link Binary With Libraries'"
echo "   - Click '+' and add libcore-universal.a"
echo ""
echo "6. Build and run:"
echo "   cd frontend && npx expo run:ios"
echo ""
echo "📚 If you see 'duplicate symbol' errors, make sure you're not mixing"
echo "    the fallback SQLite implementation with the native module."
