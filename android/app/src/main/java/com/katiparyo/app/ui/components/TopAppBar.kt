package com.katiparyo.app.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Translate
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.katiparyo.app.ui.theme.CrimsonRed
import com.katiparyo.app.ui.theme.SlateBorder
import com.katiparyo.app.ui.theme.SlateTextMain

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KatiParyoTopBar(
    selectedDistrict: String,
    currentLanguage: String,
    isOnline: Boolean = true,
    onDistrictClick: () -> Unit,
    onToggleLanguage: () -> Unit
) {
    TopAppBar(
        title = {
            Column {
                Text(
                    text = "Kati Paryo?",
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp,
                    color = SlateTextMain
                )
                Text(
                    text = if (currentLanguage == "ne") "सामान किन्नुअघि, मूल्य थाहा पाऔँ।" else "Nepal Market Price Estimator",
                    fontSize = 11.sp,
                    color = Color.Gray
                )
            }
        },
        actions = {
            // Offline Cache Status Indicator when connection is unstable
            if (!isOnline) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0xFFFEF3C7),
                    modifier = Modifier.padding(end = 6.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.CloudOff,
                            contentDescription = "Offline Cache",
                            tint = Color(0xFFD97706),
                            modifier = Modifier.size(13.dp)
                        )
                        Spacer(modifier = Modifier.width(3.dp))
                        Text(
                            text = if (currentLanguage == "ne") "अफलाइन क्यास" else "Cached",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color(0xFF92400E)
                        )
                    }
                }
            }

            // Location Badge
            Surface(
                shape = RoundedCornerShape(8.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, SlateBorder),
                color = Color.White,
                modifier = Modifier
                    .clickable { onDistrictClick() }
                    .padding(end = 8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = "District",
                        tint = CrimsonRed,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = selectedDistrict,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = SlateTextMain
                    )
                }
            }

            // Language Toggle
            IconButton(onClick = onToggleLanguage) {
                Icon(
                    imageVector = Icons.Default.Translate,
                    contentDescription = "Language",
                    tint = SlateTextMain
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = Color.White
        )
    )
}
