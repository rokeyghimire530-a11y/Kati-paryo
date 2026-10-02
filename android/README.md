# Kati Paryo? — Native Android Application (Kotlin & Jetpack Compose)

**Kati Paryo? (सामान किन्नुअघि, मूल्य थाहा पाऔँ।)** is a modern, fast, Nepali-friendly native Android application designed to find and estimate market prices of products across Nepal, compare seller offerings, scan products and bills using AI (Gemini), and monetize ethically with Google AdMob.

---

## 📱 Features Included in the Android App

- **Nepali-Focused Home Dashboard**:
  - Live Nepali/English bilingual toggle (नेपाली / English)
  - District/City switcher supporting Kathmandu, Pokhara, Lalitpur, Chitwan, Butwal, Biratnagar, Dharan, and all 77 districts
  - Dynamic product search bar
  - Instant camera scan shortcut
  - Horizontal & grid category filters (Mobile & Electronics, Laptops, TV & Appliances, Grocery, Clothing, Kitchen, Auto Parts, etc.)
  - Price Drop badges & percentage calculations
  - Verified Seller indicators (प्रमाणित पसल vs सामान्य विक्रेता)

- **AI Camera & Photo Scanner**:
  - **Product Scanner**: Uses camera capture or photo gallery to identify product name, brand, model, category, and estimate Nepal min/avg/max market price with confidence score
  - **Bill / Receipt Scanner**: Extracts shop name, date, line items with individual prices, and bill total with editing capability before submission
  - Intelligent offline fallback with manual correction

- **Product Detail & Price Analysis**:
  - Price Range (न्यूनतम – अधिकतम) and Average Reported Price
  - Clear Price Source labeling (**Estimated**, **Seller Price**, or **User Reported**)
  - Insufficient data indicator when fresh market samples are low
  - Comparison table of local seller prices with shop locations and phone contact
  - Interactive **Price History Chart** (30 days, 3 months, 6 months, 1 year)
  - Native Android Share sheet integration
  - User Price Submission dialog (price paid, shop name, purchase date)
  - Price Drop Alert dialog

- **Saved Products & Profile**:
  - Saved bookmarks with price-drop indicators
  - User account management
  - Seller registration (Shop name, PAN, phone, market address)
  - Notification preference controls

- **Google AdMob Monetization Architecture**:
  - **Banner Ads**: Non-intrusive bottom banners on Home and Search screens
  - **Interstitial Ads**: Natural breakpoint triggers (after every 4 searches, never covering critical inputs)
  - **Rewarded Ads**: Optional user perk — "Watch an ad to unlock detailed 1-year price history"
  - Pre-configured with official Google AdMob test IDs for safe development and testing

---

## 🛠️ Project Structure

```
android/
├── app/
│   ├── build.gradle.kts           # App-level build config (dependencies, signing, AdMob appId)
│   ├── proguard-rules.pro         # Proguard/R8 optimization rules
│   └── src/main/
│       ├── AndroidManifest.xml    # Permissions, Application, AdMob metadata, Activities
│       ├── java/com/katiparyo/app/
│       │   ├── KatiParyoApplication.kt   # MobileAds initialization
│       │   ├── MainActivity.kt           # Jetpack Compose entry point & state management
│       │   ├── data/
│       │   │   ├── api/GeminiPriceScannerService.kt # AI Scanner service
│       │   │   ├── local/
│       │   │   │   ├── KatiParyoDatabase.kt        # Room SQLite Database singleton
│       │   │   │   ├── KatiParyoDao.kt             # Reactive Flow queries & atomic seeding
│       │   │   │   ├── KatiParyoEntities.kt        # Room Entities (Product, Category, Seller, Saved, PriceReport)
│       │   │   │   └── KatiParyoConverters.kt      # TypeConverters for PriceSource enum
│       │   │   ├── model/                          # Product, Seller, Category, PriceReport models
│       │   │   ├── network/NetworkConnectivityObserver.kt # Real-time network stability monitor
│       │   │   └── repository/NepalMarketRepository.kt # Offline-first Room repository & sync queue
│       │   ├── monetization/
│       │   │   └── AdMobManager.kt       # Banner, Interstitial, & Rewarded Ad controllers
│       │   └── ui/
│       │       ├── components/           # TopBar, BottomBar, ProductCard, PriceChart, AdMobBanner
│       │       ├── screens/              # HomeScreen, ScannerScreen, SearchScreen, SavedScreen, ProfileScreen
│       │       └── theme/                # Color, Type, Theme (Material 3)
│       └── res/
│           ├── drawable/                 # Branded vector icons (ic_launcher_foreground, background)
│           ├── mipmap-anydpi-v26/        # Adaptive launcher icons
│           ├── values/                   # strings.xml, colors.xml, themes.xml
│           └── xml/                      # network_security_config, backup_rules, data_extraction_rules
├── gradle/
│   ├── libs.versions.toml                # Dependency version catalog
│   └── wrapper/gradle-wrapper.properties # Gradle 8.10.2 configuration
├── build.gradle.kts                      # Root Gradle config
├── settings.gradle.kts                   # Project module definition
├── gradlew                               # Unix/Linux/macOS Gradle wrapper script
└── gradlew.bat                           # Windows Gradle wrapper script
```

