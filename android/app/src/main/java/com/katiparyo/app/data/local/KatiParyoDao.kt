package com.katiparyo.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import kotlinx.coroutines.flow.Flow

@Dao
interface KatiParyoDao {

    // --- Products ---
    @Query("SELECT * FROM products ORDER BY featured DESC, cachedAtMillis DESC")
    fun observeProducts(): Flow<List<ProductEntity>>

    @Query("SELECT * FROM products WHERE id = :productId LIMIT 1")
    suspend fun getProductById(productId: String): ProductEntity?

    @Query(
        """
        SELECT * FROM products
        WHERE name LIKE '%' || :query || '%'
           OR nameNe LIKE '%' || :query || '%'
           OR brand LIKE '%' || :query || '%'
           OR model LIKE '%' || :query || '%'
           OR categoryName LIKE '%' || :query || '%'
        ORDER BY featured DESC, cachedAtMillis DESC
        """
    )
    fun searchProducts(query: String): Flow<List<ProductEntity>>

    @Query("SELECT COUNT(*) FROM products")
    suspend fun getProductCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertProducts(products: List<ProductEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertProduct(product: ProductEntity)

    // --- Categories ---
    @Query("SELECT * FROM categories ORDER BY sortOrder ASC")
    fun observeCategories(): Flow<List<CategoryEntity>>

    @Query("SELECT COUNT(*) FROM categories")
    suspend fun getCategoryCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertCategories(categories: List<CategoryEntity>)

    // --- Sellers ---
    @Query("SELECT * FROM sellers ORDER BY verified DESC, shopName ASC")
    fun observeSellers(): Flow<List<SellerEntity>>

    @Query("SELECT * FROM sellers WHERE district = :district ORDER BY verified DESC, shopName ASC")
    fun observeSellersByDistrict(district: String): Flow<List<SellerEntity>>

    @Query("SELECT COUNT(*) FROM sellers")
    suspend fun getSellerCount(): Int

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSellers(sellers: List<SellerEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSeller(seller: SellerEntity)

    // --- Seller Products ---
    @Query("SELECT * FROM seller_products ORDER BY verifiedSeller DESC, price ASC")
    fun observeSellerProducts(): Flow<List<SellerProductEntity>>

    @Query("SELECT * FROM seller_products WHERE productId = :productId ORDER BY verifiedSeller DESC, price ASC")
    fun observeSellerProductsForProduct(productId: String): Flow<List<SellerProductEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertSellerProducts(sellerProducts: List<SellerProductEntity>)

    // --- Price Reports ---
    @Query("SELECT * FROM price_reports ORDER BY cachedAtMillis DESC")
    fun observePriceReports(): Flow<List<PriceReportEntity>>

    @Query("SELECT * FROM price_reports WHERE isPendingSync = 1")
    suspend fun getPendingSyncPriceReports(): List<PriceReportEntity>

    @Query("UPDATE price_reports SET isPendingSync = 0 WHERE id = :reportId")
    suspend fun markPriceReportSynced(reportId: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPriceReports(reports: List<PriceReportEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPriceReport(report: PriceReportEntity)

    // --- Saved Products ---
    @Query("SELECT * FROM saved_products ORDER BY savedAtMillis DESC")
    fun observeSavedProducts(): Flow<List<SavedProductEntity>>

    @Query("SELECT EXISTS(SELECT 1 FROM saved_products WHERE productId = :productId)")
    suspend fun isProductSaved(productId: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveProduct(saved: SavedProductEntity)

    @Query("DELETE FROM saved_products WHERE productId = :productId")
    suspend fun removeSavedProduct(productId: String)

    // --- Atomic Initial Cache Seeding ---
    @Transaction
    suspend fun seedInitialMarketCacheIfEmpty(
        defaultCategories: List<CategoryEntity>,
        defaultProducts: List<ProductEntity>,
        defaultSellers: List<SellerEntity>,
        defaultSellerProducts: List<SellerProductEntity>,
        defaultPriceReports: List<PriceReportEntity>,
        defaultSavedProducts: List<SavedProductEntity>
    ) {
        if (getCategoryCount() == 0) {
            upsertCategories(defaultCategories)
        }
        if (getProductCount() == 0) {
            upsertProducts(defaultProducts)
            defaultSavedProducts.forEach { saveProduct(it) }
        }
        if (getSellerCount() == 0) {
            upsertSellers(defaultSellers)
            upsertSellerProducts(defaultSellerProducts)
            upsertPriceReports(defaultPriceReports)
        }
    }
}
