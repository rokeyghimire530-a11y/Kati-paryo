package com.katiparyo.app.ui.screens

import android.app.Activity
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.katiparyo.app.data.model.PriceReport
import com.katiparyo.app.data.model.PriceSource
import com.katiparyo.app.data.model.Product
import com.katiparyo.app.data.model.SellerProduct
import com.katiparyo.app.data.repository.NepalMarketRepository
import com.katiparyo.app.monetization.AdMobManager
import com.katiparyo.app.ui.components.PriceHistoryChart
import com.katiparyo.app.ui.theme.*

@Composable
fun ProductDetailScreen(
    product: Product,
    sellerProducts: List<SellerProduct>,
    priceReports: List<PriceReport>,
    isSaved: Boolean,
    currentLanguage: String,
    onBackClick: () -> Unit,
    onToggleSave: () -> Unit,
    onSubmitPricePaid: (Double, String) -> Unit,
    onSetPriceAlert: (Double) -> Unit
) {
    val context = LocalContext.current
    val activity = context as? Activity

    var showReportDialog by remember { mutableStateOf(false) }
    var showAlertDialog by remember { mutableStateOf(false) }
    var showFlagDialog by remember { mutableStateOf(false) }

    var inputPricePaid by remember { mutableStateOf(product.avgPrice.toString()) }
    var inputShopName by remember { mutableStateOf("") }
    var inputAlertTarget by remember { mutableStateOf((product.minPrice * 0.95).toInt().toString()) }

    val productSellers = remember(sellerProducts, product) {
        sellerProducts.filter { it.productId == product.id }
    }

    val productReports = remember(priceReports, product) {
        priceReports.filter { it.productId == product.id }
    }

    Scaffold(
        topBar = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 8.dp, vertical = 6.dp)
            ) {
                IconButton(onClick = onBackClick) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                }

                Row {
                    IconButton(onClick = onToggleSave) {
                        Icon(
                            imageVector = if (isSaved) Icons.Default.Bookmark else Icons.Default.BookmarkBorder,
                            contentDescription = "Save",
                            tint = if (isSaved) CrimsonRed else SlateTextMain
                        )
                    }

                    IconButton(
                        onClick = {
                            val shareIntent = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(
                                    Intent.EXTRA_TEXT,
                                    "Kati Paryo? — ${product.name}\nEstimated Price: ${NepalMarketRepository.formatNpr(product.minPrice)} - ${NepalMarketRepository.formatNpr(product.maxPrice)} (Avg: ${NepalMarketRepository.formatNpr(product.avgPrice)})\nSource: ${product.priceSource.labelEn}\nDownload Kati Paryo? for accurate Nepal market prices!"
                                )
                            }
                            context.startActivity(Intent.createChooser(shareIntent, "Share Product Price"))
                        }
                    ) {
                        Icon(Icons.Default.Share, contentDescription = "Share")
                    }
                }
            }
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(SlateBackground)
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Product Hero Image & Meta
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder)
                ) {
                    Column {
                        AsyncImage(
                            model = product.imageUrl,
                            contentDescription = product.name,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(220.dp)
                        )

                        Column(modifier = Modifier.padding(16.dp)) {
                            // Source Badge & Category
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Surface(
                                    shape = RoundedCornerShape(4.dp),
                                    color = when (product.priceSource) {
                                        PriceSource.SELLER_PRICE -> EmeraldLight
                                        PriceSource.USER_REPORTED -> CrimsonRedLight
                                        PriceSource.ESTIMATED -> AmberLight
                                    }
                                ) {
                                    Text(
                                        text = if (currentLanguage == "ne") product.priceSource.labelNe else product.priceSource.labelEn,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = when (product.priceSource) {
                                            PriceSource.SELLER_PRICE -> EmeraldGreen
                                            PriceSource.USER_REPORTED -> CrimsonRed
                                            PriceSource.ESTIMATED -> AmberWarning
                                        },
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }

                                Text(
                                    text = "Updated: ${product.updatedAtLabel}",
                                    fontSize = 11.sp,
                                    color = SlateTextMuted
                                )
                            }

                            Spacer(modifier = Modifier.height(8.dp))

                            Text(
                                text = if (currentLanguage == "ne") product.nameNe else product.name,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = SlateTextMain
                            )

                            Text(
                                text = "${product.brand} • ${product.model} • ${product.district}",
                                fontSize = 12.sp,
                                color = SlateTextMuted
                            )

                            Spacer(modifier = Modifier.height(14.dp))
                            HorizontalDivider(color = SlateBorder)
                            Spacer(modifier = Modifier.height(14.dp))

                            // Estimated Price Range Callout
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column {
                                    Text(
                                        text = if (currentLanguage == "ne") "अनुमानित बजार मूल्य सीमा" else "Estimated Nepal Price",
                                        fontSize = 12.sp,
                                        color = SlateTextMuted
                                    )
                                    Text(
                                        text = "${NepalMarketRepository.formatNpr(product.minPrice)} - ${NepalMarketRepository.formatNpr(product.maxPrice)}",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = SlateTextMain
                                    )
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        text = if (currentLanguage == "ne") "औसत मूल्य (Avg)" else "Average Price",
                                        fontSize = 12.sp,
                                        color = SlateTextMuted
                                    )
                                    Text(
                                        text = NepalMarketRepository.formatNpr(product.avgPrice),
                                        fontSize = 20.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = CrimsonRed
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Quick CTAs: Submit price paid / Set alert / Report error
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    Button(
                        onClick = { showReportDialog = true },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = if (currentLanguage == "ne") "मैले तिरेको मूल्य" else "Report Paid", fontSize = 11.sp)
                    }

                    OutlinedButton(
                        onClick = { showAlertDialog = true },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Notifications, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = if (currentLanguage == "ne") "अलर्ट राख्नुहोस्" else "Price Alert", fontSize = 11.sp)
                    }

                    IconButton(onClick = { showFlagDialog = true }) {
                        Icon(Icons.Default.Flag, contentDescription = "Report incorrect", tint = SlateTextMuted)
                    }
                }
            }

            // Price History Chart with Rewarded Ad Option
            item {
                PriceHistoryChart(
                    minPrice = product.minPrice,
                    avgPrice = product.avgPrice,
                    maxPrice = product.maxPrice,
                    currentLanguage = currentLanguage,
                    onWatchAdToUnlock = {
                        activity?.let {
                            AdMobManager.showRewarded(it) {
                                // Rewarded unlocked
                            }
                        }
                    }
                )
            }

            // Seller Prices Comparison
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = if (currentLanguage == "ne") "पसलहरूको मूल्य तुलना (Seller Prices)" else "Compare Seller Prices",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = SlateTextMain
                        )
                        Spacer(modifier = Modifier.height(10.dp))

                        if (productSellers.isEmpty()) {
                            Text(
                                text = if (currentLanguage == "ne") "यस सामानको लागि हाल कुनै प्रत्यक्ष विक्रेता सूचीबद्ध छैन।" else "No direct seller listings yet.",
                                fontSize = 12.sp,
                                color = SlateTextMuted
                            )
                        } else {
                            productSellers.forEach { seller ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 6.dp)
                                ) {
                                    Column {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(text = seller.shopName, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = SlateTextMain)
                                            if (seller.verifiedSeller) {
                                                Spacer(modifier = Modifier.width(4.dp))
                                                Surface(shape = RoundedCornerShape(4.dp), color = EmeraldLight) {
                                                    Text(text = "Verified", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = EmeraldGreen, modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp))
                                                }
                                            }
                                        }
                                        Text(text = "${seller.district} • Call: ${seller.inquiryPhoneHint}", fontSize = 11.sp, color = SlateTextMuted)
                                    }

                                    Text(
                                        text = NepalMarketRepository.formatNpr(seller.price),
                                        fontSize = 15.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = SlateTextMain
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // User Submitted Prices List
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = if (currentLanguage == "ne") "ग्राहकहरूले तिरेको मूल्य (User Reports)" else "User-Reported Prices",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = SlateTextMain
                        )
                        Spacer(modifier = Modifier.height(10.dp))

                        if (productReports.isEmpty()) {
                            Text(
                                text = if (currentLanguage == "ne") "अहिलेसम्म कुनै ग्राहकले मूल्य पठाएका छैनन्।" else "No user price reports yet.",
                                fontSize = 12.sp,
                                color = SlateTextMuted
                            )
                        } else {
                            productReports.forEach { report ->
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                ) {
                                    Column {
                                        Text(text = report.shopName, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = SlateTextMain)
                                        Text(text = "${report.userName} • ${report.district} • ${report.purchaseDate}", fontSize = 11.sp, color = SlateTextMuted)
                                    }
                                    Text(
                                        text = NepalMarketRepository.formatNpr(report.pricePaid),
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = CrimsonRed
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Submit Price Paid Dialog
    if (showReportDialog) {
        AlertDialog(
            onDismissRequest = { showReportDialog = false },
            title = { Text(if (currentLanguage == "ne") "मैले तिरेको मूल्य थप्नुहोस्" else "Submit Price You Paid") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = inputPricePaid,
                        onValueChange = { inputPricePaid = it },
                        label = { Text("Price Paid (Rs.)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = inputShopName,
                        onValueChange = { inputShopName = it },
                        label = { Text("Shop Name (e.g. New Road Mart)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val price = inputPricePaid.toDoubleOrNull() ?: product.avgPrice
                        onSubmitPricePaid(price, inputShopName.ifBlank { "Local Shop" })
                        showReportDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed)
                ) {
                    Text("Submit")
                }
            },
            dismissButton = {
                TextButton(onClick = { showReportDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Set Price Alert Dialog
    if (showAlertDialog) {
        AlertDialog(
            onDismissRequest = { showAlertDialog = false },
            title = { Text(if (currentLanguage == "ne") "मूल्य अलर्ट सेट गर्नुहोस्" else "Set Price-Drop Alert") },
            text = {
                Column {
                    Text("Notify me when price falls below Rs:", fontSize = 12.sp, color = SlateTextMuted)
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = inputAlertTarget,
                        onValueChange = { inputAlertTarget = it },
                        label = { Text("Target Price (Rs.)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val target = inputAlertTarget.toDoubleOrNull() ?: product.minPrice
                        onSetPriceAlert(target)
                        showAlertDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed)
                ) {
                    Text("Enable Alert")
                }
            },
            dismissButton = {
                TextButton(onClick = { showAlertDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Report Incorrect Price Dialog
    if (showFlagDialog) {
        AlertDialog(
            onDismissRequest = { showFlagDialog = false },
            title = { Text("Report Incorrect Price") },
            text = {
                Text("Thank you for helping keep Kati Paryo? accurate. Our moderation team will review this listing.")
            },
            confirmButton = {
                Button(onClick = { showFlagDialog = false }, colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed)) {
                    Text("Submit")
                }
            }
        )
    }
}