---

## 🚀 How to Build and Install on an Android Phone

### Prerequisites
1. **JDK 17** or later installed
2. **Android Studio** (Ladybug / Meerkat or later) OR **Android SDK Command-line Tools** (compileSdk 35, targetSdk 35)

---

### Method 1: Open in Android Studio (Recommended)
1. Open **Android Studio**.
2. Select **File > Open...** and navigate to the `android/` directory.
3. Allow Gradle to sync the project dependencies.
4. Connect your Android phone via USB with **USB Debugging** enabled (in Developer Options), or start an Android Virtual Device (AVD).
5. Click the green **Run (▶)** button or press `Shift + F10`.
6. The app will compile, install, and launch immediately on your phone.

---

### Method 2: Command Line APK Build

#### 1. Build Debug APK (Fastest for testing)
From the `android/` directory, run:
```bash
./gradlew assembleDebug
```
(On Windows Command Prompt: `gradlew.bat assembleDebug`)

The generated APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### 2. Build Release APK (Pre-signed with debug keystore for instant installation)
```bash
./gradlew assembleRelease
```
The installable release APK will be at:
```
android/app/build/outputs/apk/release/app-release.apk
```

#### 3. Build Android App Bundle (AAB) for Google Play Store Release
```bash
./gradlew bundleRelease
```
The AAB file for Google Play Console upload will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

### 📲 Installing the APK onto your Android Phone

#### Option A: Via ADB (USB / Wi-Fi)
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

#### Option B: Direct Phone Install (Without Computer)
1. Copy `app-debug.apk` or `app-release.apk` to your phone via:
   - USB File Transfer
   - Google Drive / OneDrive
   - WhatsApp / Telegram
2. On your phone, tap the APK file in your **Files** / **Downloads** app.
3. If prompted, allow "Install unknown apps" from that source.
4. Tap **Install** and open **Kati Paryo?**!

---

## 💰 Configuring Production Google AdMob

When you are ready to publish with your live AdMob account:

1. Open `android/app/build.gradle.kts` and update your AdMob App ID:
   ```kotlin
   manifestPlaceholders["admobAppId"] = "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
   ```
2. Open `android/app/src/main/java/com/katiparyo/app/monetization/AdMobManager.kt` and replace test unit IDs with your production IDs:
   ```kotlin
   const val TEST_BANNER_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
   const val TEST_INTERSTITIAL_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
   const val TEST_REWARDED_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY"
   ```

---

## 🤖 Configuring Live Gemini API for Price Scanning

The app connects to the Gemini multimodal API via `GeminiPriceScannerService.kt`.
In local and offline modes, it includes built-in realistic mock data and manual user correction.
To connect to your live backend endpoint, set the server URL in `GeminiPriceScannerService.kt` to your hosted app server (`/api/ai/scan-product` and `/api/ai/scan-bill`).
