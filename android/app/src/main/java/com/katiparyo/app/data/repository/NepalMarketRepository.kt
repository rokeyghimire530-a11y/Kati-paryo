package com.katiparyo.app.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.katiparyo.app.data.local.KatiParyoDao
import com.katiparyo.app.data.local.KatiParyoDatabase
import com.katiparyo.app.data.local.SavedProductEntity
import com.katiparyo.app.data.local.toDomain
import com.katiparyo.app.data.local.toEntity
import com.katiparyo.app.data.model.Category
import com.katiparyo.app.data.model.PriceReport
import com.katiparyo.app.data.model.PriceSource
import com.katiparyo.app.data.model.Product
import com.katiparyo.app.data.model.Seller
import com.katiparyo.app.data.model.SellerProduct
import com.katiparyo.app.data.network.NetworkConnectivityObserver
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale

/**
 * Offline-first repository backed by Room SQLite database.
 * Ensures products, categories, sellers, saved items, and price reports remain available
 * and interactive even when the internet connection is unstable or unavailable.
 */
object NepalMarketRepository {

    private const val PREFS_NAME = "kati_paryo_prefs"
    private const val KEY_DISTRICT = "selected_district"
    private const val KEY_LANGUAGE = "current_language"

    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var dao: KatiParyoDao? = null
    private var prefs: SharedPreferences? = null
    private var networkObserver: NetworkConnectivityObserver? = null

    val nepalDistricts = listOf(
        "Kathmandu" to "काठमाडौँ",
        "Lalitpur" to "ललितपुर",
        "Bhaktapur" to "भक्तपुर",
        "Pokhara" to "पोखरा (कास्की)",
        "Chitwan" to "चितवन (भरतपुर)",
        "Butwal" to "बुटवल (रुपन्देही)",
        "Dharan" to "धरान (सुनसरी)",
        "Biratnagar" to "विराटनगर (मोरङ)",
        "Nepalgunj" to "नेपालगन्ज (बाँके)",
        "Dhangadhi" to "धनगढी (कैलाली)",
        "Itahari" to "इटहरी",
        "Birgunj" to "वीरगन्ज",
        "Hetauda" to "हेटौँडा",
        "Birtamode" to "बिर्तामोड",
        "Janakpur" to "जनकपुर",
        "Surkhet" to "सुर्खेत"
    )

    private val _selectedDistrict = MutableStateFlow("Kathmandu")
    val selectedDistrict: StateFlow<String> = _selectedDistrict.asStateFlow()

    private val _currentLanguage = MutableStateFlow("ne") // "ne" or "en"
    val currentLanguage: StateFlow<String> = _currentLanguage.asStateFlow()

    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    val defaultCategories = listOf(
        Category("cat_mobile", "मोबाइल र इलेक्ट्रोनिक्स", "Mobile & Electronics", "mobile-electronics", "Smartphone", 1),
        Category("cat_laptop", "ल्यापटप र कम्प्युटर", "Laptop & Computer", "laptop-computer", "Laptop", 2),
        Category("cat_tv", "टिभी र घरायसी उपकरण", "TV & Appliances", "tv-appliances", "Tv", 3),
        Category("cat_grocery", "किराना तथा खाद्यान्न", "Grocery", "grocery", "ShoppingBag", 4),
        Category("cat_clothing", "लत्ताकपडा", "Clothing", "clothing", "Shirt", 5),
        Category("cat_cosmetics", "सौन्दर्य सामग्री", "Cosmetics", "cosmetics", "Sparkles", 6),
        Category("cat_furniture", "फर्निचर", "Furniture", "furniture", "Armchair", 7),
        Category("cat_construction", "निर्माण सामग्री", "Construction Materials", "construction-materials", "Hammer", 8),
        Category("cat_auto", "मोटरसाइकल र अटो पार्ट्स", "Motorcycle & Auto Parts", "motorcycle-auto-parts", "Bike", 9),
        Category("cat_kitchen", "भान्साका सामान", "Kitchen Products", "kitchen-products", "Utensils", 10),
        Category("cat_home", "घरायसी सामान", "Home Products", "home-products", "Home", 11),
        Category("cat_other", "अन्य", "Other", "other", "Package", 12)
    )

