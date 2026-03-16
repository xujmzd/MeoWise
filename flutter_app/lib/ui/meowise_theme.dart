import 'package:flutter/material.dart';

/// MeoWise 莫兰迪色系主题配置
class MeowiseColors {
  // 核心色板
  static const Color skinGrayPink = Color(0xFFE2CFC4); // 肤灰粉 - 背景/主卡片
  static const Color mistBlue = Color(0xFF9FB1BC); // 雾霾蓝 - 数据展示
  static const Color beanGreen = Color(0xFFA9AF90); // 豆沙绿 - 成功/健康
  static const Color charcoalBrown = Color(0xFF6B5B52); // 炭灰棕 - 文字/图标

  // 扩展色
  static const Color creamWhite = Color(0xFFFAF6F0); // 奶油白 - 页面背景
  static const Color softShadow = Color(0x14000000); // 轻柔阴影
}

ThemeData buildMeowiseTheme() {
  final base = ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
  );

  return base.copyWith(
    scaffoldBackgroundColor: MeowiseColors.creamWhite,
    primaryColor: MeowiseColors.mistBlue,
    colorScheme: base.colorScheme.copyWith(
      primary: MeowiseColors.mistBlue,
      secondary: MeowiseColors.beanGreen,
      surface: MeowiseColors.skinGrayPink,
      onSurface: MeowiseColors.charcoalBrown,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: MeowiseColors.creamWhite,
      elevation: 0,
      centerTitle: true,
      foregroundColor: MeowiseColors.charcoalBrown,
    ),
    textTheme: base.textTheme.apply(
      bodyColor: MeowiseColors.charcoalBrown,
      displayColor: MeowiseColors.charcoalBrown,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: MeowiseColors.mistBlue,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      ),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: MeowiseColors.beanGreen,
      foregroundColor: Colors.white,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withOpacity(0.8),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(20),
        borderSide: BorderSide.none,
      ),
      hintStyle: const TextStyle(
        color: MeowiseColors.charcoalBrown,
      ),
      labelStyle: const TextStyle(
        color: MeowiseColors.charcoalBrown,
      ),
    ),
  );
}

