package com.katiparyo.app.data.local

import androidx.room.TypeConverter
import com.katiparyo.app.data.model.PriceSource

class KatiParyoConverters {

    @TypeConverter
    fun fromPriceSource(source: PriceSource): String {
        return source.name
    }

    @TypeConverter
    fun toPriceSource(value: String): PriceSource {
        return try {
            PriceSource.valueOf(value)
        } catch (e: IllegalArgumentException) {
            PriceSource.ESTIMATED
        }
    }
}
