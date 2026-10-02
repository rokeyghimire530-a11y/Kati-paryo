package com.katiparyo.app.data.model

data class PriceReport(
    val id: String,
    val userId: String,
    val userName: String,
    val productId: String,
    val productName: String,
    val pricePaid: Double,
    val quantity: Int = 1,
    val district: String,
    val shopName: String,
    val purchaseDate: String,
    val receiptUrl: String = "",
    val status: String = "approved"
)
