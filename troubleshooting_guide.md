# Native Module Troubleshooting Guide

The error `Cannot read property 'initializeDatabase' of null` means React Native can't find the `FreelistRust` native module. Let's fix this step by step.

## Step 1: Verify Native Module Registration

First, let's create a simple test to see what native modules are available:

**Create `frontend/debug-modules.js`:**
```javascript
import { NativeModules } from 'react-native';

console.log('Available Native Modules:', Object.keys(NativeModules));
console.log('FreelistRust module:', NativeModules.FreelistRust);

if (NativeModules.FreelistRust) {
  console.log('✅ FreelistRust module found');
} else {
  console.log('❌ FreelistRust module NOT found');
}
```

**Run this in your app temporarily by adding to `index.tsx`:**
```typescript
// Add this temporarily at the top of app/(tabs)/index.tsx
import '../debug-modules';
```

## Step 2: Check Android Registration

Verify your `MainApplication.java` file includes the package. It should look like this:

**Check `frontend/android/app/src/main/java/[your-package]/MainApplication.java`:**
```java
package com.yourpackage.freelist; // Your actual package

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          return Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new FreelistRustPackage()  // ← This line must be present
          );
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
  }
}
```

## Step 3: Check Library Files

Verify the Rust libraries were built and copied correctly:

```bash
# Check if .so files exist
find frontend/android/app/src/main/jniLibs -name "*.so" -ls

# Should show files like:
# frontend/android/app/src/main/jniLibs/arm64-v8a/libcore.so
# frontend/android/app/src/main/jniLibs/armeabi-v7a/libcore.so
# frontend/android/app/src/main/jniLibs/x86_64/libcore.so
# frontend/android/app/src/main/jniLibs/x86/libcore.so
```

## Step 4: Alternative Quick Fix - Use Development Mode

If the native module is still not working, let's create a fallback that uses an in-memory implementation for development:
