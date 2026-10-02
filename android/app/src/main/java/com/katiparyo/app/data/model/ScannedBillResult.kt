package com.katiparyo.app.data.model

data class ScannedBillResult(
    val shopName: String,
    val billDate: String,
    val district: String,
    val totalAmount: Double,
    val confidence: Int,
    val items: List<BillItem>
)

data class BillItem(
    val productName: String,
    val quantity: Int,
    val unitPrice: Double,
    val lineTotal: Double,
    val categorySlug: String
)

data class ScannedProductResult(
    val identified: Boolean,
    val productName: String,
    val productNameNe: String,
    val brand: String,
    val model: String,
    val categorySlug: String,
    val categoryName: String,
    val approximateType: String,
    val minPriceNpr: Double,
    val avgPriceNpr: Double,
    val maxPriceNpr: Double,
    val confidence: Int,
    val verificationNoteNe: String,
    val verificationNoteEn: String
)
