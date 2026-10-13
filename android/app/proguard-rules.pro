# ProGuard / R8 rules for WoHo Browser Android
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*

# Retain AndroidX Core and FileProvider
-keep class androidx.core.content.FileProvider { *; }

# Keep reflection points if any for local models
-keepclassmembers class in.wohotech.browser.android.** { *; }
