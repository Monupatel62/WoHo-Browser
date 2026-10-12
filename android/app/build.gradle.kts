plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val releaseStorePath = System.getenv("ANDROID_KEYSTORE_PATH").orEmpty()
val releaseStorePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD").orEmpty()
val releaseKeyAlias = System.getenv("ANDROID_KEY_ALIAS").orEmpty()
val releaseKeyPassword = System.getenv("ANDROID_KEY_PASSWORD").orEmpty()
val releaseSigningConfigured = releaseStorePath.isNotBlank() &&
    releaseStorePassword.isNotBlank() &&
    releaseKeyAlias.isNotBlank() &&
    releaseKeyPassword.isNotBlank() &&
    file(releaseStorePath).isFile

val releasePackagingRequested = gradle.startParameter.taskNames.any { task ->
    Regex("(^|:)(assemble|bundle)(.*)Release$", RegexOption.IGNORE_CASE).containsMatchIn(task)
}
if (releasePackagingRequested && !releaseSigningConfigured) {
    throw GradleException(
        "Release packaging requires ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, " +
            "ANDROID_KEY_ALIAS, and ANDROID_KEY_PASSWORD. Debug builds do not require release signing."
    )
}

val requestedVersionCode = providers.gradleProperty("releaseVersionCode").orNull?.toIntOrNull() ?: 1
val requestedVersionName = providers.gradleProperty("releaseVersionName").orElse("0.1.0").get()

android {
    namespace = "in.wohotech.browser.android"
    compileSdk = 35
    defaultConfig {
        applicationId = "in.wohotech.browser.android"
        minSdk = 26
        targetSdk = 35
        versionCode = requestedVersionCode
        versionName = requestedVersionName
        testInstrumentationRunner = "android.test.runner.AndroidJUnitRunner"
    }
    signingConfigs {
        create("release") {
            if (releaseSigningConfigured) {
                storeFile = file(releaseStorePath)
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
            }
        }
    }
    buildTypes {
        getByName("release") {
            isMinifyEnabled = false
            signingConfig = if (releaseSigningConfigured) signingConfigs.getByName("release") else null
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    testOptions { unitTests.isReturnDefaultValues = true }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}
