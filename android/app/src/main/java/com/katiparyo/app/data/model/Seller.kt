package com.katiparyo.app.data.model

data class Seller(
    val id: String,
    val ownerId: String,
    val shopName: String,
    val district: String,
    val marketArea: String,
    val categoryFocus: String,
    val verified: Boolean,
    val status: String = "approved",
    val updatedAtLabel: String = "2026-10-02"
)

data class SellerProduct(
    val id: String,
    val sellerId: String,
    val ownerId: String,
    val shopName: String,
    val district: String,
    val verifiedSeller: Boolean,
    val productId: String,
    val productName: String,
    val price: Double,
    val stockStatus: String = "in_stock",
    val inquiryPhoneHint: String,
    val updatedAtLabel: String = "2026-10-02"
)
