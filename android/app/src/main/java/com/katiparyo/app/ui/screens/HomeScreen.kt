package com.katiparyo.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.katiparyo.app.data.model.Category
import com.katiparyo.app.data.model.Product
import com.katiparyo.app.data.model.Seller
import com.katiparyo.app.data.repository.NepalMarketRepository
import com.katiparyo.app.ui.components.AdMobBannerView
import com.katiparyo.app.ui.components.ProductCard
import com.katiparyo.app.ui.theme.*

@Composable
fun HomeScreen(
    products: List<Product>,
    categories: List<Category>,
    sellers: List<Seller>,
    currentLanguage: String,
    onProductClick: (Product) -> Unit,
    onCategoryClick: (Category) -> Unit,
    onSearchClick: () -> Unit,
    onCameraClick: () -> Unit
) {
    var selectedCategorySlug by remember { mutableStateOf<String?>("all") }

    val filteredProducts = remember(selectedCategorySlug, products) {
        if (selectedCategorySlug == null || selectedCategorySlug == "all") {
            products
        } else {
            products.filter { it.categoryId.contains(selectedCategorySlug!!) || it.categoryName.lowercase().contains(selectedCategorySlug!!) }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Card
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = SlateTextMain),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp)
                ) {
                    Text(
                        text = if (currentLanguage == "ne") "सामान किन्नुअघि, मूल्य थाहा पाऔँ।" else "Know the real Nepal market price before you buy.",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = CrimsonRedLight
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = if (currentLanguage == "ne") "नेपालको बजार मूल्य खोज्नुहोस् र तुलना गर्नुहोस्" else "Search & Compare Verified Prices Across Nepal",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    // Search Bar & Camera Trigger
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = Color.White,
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .clickable { onSearchClick() }
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 12.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Search,
                                    contentDescription = "Search",
                                    tint = SlateTextMuted,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (currentLanguage == "ne") "कुन सामानको मूल्य जान्न चाहनुहुन्छ?" else "Search product name...",
                                    fontSize = 13.sp,
                                    color = SlateTextMuted
                                )
                            }
                        }

                        Button(
                            onClick = onCameraClick,
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed),
                            modifier = Modifier.height(48.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.CameraAlt,
                                contentDescription = "Camera",
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = if (currentLanguage == "ne") "फोटो" else "Scan",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }

        // Categories Header & Horizontal List
        item {
            Column {
                Text(
                    text = if (currentLanguage == "ne") "सामानका श्रेणीहरू (Categories)" else "Product Categories",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = SlateTextMain
                )

                Spacer(modifier = Modifier.height(10.dp))

                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    item {
                        val isAllSelected = selectedCategorySlug == "all"
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (isAllSelected) CrimsonRed else Color.White,
                            border = if (isAllSelected) null else androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                            modifier = Modifier
                                .height(38.dp)
                                .clickable { selectedCategorySlug = "all" }
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.padding(horizontal = 14.dp)
                            ) {
                                Text(
                                    text = if (currentLanguage == "ne") "सबै सामान" else "All",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (isAllSelected) Color.White else SlateTextMain
                                )
                            }
                        }
                    }

                    items(categories) { category ->
                        val isSelected = selectedCategorySlug == category.slug
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) CrimsonRed else Color.White,
                            border = if (isSelected) null else androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                            modifier = Modifier
                                .height(38.dp)
                                .clickable {
                                    selectedCategorySlug = category.slug
                                    onCategoryClick(category)
                                }
                        ) {
                            Box(
                                contentAlignment = Alignment.Center,
                                modifier = Modifier.padding(horizontal = 14.dp)
                            ) {
                                Text(
                                    text = if (currentLanguage == "ne") category.nameNe else category.nameEn,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (isSelected) Color.White else SlateTextMain
                                )
                            }
                        }
                    }
                }
            }
        }

        // Popular Products Section
        item {
            Text(
                text = if (currentLanguage == "ne") "चर्चित सामानहरू (Popular Products)" else "Popular Products",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = SlateTextMain
            )
        }

        // Products Grid
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

        // Nearby Sellers Section
        item {
            Column(modifier = Modifier.padding(top = 8.dp)) {
                Text(
                    text = if (currentLanguage == "ne") "नजिकका प्रमाणित पसलहरू (Nearby Sellers)" else "Nearby Verified Sellers",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = SlateTextMain
                )

                Spacer(modifier = Modifier.height(10.dp))

                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        sellers.forEach { seller ->
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = seller.shopName,
                                            fontSize = 13.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = SlateTextMain
                                        )
                                        if (seller.verified) {
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Surface(
                                                shape = RoundedCornerShape(4.dp),
                                                color = EmeraldLight
                                            ) {
                                                Text(
                                                    text = "Verified",
                                                    fontSize = 9.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = EmeraldGreen,
                                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                )
                                            }
                                        }
                                    }
                                    Text(
                                        text = "${seller.marketArea}, ${seller.district} • ${seller.categoryFocus}",
                                        fontSize = 11.sp,
                                        color = SlateTextMuted
                                    )
                                }
                            }
                            if (seller != sellers.last()) {
                                HorizontalDivider(color = SlateBorder)
                            }
                        }
                    }
                }
            }
        }

        // Google AdMob Bottom Banner
        item {
            AdMobBannerView()
        }
    }
}
