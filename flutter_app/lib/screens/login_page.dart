import 'package:flutter/material.dart';
import 'package:getwidget/getwidget.dart';

import '../api/api_client.dart';
import '../screens/home_page.dart';
import 'register_page.dart';
import '../ui/meowise_theme.dart';

class LoginPage extends StatefulWidget {
  static const routeName = '/login';

  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return '请输入邮箱';
    }
    final email = value.trim();
    final regex = RegExp(r'^[^@]+@[^@]+\.[^@]+');
    if (!regex.hasMatch(email)) {
      return '邮箱格式不正确';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return '请输入密码';
    }
    if (value.length < 6) {
      return '密码长度至少 6 位';
    }
    return null;
  }

  Future<void> _onLoginPressed() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final client = await ApiClient.create();
      await client.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed(HomePage.routeName);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('登录失败：$e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            decoration: BoxDecoration(
              color: MeowiseColors.skinGrayPink,
              borderRadius: BorderRadius.circular(32),
              boxShadow: const [
                BoxShadow(
                  color: MeowiseColors.softShadow,
                  blurRadius: 18,
                  offset: Offset(0, 8),
                ),
              ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'MeoWise',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: MeowiseColors.charcoalBrown,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '智能喂食 · 温柔守护',
                    style: TextStyle(
                      fontSize: 14,
                      color: MeowiseColors.charcoalBrown,
                    ),
                  ),
                  const SizedBox(height: 32),
                  TextFormField(
                    controller: _emailController,
                    validator: _validateEmail,
                    decoration: const InputDecoration(labelText: '邮箱'),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    validator: _validatePassword,
                    decoration: const InputDecoration(labelText: '密码'),
                  ),
                  const SizedBox(height: 24),
                  GFButton(
                    onPressed: _isLoading ? null : _onLoginPressed,
                    fullWidthButton: true,
                    color: MeowiseColors.mistBlue,
                    textColor: Colors.white,
                    shape: GFButtonShape.pills,
                    text: _isLoading ? '登录中...' : '登录',
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context)
                          .pushReplacementNamed(RegisterPage.routeName);
                    },
                    child: const Text(
                      '没有账号？去注册',
                      style: TextStyle(color: MeowiseColors.charcoalBrown),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

