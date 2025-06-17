# Expo Setup Guide for Rust Integration

Since you're using Expo, here's a streamlined setup process:

## Quick Setup

1. **First, update your `frontend/app.json` to include the Android package name:**

```json
{
  "expo": {
    "name": "FreeList",
    "slug": "freelist",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "package": "com.yourapp.freelist",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

2. **Make scripts executable:**
```bash
chmod +x setup-native-module.sh build.sh
```

3. **Run the setup script:**
```bash
./setup-native-module.sh
```

4. **Build the Rust library:**
```bash
./build.sh android
```

5. **Run the app:**
```bash
cd frontend
npx expo run:android
```

## What Happens During Setup

1. **Expo Prebuild**: The setup automatically runs `expo prebuild` to generate the native Android project files
2. **Package Detection**: Reads your package name from `app.json`
3. **Java Files**: Creates the necessary Java bridge files in the correct location
4. **Native Library**: Compiles Rust to Android-compatible `.so` files

## Development Workflow

Once set up, your development workflow is:

1. **Normal Expo development**: `npx expo start` (for JS/TS changes)
2. **Rebuild Rust when needed**: `./build.sh android` (only when you modify Rust code)
3. **Test on device**: `npx expo run:android`

## Important Notes for Expo

- **No More Expo Go**: Once you add native modules, you can't use Expo Go. You need to build development builds.
- **EAS Build**: For production, you'll need to use EAS Build to create APKs/AABs.
- **Development Builds**: Use `expo run:android` for development testing.

## Troubleshooting Expo-Specific Issues

### Issue: "Module not found"
**Solution**: Make sure you've run `expo prebuild` and the Android project exists.

### Issue: "NDK not found" 
**Solution**: Install Android Studio and the NDK:
```bash
# Using Android Studio SDK Manager, install:
# - Android SDK Command-line Tools
# - NDK (Side by side)
```

### Issue: "Native module not registered"
**Solution**: The setup script should handle this, but verify `MainApplication.java` includes:
```java
import com.yourapp.freelist.FreelistRustPackage;
// ...
new FreelistRustPackage()
```

## Alternative: Development Server Approach

If you're having trouble with native modules, you can also run the Rust core as a server during development:

1. **Add server dependencies to `core/Cargo.toml`:**
```toml
[dependencies]
# ... existing dependencies
tokio = { version = "1.0", features = ["full"] }
warp = "0.3"
```

2. **Start the Rust server:**
```bash
cd core
cargo run --bin server
```

3. **Use HTTP API in your React Native app** (modify the API client to use HTTP instead of native calls)

This lets you develop with `npx expo start` while still using your Rust backend!