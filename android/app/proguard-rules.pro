# Proguard rules for Kati Paryo? Android Native App

# Keep data models for Gson serialization/deserialization
-keep class com.katiparyo.app.data.model.** { *; }
-keepclassmembers class com.katiparyo.app.data.model.** { *; }

# Google Mobile Ads (AdMob)
-keep public class com.google.android.gms.ads.** {
   public *;
}
-keep public class com.google.ads.** {
   public *;
}

# OkHttp & Okio
-dontwarn okhttp3.**
-dontwarn okio.**
-keepattributes *Annotation*
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Coil image loader
-dontwarn coil.**
-keep class coil.** { *; }

# Kotlin Coroutines
-dontwarn kotlinx.coroutines.**
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}

# Compose Runtime
-keep class androidx.compose.runtime.** { *; }

# Room Database Entities & DAOs
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-dontwarn androidx.room.paging.**
-keep class com.katiparyo.app.data.local.** { *; }