    private val _categoriesFlow = MutableStateFlow(defaultCategories)
    val categoriesFlow: StateFlow<List<Category>> = _categoriesFlow.asStateFlow()

    // Property accessor for immediate read compatibility
    val categories: List<Category>
        get() = _categoriesFlow.value

    private val defaultProducts = listOf(
        Product(
            id = "prod_redmi_note13",
            name = "Redmi Note 13 4G (8GB / 256GB)",
            nameNe = "रेडमी नोट १३ (8GB / 256GB)",
            brand = "Xiaomi",
            model = "Redmi Note 13",
            categoryId = "cat_mobile",
            categoryName = "Mobile & Electronics",
            imageUrl = "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600",
            minPrice = 23500.0,
            maxPrice = 25999.0,
            avgPrice = 24500.0,
            priceSource = PriceSource.SELLER_PRICE,
            confidenceScore = 94,
            district = "Kathmandu",
            featured = true,
            priceDropPercent = 6,
            hasSufficientRecentData = true
        ),
        Product(
            id = "prod_samsung_a15",
            name = "Samsung Galaxy A15 5G (8GB / 128GB)",
            nameNe = "सामसुङ ग्यालेक्सी A15 5G (8GB / 128GB)",
            brand = "Samsung",
            model = "Galaxy A15 5G",
            categoryId = "cat_mobile",
            categoryName = "Mobile & Electronics",
            imageUrl = "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600",
            minPrice = 27800.0,
            maxPrice = 29999.0,
            avgPrice = 28900.0,
            priceSource = PriceSource.SELLER_PRICE,
            confidenceScore = 92,
            district = "Kathmandu",
            featured = true,
            priceDropPercent = 4,
            hasSufficientRecentData = true
        ),
        Product(
            id = "prod_acer_aspire5",
            name = "Acer Aspire 5 Core i5 13th Gen (16GB / 512GB)",
            nameNe = "एसर एस्पायर ५ Core i5 13th Gen",
            brand = "Acer",
            model = "Aspire 5",
            categoryId = "cat_laptop",
            categoryName = "Laptop & Computer",
            imageUrl = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600",
            minPrice = 76000.0,
            maxPrice = 82500.0,
            avgPrice = 78500.0,
            priceSource = PriceSource.USER_REPORTED,
            confidenceScore = 89,
            district = "Kathmandu",
            featured = true,
            priceDropPercent = 5,
            hasSufficientRecentData = true
        ),
        Product(
            id = "prod_macbook_air_m2",
            name = "Apple MacBook Air M2 (8GB / 256GB)",
            nameNe = "एप्पल म्याकबुक एयर M2 (8GB / 256GB)",
            brand = "Apple",
            model = "MacBook Air M2",
            categoryId = "cat_laptop",
            categoryName = "Laptop & Computer",
            imageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600",
            minPrice = 136000.0,
            maxPrice = 145000.0,
            avgPrice = 139500.0,
            priceSource = PriceSource.SELLER_PRICE,
            confidenceScore = 91,
            district = "Lalitpur",
            featured = true,
            sponsored = true,
            priceDropPercent = 8,
            hasSufficientRecentData = true
        ),
        Product(
            id = "prod_baltra_cooker_5l",
            name = "Baltra Stainless Steel Induction Pressure Cooker 5L",
            nameNe = "बाल्ट्रा स्टेनलेस स्टिल प्रेसर कुकर (५ लिटर)",
            brand = "Baltra",
            model = "BPC-502",
            categoryId = "cat_kitchen",
            categoryName = "Kitchen Products",
            imageUrl = "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600",
            minPrice = 3100.0,
            maxPrice = 3650.0,
            avgPrice = 3350.0,
            priceSource = PriceSource.USER_REPORTED,
            confidenceScore = 88,
            district = "Pokhara",
            priceDropPercent = 7,
            hasSufficientRecentData = true
        ),
        Product(
            id = "prod_studds_helmet",
            name = "Studds Thunder D7 Full Face Motorcycle Helmet",
            nameNe = "स्टड्स थन्डर फुल फेस हेलमेट",
            brand = "Studds",
            model = "Thunder D7",
            categoryId = "cat_auto",
            categoryName = "Motorcycle & Auto Parts",
            imageUrl = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600",
            minPrice = 4600.0,
            maxPrice = 5200.0,
            avgPrice = 4850.0,
            priceSource = PriceSource.USER_REPORTED,
            confidenceScore = 86,
            district = "Butwal",
            hasSufficientRecentData = true
        )
    )

