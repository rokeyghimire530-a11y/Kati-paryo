package com.katiparyo.app.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import com.katiparyo.app.data.model.Category
import com.katiparyo.app.data.model.PriceReport
import com.katiparyo.app.data.model.PriceSource
import com.katiparyo.app.data.model.Product
import com.katiparyo.app.data.model.Seller
import com.katiparyo.app.data.model.SellerProduct

@Entity(
    tableName = "products",
    indices = [
        Index(value = ["categoryId"]),
        Index(value = ["district"]),
        Index(value = ["brand"])
    ]
)
data class ProductEntity(
    @PrimaryKey val id: String,
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
    val hasSufficientRecentData: Boolean = true,
    val cachedAtMillis: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "categories",
    indices = [Index(value = ["slug"], unique = true)]
)
data class CategoryEntity(
    @PrimaryKey val id: String,
    val nameNe: String,
    val nameEn: String,
    val slug: String,
    val iconName: String,
    val sortOrder: Int,
    val cachedAtMillis: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "sellers",
    indices = [Index(value = ["district"])]
)
data class SellerEntity(
    @PrimaryKey val id: String,
    val ownerId: String,
    val shopName: String,
    val district: String,
    val marketArea: String,
    val categoryFocus: String,
    val verified: Boolean,
    val status: String = "approved",
    val updatedAtLabel: String = "2026-10-02",
    val cachedAtMillis: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "seller_products",
    indices = [
        Index(value = ["productId"]),
        Index(value = ["sellerId"])
    ]
)
data class SellerProductEntity(
    @PrimaryKey val id: String,
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
    val updatedAtLabel: String = "2026-10-02",
    val cachedAtMillis: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "price_reports",
    indices = [Index(value = ["productId"])]
)
data class PriceReportEntity(
    @PrimaryKey val id: String,
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
    val status: String = "approved",
    val isPendingSync: Boolean = false,
    val cachedAtMillis: Long = System.currentTimeMillis()
)

@Entity(tableName = "saved_products")
data class SavedProductEntity(
    @PrimaryKey val productId: String,
    val savedAtMillis: Long = System.currentTimeMillis()
)

// Domain <-> Room Entity Mappers

fun ProductEntity.toDomain(): Product = Product(
    id = id,
    name = name,
    nameNe = nameNe,
    brand = brand,
    model = model,
    categoryId = categoryId,
    categoryName = categoryName,
    imageUrl = imageUrl,
    minPrice = minPrice,
    maxPrice = maxPrice,
    avgPrice = avgPrice,
    priceSource = priceSource,
    confidenceScore = confidenceScore,
    district = district,
    featured = featured,
    sponsored = sponsored,
    updatedAtLabel = updatedAtLabel,
    priceDropPercent = priceDropPercent,
    hasSufficientRecentData = hasSufficientRecentData
)

fun Product.toEntity(): ProductEntity = ProductEntity(
    id = id,
    name = name,
    nameNe = nameNe,
    brand = brand,
    model = model,
    categoryId = categoryId,
    categoryName = categoryName,
    imageUrl = imageUrl,
    minPrice = minPrice,
    maxPrice = maxPrice,
    avgPrice = avgPrice,
    priceSource = priceSource,
    confidenceScore = confidenceScore,
    district = district,
    featured = featured,
    sponsored = sponsored,
    updatedAtLabel = updatedAtLabel,
    priceDropPercent = priceDropPercent,
    hasSufficientRecentData = hasSufficientRecentData
)

fun CategoryEntity.toDomain(): Category = Category(
    id = id,
    nameNe = nameNe,
    nameEn = nameEn,
    slug = slug,
    iconName = iconName,
    sortOrder = sortOrder
)

fun Category.toEntity(): CategoryEntity = CategoryEntity(
    id = id,
    nameNe = nameNe,
    nameEn = nameEn,
    slug = slug,
    iconName = iconName,
    sortOrder = sortOrder
)

fun SellerEntity.toDomain(): Seller = Seller(
    id = id,
    ownerId = ownerId,
    shopName = shopName,
    district = district,
    marketArea = marketArea,
    categoryFocus = categoryFocus,
    verified = verified,
    status = status,
    updatedAtLabel = updatedAtLabel
)

fun Seller.toEntity(): SellerEntity = SellerEntity(
    id = id,
    ownerId = ownerId,
    shopName = shopName,
    district = district,
    marketArea = marketArea,
    categoryFocus = categoryFocus,
    verified = verified,
    status = status,
    updatedAtLabel = updatedAtLabel
)

fun SellerProductEntity.toDomain(): SellerProduct = SellerProduct(
    id = id,
    sellerId = sellerId,
    ownerId = ownerId,
    shopName = shopName,
    district = district,
    verifiedSeller = verifiedSeller,
    productId = productId,
    productName = productName,
    price = price,
    stockStatus = stockStatus,
    inquiryPhoneHint = inquiryPhoneHint,
    updatedAtLabel = updatedAtLabel
)

fun SellerProduct.toEntity(): SellerProductEntity = SellerProductEntity(
    id = id,
    sellerId = sellerId,
    ownerId = ownerId,
    shopName = shopName,
    district = district,
    verifiedSeller = verifiedSeller,
    productId = productId,
    productName = productName,
    price = price,
    stockStatus = stockStatus,
    inquiryPhoneHint = inquiryPhoneHint,
    updatedAtLabel = updatedAtLabel
)

fun PriceReportEntity.toDomain(): PriceReport = PriceReport(
    id = id,
    userId = userId,
    userName = userName,
    productId = productId,
    productName = productName,
    pricePaid = pricePaid,
    quantity = quantity,
    district = district,
    shopName = shopName,
    purchaseDate = purchaseDate,
    receiptUrl = receiptUrl,
    status = status
)

fun PriceReport.toEntity(isPendingSync: Boolean = false): PriceReportEntity = PriceReportEntity(
    id = id,
    userId = userId,
    userName = userName,
    productId = productId,
    productName = productName,
    pricePaid = pricePaid,
    quantity = quantity,
    district = district,
    shopName = shopName,
    purchaseDate = purchaseDate,
    receiptUrl = receiptUrl,
    status = status,
    isPendingSync = isPendingSync
)
