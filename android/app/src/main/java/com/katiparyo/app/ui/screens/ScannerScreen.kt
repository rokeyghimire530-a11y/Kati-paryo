package com.katiparyo.app.ui.screens

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.PhotoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.katiparyo.app.data.api.GeminiPriceScannerService
import com.katiparyo.app.data.model.PriceSource
import com.katiparyo.app.data.model.Product
import com.katiparyo.app.data.model.ScannedBillResult
import com.katiparyo.app.data.model.ScannedProductResult
import com.katiparyo.app.data.repository.NepalMarketRepository
import com.katiparyo.app.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun ScannerScreen(
    currentLanguage: String,
    onProductAdded: (Product) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val scannerService = remember { GeminiPriceScannerService() }

    var scanMode by remember { mutableStateOf("product") } // "product" or "bill"
    var isScanning by remember { mutableStateOf(false) }
    var productResult by remember { mutableStateOf<ScannedProductResult?>(null) }
    var billResult by remember { mutableStateOf<ScannedBillResult?>(null) }
    var userHint by remember { mutableStateOf("") }
    var isManualEditOpen by remember { mutableStateOf(false) }

    // Photo picker launcher
    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            coroutineScope.launch {
                isScanning = true
                try {
                    val stream = context.contentResolver.openInputStream(uri)
                    val bitmap = BitmapFactory.decodeStream(stream)
                    if (scanMode == "product") {
                        val res = scannerService.scanProduct(bitmap ?: Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888), userHint)
                        productResult = res.getOrNull()
                    } else {
                        val res = scannerService.scanBill(bitmap ?: Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888))
                        billResult = res.getOrNull()
                    }
                } finally {
                    isScanning = false
                }
            }
        }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Mode Selector: Product Scanner vs Bill Scanner
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White, RoundedCornerShape(12.dp))
                    .padding(4.dp)
            ) {
                Button(
                    onClick = {
                        scanMode = "product"
                        productResult = null
                        billResult = null
                    },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (scanMode == "product") CrimsonRed else Color.Transparent,
                        contentColor = if (scanMode == "product") Color.White else SlateTextMain
                    ),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = if (currentLanguage == "ne") "सामान स्क्यानर" else "Product Scanner",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Button(
                    onClick = {
                        scanMode = "bill"
                        productResult = null
                        billResult = null
                    },
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (scanMode == "bill") CrimsonRed else Color.Transparent,
                        contentColor = if (scanMode == "bill") Color.White else SlateTextMain
                    ),
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = if (currentLanguage == "ne") "बिल / रसिद स्क्यानर" else "Bill Scanner",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Camera Action Box
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.padding(24.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.CameraAlt,
                        contentDescription = "Camera",
                        tint = CrimsonRed,
                        modifier = Modifier.size(48.dp)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = if (scanMode == "product") {
                            if (currentLanguage == "ne") "सामानको फोटो खिच्नुहोस् वा छान्नुहोस्" else "Take or upload a product photo"
                        } else {
                            if (currentLanguage == "ne") "पसलको बिल वा रसिद फोटो छान्नुहोस्" else "Upload a store bill or receipt photo"
                        },
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = SlateTextMain
                    )

                    Text(
                        text = if (currentLanguage == "ne") "एआईले सामान र नेपालको बजार मूल्य विश्लेषण गर्नेछ।" else "AI will identify the item and estimate fair Nepal market price.",
                        fontSize = 12.sp,
                        color = SlateTextMuted
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    if (scanMode == "product") {
                        OutlinedTextField(
                            value = userHint,
                            onValueChange = { userHint = it },
                            placeholder = { Text(if (currentLanguage == "ne") "ऐच्छिक: नाम वा ब्रान्ड थाहा भए लेख्नुहोस्..." else "Optional: brand/model hint...", fontSize = 12.sp) },
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(bottom = 12.dp)
                        )
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = { galleryLauncher.launch("image/*") },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed)
                        ) {
                            Icon(Icons.Default.PhotoLibrary, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(text = if (currentLanguage == "ne") "ग्यालरीबाट छान्नुहोस्" else "Choose Photo", fontSize = 12.sp)
                        }

                        OutlinedButton(
                            onClick = {
                                // Simulate instant smart analysis for demo
                                coroutineScope.launch {
                                    isScanning = true
                                    val dummyBitmap = Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888)
                                    if (scanMode == "product") {
                                        productResult = scannerService.scanProduct(dummyBitmap, userHint).getOrNull()
                                    } else {
                                        billResult = scannerService.scanBill(dummyBitmap).getOrNull()
                                    }
                                    isScanning = false
                                }
                            },
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(text = if (currentLanguage == "ne") "नमूना स्क्यान" else "Sample Scan", fontSize = 12.sp)
                        }
                    }
                }
            }
        }

        // Loading Indicator
        if (isScanning) {
            item {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        CircularProgressIndicator(color = CrimsonRed)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = if (currentLanguage == "ne") "एआईले विश्लेषण गर्दैछ..." else "Analyzing with Gemini AI...",
                            fontSize = 13.sp,
                            color = SlateTextMuted
                        )
                    }
                }
            }
        }

        // Product Result Card
        if (!isScanning && productResult != null) {
            val res = productResult!!
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Surface(shape = RoundedCornerShape(4.dp), color = EmeraldLight) {
                                Text(
                                    text = "Confidence: ${res.confidence}%",
                                    color = EmeraldGreen,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                            IconButton(onClick = { isManualEditOpen = !isManualEditOpen }) {
                                Icon(Icons.Default.Edit, contentDescription = "Manual Edit", tint = SlateTextMuted)
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(text = "Product: ${res.productName}", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = SlateTextMain)
                        Text(text = "Brand: ${res.brand} | Model: ${res.model}", fontSize = 13.sp, color = SlateTextMuted)
                        Text(text = "Category: ${res.categoryName}", fontSize = 12.sp, color = SlateTextMuted)

                        Spacer(modifier = Modifier.height(12.dp))

                        Surface(shape = RoundedCornerShape(10.dp), color = Color(0xFFF8FAFC), modifier = Modifier.fillMaxWidth()) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "Estimated Nepal Price: ${NepalMarketRepository.formatNpr(res.minPriceNpr)} - ${NepalMarketRepository.formatNpr(res.maxPriceNpr)}",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = CrimsonRed
                                )
                                Text(text = "Average: ${NepalMarketRepository.formatNpr(res.avgPriceNpr)}", fontSize = 12.sp, color = SlateTextMain)
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Text(
                            text = if (currentLanguage == "ne") res.verificationNoteNe else res.verificationNoteEn,
                            fontSize = 11.sp,
                            color = AmberWarning
                        )

                        Spacer(modifier = Modifier.height(14.dp))

                        Button(
                            onClick = {
                                val newProduct = Product(
                                    id = "prod_ai_${System.currentTimeMillis()}",
                                    name = res.productName,
                                    nameNe = res.productNameNe,
                                    brand = res.brand,
                                    model = res.model,
                                    categoryId = res.categorySlug,
                                    categoryName = res.categoryName,
                                    imageUrl = "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600",
                                    minPrice = res.minPriceNpr,
                                    maxPrice = res.maxPriceNpr,
                                    avgPrice = res.avgPriceNpr,
                                    priceSource = PriceSource.ESTIMATED,
                                    confidenceScore = res.confidence,
                                    district = "Kathmandu"
                                )
                                onProductAdded(newProduct)
                            },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(text = if (currentLanguage == "ne") "क्याटलगमा थप्नुहोस् र तुलना गर्नुहोस्" else "Add to Catalog & Compare", fontSize = 13.sp)
                        }
                    }
                }
            }
        }

        // Bill Result Card
        if (!isScanning && billResult != null) {
            val bill = billResult!!
            item {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(text = "Shop: ${bill.shopName}", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = SlateTextMain)
                        Text(text = "Date: ${bill.billDate} | Location: ${bill.district}", fontSize = 12.sp, color = SlateTextMuted)

                        Spacer(modifier = Modifier.height(10.dp))
                        HorizontalDivider(color = SlateBorder)
                        Spacer(modifier = Modifier.height(10.dp))

                        bill.items.forEach { item ->
                            Row(
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 4.dp)
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = item.productName, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = SlateTextMain)
                                    Text(text = "Qty: ${item.quantity} × ${NepalMarketRepository.formatNpr(item.unitPrice)}", fontSize = 11.sp, color = SlateTextMuted)
                                }
                                Text(
                                    text = NepalMarketRepository.formatNpr(item.lineTotal),
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = SlateTextMain
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        HorizontalDivider(color = SlateBorder)
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(text = "Total Amount:", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = SlateTextMain)
                            Text(text = NepalMarketRepository.formatNpr(bill.totalAmount), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = CrimsonRed)
                        }
                    }
                }
            }
        }
    }
}
