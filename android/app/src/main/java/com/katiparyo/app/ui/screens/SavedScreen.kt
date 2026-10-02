package com.katiparyo.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.katiparyo.app.data.model.Product
import com.katiparyo.app.data.repository.NepalMarketRepository
import com.katiparyo.app.ui.components.ProductCard
import com.katiparyo.app.ui.theme.*

@Composable
fun SavedScreen(
    savedProducts: List<Product>,
    currentLanguage: String,
    onProductClick: (Product) -> Unit,
    onBrowseClick: () -> Unit
) {
    if (savedProducts.isEmpty()) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier
                .fillMaxSize()
                .background(SlateBackground)
                .padding(24.dp)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = if (currentLanguage == "ne") "तपाईंले कुनै सामान सेभ गर्नुभएको छैन।" else "No saved products yet.",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = SlateTextMain
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = if (currentLanguage == "ne") "सामान खोजी गरी मूल्य ट्र्याक गर्न सेभ गर्नुहोस्।" else "Save products to track price drops and receive alerts.",
                    fontSize = 12.sp,
                    color = SlateTextMuted
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onBrowseClick,
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed)
                ) {
                    Text(text = if (currentLanguage == "ne") "सामानहरू हेर्नुहोस्" else "Browse Products")
                }
            }
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(SlateBackground),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Column {
                    Text(
                        text = if (currentLanguage == "ne") "सेभ गरिएका सामानहरू (Saved Products)" else "Saved Products & Watchlist",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = SlateTextMain
                    )
                    Text(
                        text = "${savedProducts.size} " + if (currentLanguage == "ne") "सामानहरू ट्र्याकिङमा छन्" else "products currently tracked",
                        fontSize = 12.sp,
                        color = SlateTextMuted
                    )
                }
            }

            items(savedProducts.chunked(2)) { pair ->
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
        }
    }
}
