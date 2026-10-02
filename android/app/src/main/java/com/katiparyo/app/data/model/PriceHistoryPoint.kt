package com.katiparyo.app.data.model

data class PriceHistoryPoint(
    val id: String,
    val productId: String,
    val dateLabel: String,
    val minPrice: Double,
    val avgPrice: Double,
    val maxPrice: Double,
    val sourceType: PriceSource,
    val sampleCount: Int,
    val periodGroup: String = "3m"
)