    private val _products = MutableStateFlow(defaultProducts)
    val products: StateFlow<List<Product>> = _products.asStateFlow()

    private val _savedProductIds = MutableStateFlow<Set<String>>(setOf("prod_redmi_note13"))
    val savedProductIds: StateFlow<Set<String>> = _savedProductIds.asStateFlow()

    private val defaultSellers = listOf(
        Seller("s_1", "admin", "Tamrakar Mobile & Gadget Hub", "Kathmandu", "New Road, Pako", "Mobile & Electronics", true),
        Seller("s_2", "admin", "Himalayan IT & Laptop Traders", "Kathmandu", "Putalisadak Bazaar", "Laptop & Computer", true),
        Seller("s_3", "admin", "Gandaki Kitchen Emporium", "Pokhara", "Chipledhunga", "Kitchen Products", true),
        Seller("s_4", "user", "Lumbini Auto Parts", "Butwal", "Traffic Chowk", "Motorcycle & Auto Parts", false)
    )

    private val _sellers = MutableStateFlow(defaultSellers)
    val sellers: StateFlow<List<Seller>> = _sellers.asStateFlow()

    private val defaultSellerProducts = listOf(
        SellerProduct("sp_1", "s_1", "admin", "Tamrakar Mobile Hub", "Kathmandu", true, "prod_redmi_note13", "Redmi Note 13", 23999.0, "in_stock", "01-422XXXX / 98510XXXXX"),
        SellerProduct("sp_2", "s_2", "admin", "Himalayan IT Traders", "Kathmandu", true, "prod_acer_aspire5", "Acer Aspire 5", 77500.0, "in_stock", "01-443XXXX / 98011XXXXX"),
        SellerProduct("sp_3", "s_3", "admin", "Gandaki Kitchen", "Pokhara", true, "prod_baltra_cooker_5l", "Baltra Cooker 5L", 3250.0, "in_stock", "061-53XXXX / 98460XXXXX")
    )

    private val _sellerProducts = MutableStateFlow(defaultSellerProducts)
    val sellerProducts: StateFlow<List<SellerProduct>> = _sellerProducts.asStateFlow()

    private val defaultPriceReports = listOf(
        PriceReport("pr_1", "u_1", "सुमन श्रेष्ठ (Suman S.)", "prod_redmi_note13", "Redmi Note 13", 24200.0, 1, "Kathmandu", "Pako Mobile Arcade", "2026-09-28"),
        PriceReport("pr_2", "u_2", "अनिता गुरुङ (Anita G.)", "prod_baltra_cooker_5l", "Baltra Cooker 5L", 3300.0, 1, "Pokhara", "Mahendrapul Utensils", "2026-09-26")
    )

    private val _priceReports = MutableStateFlow(defaultPriceReports)
    val priceReports: StateFlow<List<PriceReport>> = _priceReports.asStateFlow()

