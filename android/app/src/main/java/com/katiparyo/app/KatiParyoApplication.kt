package com.katiparyo.app

import android.app.Application
import com.google.android.gms.ads.MobileAds
import com.katiparyo.app.data.repository.NepalMarketRepository
import com.katiparyo.app.monetization.AdMobManager

class KatiParyoApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        // Initialize offline-first Room SQLite database & network observer
        NepalMarketRepository.initialize(this)

        // Initialize Google Mobile Ads SDK
        MobileAds.initialize(this) {
            // Load initial interstitial and rewarded test ads
            AdMobManager.loadInterstitial(this)
            AdMobManager.loadRewarded(this)
        }
    }
}
