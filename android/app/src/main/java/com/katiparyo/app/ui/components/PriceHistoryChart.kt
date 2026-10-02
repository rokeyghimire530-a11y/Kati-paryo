package com.katiparyo.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.katiparyo.app.data.model.PriceHistoryPoint
import com.katiparyo.app.data.model.PriceSource
import com.katiparyo.app.data.repository.NepalMarketRepository
import com.katiparyo.app.ui.theme.CrimsonRed
import com.katiparyo.app.ui.theme.SlateBorder
import com.katiparyo.app.ui.theme.SlateTextMain
import com.katiparyo.app.ui.theme.SlateTextMuted

@Composable
fun PriceHistoryChart(
    minPrice: Double,
    avgPrice: Double,
    maxPrice: Double,
    currentLanguage: String,
    onWatchAdToUnlock: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedRange by remember { mutableStateOf("3m") }
    var isUnlocked by remember { mutableStateOf(false) }

    val ranges = listOf("30d", "3m", "6m", "1y")

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (currentLanguage == "ne") "मूल्य इतिहास (Price History)" else "Price History",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = SlateTextMain
                )

                // Range Selector
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    ranges.forEach { range ->
                        val isSelected = selectedRange == range
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (isSelected) CrimsonRed else Color(0xFFF1F5F9),
                            modifier = Modifier.height(28.dp)
                        ) {
                            TextButton(
                                onClick = { selectedRange = range },
                                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)
                            ) {
                                Text(
                                    text = range,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (isSelected) Color.White else SlateTextMuted
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Metric Summary
            Row(
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text(text = if (currentLanguage == "ne") "न्यूनतम" else "Lowest", fontSize = 11.sp, color = SlateTextMuted)
                    Text(text = NepalMarketRepository.formatNpr(minPrice), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SlateTextMain)
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(text = if (currentLanguage == "ne") "औसत" else "Average", fontSize = 11.sp, color = SlateTextMuted)
                    Text(text = NepalMarketRepository.formatNpr(avgPrice), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = CrimsonRed)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(text = if (currentLanguage == "ne") "अधिकतम" else "Highest", fontSize = 11.sp, color = SlateTextMuted)
                    Text(text = NepalMarketRepository.formatNpr(maxPrice), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = SlateTextMain)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Smooth Canvas Graph
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(110.dp)
            ) {
                val width = size.width
                val height = size.height

                // Draw background grid lines
                drawLine(
                    color = SlateBorder,
                    start = Offset(0f, height * 0.25f),
                    end = Offset(width, height * 0.25f),
                    strokeWidth = 1f
                )
                drawLine(
                    color = SlateBorder,
                    start = Offset(0f, height * 0.75f),
                    end = Offset(width, height * 0.75f),
                    strokeWidth = 1f
                )

                // Trend curve points
                val p1 = Offset(0f, height * 0.7f)
                val p2 = Offset(width * 0.33f, height * 0.55f)
                val p3 = Offset(width * 0.66f, height * 0.4f)
                val p4 = Offset(width, height * 0.3f)

                val path = Path().apply {
                    moveTo(p1.x, p1.y)
                    cubicTo(p1.x + 40f, p1.y, p2.x - 40f, p2.y, p2.x, p2.y)
                    cubicTo(p2.x + 40f, p2.y, p3.x - 40f, p3.y, p3.x, p3.y)
                    cubicTo(p3.x + 40f, p3.y, p4.x - 40f, p4.y, p4.x, p4.y)
                }

                drawPath(
                    path = path,
                    color = CrimsonRed,
                    style = Stroke(width = 4.dp.toPx(), cap = StrokeCap.Round)
                )

                // Highlight points
                listOf(p1, p2, p3, p4).forEach { point ->
                    drawCircle(color = Color.White, radius = 6.dp.toPx(), center = point)
                    drawCircle(color = CrimsonRed, radius = 4.dp.toPx(), center = point)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Rewarded Ad Prompt: "Watch an ad to unlock detailed 1-year price history"
            if (!isUnlocked) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = Color(0xFFFEF2F2),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.padding(12.dp)
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = if (currentLanguage == "ne") "विस्तृत १ वर्षको मूल्य इतिहास अनलक गर्नुहोस्" else "Unlock 1-Year Detailed History",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = CrimsonRed
                            )
                            Text(
                                text = if (currentLanguage == "ne") "छोटो विज्ञापन हेरी पूर्ण डेटा हेर्नुहोस् (Rewarded Ad)" else "Watch a short ad to view raw sample points",
                                fontSize = 10.sp,
                                color = SlateTextMuted
                            )
                        }

                        Button(
                            onClick = {
                                onWatchAdToUnlock()
                                isUnlocked = true
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = CrimsonRed),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = if (currentLanguage == "ne") "विज्ञापन हेर्नुहोस्" else "Watch Ad",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
