import 'package:flutter/material.dart';
import 'package:getwidget/getwidget.dart';

import 'screens/login_page.dart';
import 'screens/register_page.dart';
import 'screens/home_page.dart';
import 'screens/device_detail_page.dart';
import 'screens/feeding_report_page.dart';
import 'screens/profile_page.dart';
import 'ui/meowise_theme.dart';

void main() {
  runApp(const MeoWiseApp());
}

class MeoWiseApp extends StatelessWidget {
  const MeoWiseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MeoWise',
      debugShowCheckedModeBanner: false,
      theme: buildMeowiseTheme(),
      initialRoute: LoginPage.routeName,
      routes: {
        LoginPage.routeName: (_) => const LoginPage(),
        RegisterPage.routeName: (_) => const RegisterPage(),
        HomePage.routeName: (_) => const HomePage(),
        DeviceDetailPage.routeName: (_) => const DeviceDetailPage(),
        FeedingReportPage.routeName: (_) => const FeedingReportPage(),
        ProfilePage.routeName: (_) => const ProfilePage(),
      },
    );
  }
}

