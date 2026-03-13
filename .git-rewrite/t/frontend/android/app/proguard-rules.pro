# ProGuard Rules for PulseLogic (Capacitor WebView app)
# ─────────────────────────────────────────────────────

# Keep Capacitor bridge classes
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView JavaScript interface
-keepattributes JavascriptInterface

# Keep source info for crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# AndroidX
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Don't warn about missing optional dependencies
-dontwarn org.apache.**
-dontwarn com.google.**
-dontwarn okhttp3.**

# Optimize
-optimizationpasses 5
-allowaccessmodification
