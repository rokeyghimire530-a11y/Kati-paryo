package com.katiparyo.app.ui.screens

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.katiparyo.app.data.model.Product
import com.katiparyo.app.monetization.AdMobManager
import com.katiparyo.app.ui.components.AdMobBannerView
import com.katiparyo.app.ui.components.ProductCard
import com.katiparyo.app.ui.theme.*

@Composable
fun SearchScreen(
    products: List<Product>,
    currentLanguage: String,
    onProductClick: (Product) -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity

    var searchQuery by remember { mutableStateOf("") }
    var selectedBrand by remember { mutableStateOf<String?>(null) }

    val brands = remember(products) {
        listOf("All") + products.map { it.brand }.distinct()
    }

    val searchSuggestions = listOf("Redmi Note 13", "MacBook Air", "Samsung Galaxy", "Baltra Cooker", "Studds Helmet")

    val filteredProducts = remember(searchQuery, selectedBrand, products) {
        products.filter { product ->
            val matchesQuery = searchQuery.isBlank() ||
                    product.name.contains(searchQuery, ignoreCase = true) ||
                    product.nameNe.contains(searchQuery, ignoreCase = true) ||
                    product.brand.contains(searchQuery, ignoreCase = true) ||
                    product.model.contains(searchQuery, ignoreCase = true) ||
                    product.categoryName.contains(searchQuery, ignoreCase = true)

            val matchesBrand = selectedBrand == null || selectedBrand == "All" || product.brand.equals(selectedBrand, ignoreCase = true)

            matchesQuery && matchesBrand
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Search Input
        item {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = {
                    searchQuery = it
                    if (it.length > 2 && activity != null) {
                        AdMobManager.onSearchPerformed(activity)
                    }
                },
                placeholder = {
                    Text(
                        text = if (currentLanguage == "ne") "सामान, ब्रान्ड वा मोडेल खोज्नुहोस्..." else "Search product, brand, model...",
                        fontSize = 14.sp,
                        color = SlateTextMuted
                    )
                },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = CrimsonRed
                    )
                },
                trailingIcon = {
                    if (searchQuery.isNotEmpty()) {
                        IconButton(onClick = { searchQuery = "" }) {
                            Icon(imageVector = Icons.Default.Close, contentDescription = "Clear")
                        }
                    }
                },
                shape = RoundedCornerShape(12.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = CrimsonRed,
                    unfocusedBorderColor = SlateBorder,
                    focusedContainerColor = Color.White,
                    unfocusedContainerColor = Color.White
                ),
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Suggestions
        if (searchQuery.isEmpty()) {
            item {
                Column {
                    Text(
                        text = if (currentLanguage == "ne") "चर्चित खोजीहरू:" else "Popular Searches:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = SlateTextMuted
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        items(searchSuggestions) { suggestion ->
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color.White,
                                border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                                modifier = Modifier.height(32.dp)
                            ) {
                                TextButton(
                                    onClick = {
                                        searchQuery = suggestion
                                        if (activity != null) {
                                            AdMobManager.onSearchPerformed(activity)
                                        }
                                    },
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 0.dp)
                                ) {
                                    Text(text = suggestion, fontSize = 11.sp, color = SlateTextMain)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Brand Filter Row
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(brands) { brand ->
                    val isSelected = (brand == "All" && selectedBrand == null) || selectedBrand == brand
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (isSelected) CrimsonRed else Color.White,
                        border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                        modifier = Modifier.height(32.dp)
                    ) {
                        TextButton(
                            onClick = { selectedBrand = if (brand == "All") null else brand },
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 0.dp)
                        ) {
                            Text(
                                text = brand,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isSelected) Color.White else SlateTextMain
                            )
                        }
                    }
                }
            }
        }

        // Results count
        item {
            Text(
                text = "${filteredProducts.size} " + if (currentLanguage == "ne") "सामानहरू भेटिए" else "products found",
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = SlateTextMuted
            )
        }

        // Results Grid
        items(filteredProducts.chunked(2)) { pair ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                for (product in pair) {
                    ProductCard(
                        product = product,
                        currentLanguage = currentLanguage,
                        onClick = { onProductClick(product) },
                        modifier = Modifier.weight(1f)
                    )
                }
                if (pair.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }

        // AdMob Banner
        item {
            AdMobBannerView()
        }
    }
}
