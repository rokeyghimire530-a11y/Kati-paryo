package com.katiparyo.app.data.model

data class Product(
    val id: String,
    val name: String,
    val nameNe: String,
    val brand: String,
    val model: String,
    val categoryId: String,
    val categoryName: String,
    val imageUrl: String,
    val minPrice: Double,
    val maxPrice: Double,
    val avgPrice: Double,
    val priceSource: PriceSource,
    val confidenceScore: Int,
    val district: String,
    val featured: Boolean = false,
    val sponsored: Boolean = false,
    val updatedAtLabel: String = "2026-10-02",
    val priceDropPercent: Int? = null,
    val hasSufficientRecentData: Boolean = true
)

enum class PriceSource(val labelNe: String, val labelEn: String) {
    ESTIMATED("अनुमानित मूल्य (Estimated)", "Estimated"),
    SELLER_PRICE("पसलको मूल्य (Seller Price)", "Seller Price"),
    USER_REPORTED("ग्राहकले तिरेको (User Reported)", "User Reported")
}
