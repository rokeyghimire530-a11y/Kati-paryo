package com.katiparyo.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColorScheme = lightColorScheme(
    primary = CrimsonRed,
    onPrimary = Color.White,
    primaryContainer = CrimsonRedLight,
    onPrimaryContainer = CrimsonRedDark,
    secondary = SlateTextMain,
    onSecondary = Color.White,
    background = SlateBackground,
    onBackground = SlateTextMain,
    surface = SlateSurface,
    onSurface = SlateTextMain,
    outline = SlateBorder
)

@Composable
fun KatiParyoTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        typography = Typography,
        content = content
    )
}
