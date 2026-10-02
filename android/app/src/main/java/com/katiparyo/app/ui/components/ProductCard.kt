package com.katiparyo.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.katiparyo.app.data.model.PriceSource
import com.katiparyo.app.data.model.Product
import com.katiparyo.app.data.repository.NepalMarketRepository
import com.katiparyo.app.ui.theme.*

@Composable
fun ProductCard(
    product: Product,
    currentLanguage: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        border = BorderStroke(1.dp, SlateBorder),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column {
            // Product Image
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
            ) {
                AsyncImage(
                    model = product.imageUrl,
                    contentDescription = product.name,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // Price drop badge if present
                if (product.priceDropPercent != null && product.priceDropPercent > 0) {
                    Surface(
                        shape = RoundedCornerShape(topStart = 0.dp, bottomStart = 0.dp, topEnd = 8.dp, bottomEnd = 8.dp),
                        color = CrimsonRed,
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(top = 8.dp)
                    ) {
                        Text(
                            text = "-${product.priceDropPercent}%",
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
            }

            Column(modifier = Modifier.padding(12.dp)) {
                // Source badge & Category
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val sourceBadgeColor = when (product.priceSource) {
                        PriceSource.SELLER_PRICE -> EmeraldGreen
                        PriceSource.USER_REPORTED -> CrimsonRed
                        PriceSource.ESTIMATED -> AmberWarning
                    }

                    Text(
                        text = if (currentLanguage == "ne") product.priceSource.labelNe else product.priceSource.labelEn,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = sourceBadgeColor
                    )

                    Text(
                        text = product.district,
                        fontSize = 11.sp,
                        color = SlateTextMuted
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Product Name
                Text(
                    text = if (currentLanguage == "ne") product.nameNe else product.name,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = SlateTextMain,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(8.dp))

                // Price range and average
                Row(
                    verticalAlignment = Alignment.Bottom,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column {
                        Text(
                            text = if (currentLanguage == "ne") "अनुमानित सीमा:" else "Range:",
                            fontSize = 10.sp,
                            color = SlateTextMuted
                        )
                        Text(
                            text = "${NepalMarketRepository.formatNpr(product.minPrice)} - ${NepalMarketRepository.formatNpr(product.maxPrice)}",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
                            color = SlateTextMain
                        )
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = if (currentLanguage == "ne") "औसत (Avg):" else "Average:",
                            fontSize = 10.sp,
                            color = SlateTextMuted
                        )
                        Text(
                            text = NepalMarketRepository.formatNpr(product.avgPrice),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = CrimsonRed
                        )
                    }
                }
            }
        }
    }
}
