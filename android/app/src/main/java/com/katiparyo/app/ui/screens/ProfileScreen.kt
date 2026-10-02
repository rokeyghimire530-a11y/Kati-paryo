package com.katiparyo.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.katiparyo.app.data.model.Seller
import com.katiparyo.app.data.repository.NepalMarketRepository
import com.katiparyo.app.ui.theme.*

@Composable
fun ProfileScreen(
    currentLanguage: String,
    selectedDistrict: String,
    sellers: List<Seller>,
    onLanguageChange: (String) -> Unit,
    onDistrictChange: (String) -> Unit
) {
    var isSellerRegistered by remember { mutableStateOf(false) }
    var shopName by remember { mutableStateOf("") }
    var marketArea by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var panNumber by remember { mutableStateOf("") }

    var notificationsEnabled by remember { mutableStateOf(true) }
    var showSuccessToast by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(SlateBackground),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // User Profile Card
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(16.dp)
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = CrimsonRedLight,
                        modifier = Modifier.size(54.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Person,
                                contentDescription = "Profile",
                                tint = CrimsonRed,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column {
                        Text(
                            text = if (currentLanguage == "ne") "नेपाली उपभोक्ता (Guest User)" else "Nepal Shopper (Guest)",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = SlateTextMain
                        )
                        Text(
                            text = "$selectedDistrict, Nepal",
                            fontSize = 12.sp,
                            color = SlateTextMuted
                        )
                    }
                }
            }
        }

        // Settings (Language, District, Notifications)
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        text = if (currentLanguage == "ne") "एप सेटिङ्स (Preferences)" else "Preferences",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = SlateTextMain
                    )

                    // Language Switcher
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(text = if (currentLanguage == "ne") "भाषा (Language)" else "Language", fontSize = 13.sp, color = SlateTextMain)
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            FilterChip(
                                selected = currentLanguage == "ne",
                                onClick = { onLanguageChange("ne") },
                                label = { Text("नेपाली") }
                            )
                            FilterChip(
                                selected = currentLanguage == "en",
                                onClick = { onLanguageChange("en") },
                                label = { Text("English") }
                            )
                        }
                    }

                    HorizontalDivider(color = SlateBorder)

                    // Notifications Toggle
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(text = if (currentLanguage == "ne") "मूल्य गिरावट नोटिफिकेसन" else "Price Drop Alerts", fontSize = 13.sp, color = SlateTextMain)
                        Switch(
                            checked = notificationsEnabled,
                            onCheckedChange = { notificationsEnabled = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = CrimsonRed, checkedTrackColor = CrimsonRedLight)
                        )
                    }
                }
            }
        }

        // Seller Account Registration Section
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Storefront, contentDescription = null, tint = CrimsonRed)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (currentLanguage == "ne") "विक्रेता दर्ता पोर्टल (Seller Portal)" else "Seller Registration Portal",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = SlateTextMain
                        )
                    }

                    Text(
                        text = if (currentLanguage == "ne") "आफ्नो पसलको नाम, ठेगाना र मूल्य सूची थप्नुहोस्। एडमिनले प्रमाणीकरण गरेपछि Verified Seller चिन्ह देखाइनेछ।" else "Register your shop to post official prices. Admin must approve for the Verified Seller badge.",
                        fontSize = 12.sp,
                        color = SlateTextMuted
                    )

                    if (isSellerRegistered) {
                        Surface(shape = RoundedCornerShape(8.dp), color = EmeraldLight, modifier = Modifier.fillMaxWidth()) {
                            Text(
                                text = if (currentLanguage == "ne") "तपाईंको पसल दर्ता स्वीकृतिका लागि पठाइएको छ!" else "Shop registered! Pending Admin approval.",
                                color = EmeraldGreen,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(10.dp)
                            )
                        }
                    } else {
                        OutlinedTextField(
                            value = shopName,
                            onValueChange = { shopName = it },
                            label = { Text("Shop Name") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = marketArea,
                            onValueChange = { marketArea = it },
                            label = { Text("Market Area / Street") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Phone Number") },
                            modifier = Modifier.fillMaxWidth()
                        )
                        OutlinedTextField(
                            value = panNumber,
                            onValueChange = { panNumber = it },
                            label = { Text("PAN / Reg. Number") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Button(
                            onClick = {
                                if (shopName.isNotBlank()) {
                                    NepalMarketRepository.registerSeller(
                                        Seller(
                                            id = "seller_${System.currentTimeMillis()}",
                                            ownerId = "u_local",
                                            shopName = shopName.trim(),
                                            district = selectedDistrict,
                                            marketArea = marketArea.ifBlank { "Main Bazaar" },
                                            categoryFocus = "General Retail",
                                            verified = false,
                                            status = "pending"
                                        )
                                    )
                                }
                                isSellerRegistered = true
                            },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Submit Seller Application")
                        }
                    }
                }
            }
        }

        // Play Store & AdMob Credentials Config
        item {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = "Google AdMob & Production Build Config",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = SlateTextMain
                    )
                    Text(
                        text = "• Banner: ca-app-pub-3940256099942544/6300978111\n• Interstitial: ca-app-pub-3940256099942544/1033173712\n• Rewarded: ca-app-pub-3940256099942544/5224354917\n• Play Store Ready: Package com.katiparyo.app",
                        fontSize = 11.sp,
                        color = SlateTextMuted
                    )
                }
            }
        }

        // About & Privacy Policy
        item {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 12.dp)
            ) {
                Text(
                    text = "Kati Paryo? v1.0.0 • Designed for Nepal",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = SlateTextMuted
                )
                Text(
                    text = "Privacy Policy • Terms of Service • Delete Account Data",
                    fontSize = 11.sp,
                    color = CrimsonRed
                )
            }
        }
    }
}
