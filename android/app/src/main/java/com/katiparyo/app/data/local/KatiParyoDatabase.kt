package com.katiparyo.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Database(
    entities = [
        ProductEntity::class,
        CategoryEntity::class,
        SellerEntity::class,
        SellerProductEntity::class,
        PriceReportEntity::class,
        SavedProductEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(KatiParyoConverters::class)
abstract class KatiParyoDatabase : RoomDatabase() {

    abstract fun katiParyoDao(): KatiParyoDao

    companion object {
        private const val DATABASE_NAME = "kati_paryo_nepal_cache.db"

        @Volatile
        private var INSTANCE: KatiParyoDatabase? = null

        fun getInstance(context: Context): KatiParyoDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    KatiParyoDatabase::class.java,
                    DATABASE_NAME
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}
