# WoHo Browser for Android

This is the initial native Android browser foundation. It is separate from the Electron desktop app and uses Android System WebView.

## Implemented in this foundation
- HTTP/HTTPS address validation and search input.
- Multiple WebView tabs with switching and closing.
- Back, forward, reload, local bookmarks, and bounded local history.
- User-visible downloads through Android DownloadManager.
- JavaScript enabled for site compatibility, but no JavaScript-to-native bridge.
- File/content access disabled, mixed content blocked, Safe Browsing enabled, unsupported schemes rejected, and TLS errors cancelled.
- Bookmark/history persistence on the device with bounded record counts.

## Not yet implemented or release-verified
Private browsing with verified cookie/cache isolation, settings UI, bookmark editing/import/export, permission mediation beyond platform defaults, custom error pages, full accessibility review, device compatibility, and signed release artifacts. Do not describe this foundation as production-ready.

## Build
Requires JDK 17, Android SDK Platform 35, and Gradle 8.9 or a compatible installed Gradle.

```sh
gradle -p android testDebugUnitTest assembleDebug
```

The debug APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`. Do not distribute a debug build as a production release.
