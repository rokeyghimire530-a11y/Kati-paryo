package com.katiparyo.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.katiparyo.app.ui.theme.CrimsonRed
import com.katiparyo.app.ui.theme.SlateBorder
import com.katiparyo.app.ui.theme.SlateTextMuted

sealed class Screen(val route: String, val titleNe: String, val titleEn: String, val icon: ImageVector) {
    object Home : Screen("home", "गृहपृष्ठ", "Home", Icons.Default.Home)
    object Search : Screen("search", "खोज्नुहोस्", "Search", Icons.Default.Search)
    object Scan : Screen("scan", "स्क्यान", "Scan", Icons.Default.CameraAlt)
    object Saved : Screen("saved", "सेभ", "Saved", Icons.Default.Bookmark)
    object Profile : Screen("profile", "प्रोफाइल", "Profile", Icons.Default.Person)
}

val bottomNavItems = listOf(
    Screen.Home,
    Screen.Search,
    Screen.Scan,
    Screen.Saved,
    Screen.Profile
)

@Composable
fun KatiParyoBottomBar(
    currentRoute: String,
    currentLanguage: String,
    onNavigate: (String) -> Unit
) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 8.dp
    ) {
        bottomNavItems.forEach { screen ->
            val isSelected = currentRoute == screen.route
            NavigationBarItem(
                selected = isSelected,
                onClick = { onNavigate(screen.route) },
                icon = {
                    Icon(
                        imageVector = screen.icon,
                        contentDescription = if (currentLanguage == "ne") screen.titleNe else screen.titleEn,
                        tint = if (isSelected) CrimsonRed else SlateTextMuted
                    )
                },
                label = {
                    Text(
                        text = if (currentLanguage == "ne") screen.titleNe else screen.titleEn,
                        color = if (isSelected) CrimsonRed else SlateTextMuted
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = Color(0xFFFEE2E2)
                )
            )
        }
    }
}
