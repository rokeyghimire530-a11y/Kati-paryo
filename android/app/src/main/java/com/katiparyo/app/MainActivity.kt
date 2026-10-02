package com.katiparyo.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.katiparyo.app.data.model.PriceReport
import com.katiparyo.app.data.model.Product
import com.katiparyo.app.data.repository.NepalMarketRepository
import com.katiparyo.app.ui.components.KatiParyoBottomBar
import com.katiparyo.app.ui.components.KatiParyoTopBar
import com.katiparyo.app.ui.components.Screen
import com.katiparyo.app.ui.screens.*
import com.katiparyo.app.ui.theme.KatiParyoTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        NepalMarketRepository.initialize(applicationContext)
        setContent {
            KatiParyoTheme {
                val currentLanguage by NepalMarketRepository.currentLanguage.collectAsState()
                val selectedDistrict by NepalMarketRepository.selectedDistrict.collectAsState()
                val isOnline by NepalMarketRepository.isOnline.collectAsState()
                val products by NepalMarketRepository.products.collectAsState()
                val categories by NepalMarketRepository.categoriesFlow.collectAsState()
                val savedProductIds by NepalMarketRepository.savedProductIds.collectAsState()
                val sellers by NepalMarketRepository.sellers.collectAsState()
                val sellerProducts by NepalMarketRepository.sellerProducts.collectAsState()
                val priceReports by NepalMarketRepository.priceReports.collectAsState()

                var currentRoute by remember { mutableStateOf(Screen.Home.route) }
                var selectedProduct by remember { mutableStateOf<Product?>(null) }

                Scaffold(
                    topBar = {
                        if (selectedProduct == null) {
                            KatiParyoTopBar(
                                selectedDistrict = selectedDistrict,
                                currentLanguage = currentLanguage,
                                isOnline = isOnline,
                                onDistrictClick = {
                                    // Rotate between popular districts for demo
                                    val districts = listOf("Kathmandu", "Pokhara", "Lalitpur", "Chitwan", "Butwal")
                                    val nextIndex = (districts.indexOf(selectedDistrict) + 1) % districts.size
                                    NepalMarketRepository.setDistrict(districts[nextIndex])
                                },
                                onToggleLanguage = {
                                    NepalMarketRepository.setLanguage(if (currentLanguage == "ne") "en" else "ne")
                                }
                            )
                        }
                    },
                    bottomBar = {
                        if (selectedProduct == null) {
                            KatiParyoBottomBar(
                                currentRoute = currentRoute,
                                currentLanguage = currentLanguage,
                                onNavigate = { route ->
                                    currentRoute = route
                                }
                            )
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        if (selectedProduct != null) {
                            val prod = selectedProduct!!
                            ProductDetailScreen(
                                product = prod,
                                sellerProducts = sellerProducts,
                                priceReports = priceReports,
                                isSaved = savedProductIds.contains(prod.id),
                                currentLanguage = currentLanguage,
                                onBackClick = { selectedProduct = null },
                                onToggleSave = { NepalMarketRepository.toggleSaveProduct(prod.id) },
                                onSubmitPricePaid = { price, shop ->
                                    val report = PriceReport(
                                        id = "pr_${System.currentTimeMillis()}",
                                        userId = "u_1",
                                        userName = if (currentLanguage == "ne") "नेपाली उपभोक्ता" else "Nepal Shopper",
                                        productId = prod.id,
                                        productName = prod.name,
                                        pricePaid = price,
                                        quantity = 1,
                                        district = selectedDistrict,
                                        shopName = shop,
                                        purchaseDate = "2026-10-02"
                                    )
                                    NepalMarketRepository.submitPriceReport(report)
                                },
                                onSetPriceAlert = {
                                    // Price alert activated
                                }
                            )
                        } else {
                            when (currentRoute) {
                                Screen.Home.route -> {
                                    HomeScreen(
                                        products = products,
                                        categories = categories,
                                        sellers = sellers,
                                        currentLanguage = currentLanguage,
                                        onProductClick = { prod -> selectedProduct = prod },
                                        onCategoryClick = { /* Filter */ },
                                        onSearchClick = { currentRoute = Screen.Search.route },
                                        onCameraClick = { currentRoute = Screen.Scan.route }
                                    )
                                }
                                Screen.Search.route -> {
                                    SearchScreen(
                                        products = products,
                                        currentLanguage = currentLanguage,
                                        onProductClick = { prod -> selectedProduct = prod }
                                    )
                                }
                                Screen.Scan.route -> {
                                    ScannerScreen(
                                        currentLanguage = currentLanguage,
                                        onProductAdded = { newProd ->
                                            NepalMarketRepository.addProduct(newProd)
                                            selectedProduct = newProd
                                        }
                                    )
                                }
                                Screen.Saved.route -> {
                                    val savedList = products.filter { savedProductIds.contains(it.id) }
                                    SavedScreen(
                                        savedProducts = savedList,
                                        currentLanguage = currentLanguage,
                                        onProductClick = { prod -> selectedProduct = prod },
                                        onBrowseClick = { currentRoute = Screen.Home.route }
                                    )
                                }
                                Screen.Profile.route -> {
                                    ProfileScreen(
                                        currentLanguage = currentLanguage,
                                        selectedDistrict = selectedDistrict,
                                        sellers = sellers,
                                        onLanguageChange = { NepalMarketRepository.setLanguage(it) },
                                        onDistrictChange = { NepalMarketRepository.setDistrict(it) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