    /**
     * Initializes the Room database, seeds offline cache if empty, and starts reactive Flow collectors.
     */
    fun initialize(context: Context) {
        if (dao != null) return

        val appContext = context.applicationContext
        val database = KatiParyoDatabase.getInstance(appContext)
        val localDao = database.katiParyoDao()
        dao = localDao

        val sharedPrefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs = sharedPrefs
        _selectedDistrict.value = sharedPrefs.getString(KEY_DISTRICT, "Kathmandu") ?: "Kathmandu"
        _currentLanguage.value = sharedPrefs.getString(KEY_LANGUAGE, "ne") ?: "ne"

        val connectivity = NetworkConnectivityObserver(appContext)
        networkObserver = connectivity

        // Seed initial market cache into Room if tables are empty
        repositoryScope.launch {
            localDao.seedInitialMarketCacheIfEmpty(
                defaultCategories = defaultCategories.map { it.toEntity() },
                defaultProducts = defaultProducts.map { it.toEntity() },
                defaultSellers = defaultSellers.map { it.toEntity() },
                defaultSellerProducts = defaultSellerProducts.map { it.toEntity() },
                defaultPriceReports = defaultPriceReports.map { it.toEntity(isPendingSync = false) },
                defaultSavedProducts = listOf(SavedProductEntity("prod_redmi_note13"))
            )
        }

        // Observe Room tables and keep StateFlows updated for instant offline UI rendering
        repositoryScope.launch {
            localDao.observeCategories().collectLatest { entities ->
                if (entities.isNotEmpty()) {
                    _categoriesFlow.value = entities.map { it.toDomain() }
                }
            }
        }

        repositoryScope.launch {
            localDao.observeProducts().collectLatest { entities ->
                if (entities.isNotEmpty()) {
                    _products.value = entities.map { it.toDomain() }
                }
            }
        }

        repositoryScope.launch {
            localDao.observeSellers().collectLatest { entities ->
                if (entities.isNotEmpty()) {
                    _sellers.value = entities.map { it.toDomain() }
                }
            }
        }

        repositoryScope.launch {
            localDao.observeSellerProducts().collectLatest { entities ->
                if (entities.isNotEmpty()) {
                    _sellerProducts.value = entities.map { it.toDomain() }
                }
            }
        }

        repositoryScope.launch {
            localDao.observePriceReports().collectLatest { entities ->
                if (entities.isNotEmpty()) {
                    _priceReports.value = entities.map { it.toDomain() }
                }
            }
        }

        repositoryScope.launch {
            localDao.observeSavedProducts().collectLatest { entities ->
                _savedProductIds.value = entities.map { it.productId }.toSet()
            }
        }

        // Observe network status and flush pending offline reports when connection stabilizes
        repositoryScope.launch {
            connectivity.isOnline.collectLatest { online ->
                _isOnline.value = online
                if (online) {
                    syncPendingOfflineData()
                }
            }
        }
    }

    private suspend fun syncPendingOfflineData() {
        val localDao = dao ?: return
        val pendingReports = localDao.getPendingSyncPriceReports()
        pendingReports.forEach { report ->
            // Mark synced once network is restored
            localDao.markPriceReportSynced(report.id)
        }
    }

    fun setDistrict(district: String) {
        _selectedDistrict.value = district
        prefs?.edit()?.putString(KEY_DISTRICT, district)?.apply()
    }

    fun setLanguage(lang: String) {
        _currentLanguage.value = lang
        prefs?.edit()?.putString(KEY_LANGUAGE, lang)?.apply()
    }

    fun toggleSaveProduct(productId: String) {
        val currentlySaved = _savedProductIds.value.contains(productId)
        // Optimistic update
        _savedProductIds.value = if (currentlySaved) {
            _savedProductIds.value - productId
        } else {
            _savedProductIds.value + productId
        }

        // Persist to Room
        repositoryScope.launch {
            val localDao = dao ?: return@launch
            if (currentlySaved) {
                localDao.removeSavedProduct(productId)
            } else {
                localDao.saveProduct(SavedProductEntity(productId))
            }
        }
    }

    fun addProduct(product: Product) {
        _products.value = listOf(product) + _products.value.filterNot { it.id == product.id }
        repositoryScope.launch {
            dao?.upsertProduct(product.toEntity())
        }
    }

    fun registerSeller(seller: Seller) {
        _sellers.value = listOf(seller) + _sellers.value.filterNot { it.id == seller.id }
        repositoryScope.launch {
            dao?.upsertSeller(seller.toEntity())
        }
    }

    fun submitPriceReport(report: PriceReport) {
        _priceReports.value = listOf(report) + _priceReports.value
        val isCurrentlyOnline = _isOnline.value
        repositoryScope.launch {
            dao?.upsertPriceReport(report.toEntity(isPendingSync = !isCurrentlyOnline))
        }
    }

    fun formatNpr(amount: Double): String {
        return "Rs. " + NumberFormat.getNumberInstance(Locale("en", "IN")).format(amount.toLong())
    }
}
