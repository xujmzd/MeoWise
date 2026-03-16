import 'package:flutter/material.dart';
import 'package:getwidget/getwidget.dart';

import '../api/api_client.dart';
import '../ui/meowise_theme.dart';

class ProfilePage extends StatefulWidget {
  static const routeName = '/profile';

  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  bool _loadingUser = true;
  Map<String, dynamic>? _user;

  final _nicknameController = TextEditingController();
  final _avatarController = TextEditingController();

  final _oldPwdController = TextEditingController();
  final _newPwdController = TextEditingController();
  final _confirmNewPwdController = TextEditingController();
  bool _updatingProfile = false;
  bool _changingPassword = false;

  List<Map<String, dynamic>> _cats = [];
  bool _loadingCats = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final client = await ApiClient.create();
      final user = await client.getCurrentUser();
      final cats = await client.getCats();
      setState(() {
        _user = user;
        _loadingUser = false;
        _cats = cats;
        _loadingCats = false;
        _nicknameController.text = user['nickname'] ?? '';
        _avatarController.text = user['avatar_url'] ?? '';
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('加载个人资料失败：$e')),
      );
      setState(() {
        _loadingUser = false;
        _loadingCats = false;
      });
    }
  }

  Future<void> _updateProfile() async {
    setState(() {
      _updatingProfile = true;
    });
    try {
      final client = await ApiClient.create();
      final updated = await client.updateCurrentUser(
        nickname: _nicknameController.text.trim().isEmpty
            ? null
            : _nicknameController.text.trim(),
        avatarUrl: _avatarController.text.trim().isEmpty
            ? null
            : _avatarController.text.trim(),
      );
      setState(() {
        _user = updated;
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('资料已更新')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('更新失败：$e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _updatingProfile = false;
        });
      }
    }
  }

  Future<void> _changePassword() async {
    final newPwd = _newPwdController.text;
    if (newPwd.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('新密码长度至少 6 位')),
      );
      return;
    }
    if (newPwd != _confirmNewPwdController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('两次输入的新密码不一致')),
      );
      return;
    }

    setState(() {
      _changingPassword = true;
    });
    try {
      final client = await ApiClient.create();
      await client.changePassword(
        oldPassword: _oldPwdController.text,
        newPassword: newPwd,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('密码已更新')),
      );
      _oldPwdController.clear();
      _newPwdController.clear();
      _confirmNewPwdController.clear();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('修改密码失败：$e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _changingPassword = false;
        });
      }
    }
  }

  Future<void> _addOrEditCat({Map<String, dynamic>? cat}) async {
    final nameController = TextEditingController(text: cat?['name'] ?? '');
    final weightController = TextEditingController(
      text: cat?['standard_weight_kg']?.toString() ?? '',
    );

    await showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: MeowiseColors.creamWhite,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
          title: Text(cat == null ? '新增小猫' : '编辑小猫'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: '名称'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: weightController,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: '体重 (kg)'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('取消'),
            ),
            TextButton(
              onPressed: () async {
                final name = nameController.text.trim();
                final weight = double.tryParse(weightController.text.trim());
                if (name.isEmpty || weight == null || weight <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('请输入正确的名称和体重')),
                  );
                  return;
                }
                try {
                  final client = await ApiClient.create();
                  if (cat == null) {
                    await client.createCat(
                      name: name,
                      standardWeightKg: weight,
                    );
                  } else {
                    await client.updateCat(
                      catId: cat['id'] as int,
                      name: name,
                      standardWeightKg: weight,
                    );
                  }
                  await _loadData();
                  if (mounted) Navigator.of(context).pop();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('保存失败：$e')),
                  );
                }
              },
              child: const Text('保存'),
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteCat(int catId) async {
    try {
      final client = await ApiClient.create();
      await client.deleteCat(catId: catId);
      await _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('删除失败：$e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('个人中心'),
      ),
      body: _loadingUser
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildProfileCard(),
                  const SizedBox(height: 16),
                  _buildPasswordCard(),
                  const SizedBox(height: 16),
                  _buildCatsCard(),
                ],
              ),
            ),
    );
  }

  Widget _buildProfileCard() {
    final email = _user?['email'] as String? ?? '';
    final nickname = _user?['nickname'] as String? ?? '';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MeowiseColors.creamWhite,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: MeowiseColors.softShadow,
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: MeowiseColors.mistBlue,
                child: Text(
                  (nickname.isNotEmpty ? nickname[0] : email[0]).toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nickname.isNotEmpty ? nickname : '未设置昵称',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: MeowiseColors.charcoalBrown,
                      ),
                    ),
                    Text(
                      email,
                      style: const TextStyle(
                        color: MeowiseColors.charcoalBrown,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nicknameController,
            decoration: const InputDecoration(labelText: '昵称'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _avatarController,
            decoration: const InputDecoration(labelText: '头像 URL（可选）'),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: GFButton(
              onPressed: _updatingProfile ? null : _updateProfile,
              color: MeowiseColors.mistBlue,
              textColor: Colors.white,
              shape: GFButtonShape.pills,
              text: _updatingProfile ? '保存中...' : '保存资料',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPasswordCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MeowiseColors.creamWhite,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: MeowiseColors.softShadow,
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '修改密码',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: MeowiseColors.charcoalBrown,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _oldPwdController,
            obscureText: true,
            decoration: const InputDecoration(labelText: '当前密码'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _newPwdController,
            obscureText: true,
            decoration: const InputDecoration(labelText: '新密码'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _confirmNewPwdController,
            obscureText: true,
            decoration: const InputDecoration(labelText: '确认新密码'),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: GFButton(
              onPressed: _changingPassword ? null : _changePassword,
              color: MeowiseColors.beanGreen,
              textColor: Colors.white,
              shape: GFButtonShape.pills,
              text: _changingPassword ? '提交中...' : '更新密码',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCatsCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: MeowiseColors.creamWhite,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: MeowiseColors.softShadow,
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '我的猫咪',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: MeowiseColors.charcoalBrown,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add, color: MeowiseColors.charcoalBrown),
                onPressed: () => _addOrEditCat(),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_loadingCats)
            const Center(child: CircularProgressIndicator())
          else if (_cats.isEmpty)
            const Text(
              '还没有录入猫咪，点击右上角 + 新增一只吧～',
              style: TextStyle(color: MeowiseColors.charcoalBrown),
            )
          else
            Column(
              children: _cats
                  .map(
                    (c) => ListTile(
                      contentPadding: const EdgeInsets.symmetric(vertical: 4),
                      leading: const Icon(Icons.pets,
                          color: MeowiseColors.charcoalBrown),
                      title: Text(
                        c['name'] as String? ?? '',
                        style: const TextStyle(
                          color: MeowiseColors.charcoalBrown,
                        ),
                      ),
                      subtitle: Text(
                        '标准体重：${c['standard_weight_kg']} kg',
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit,
                                color: MeowiseColors.mistBlue),
                            onPressed: () => _addOrEditCat(cat: c),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline,
                                color: Colors.redAccent),
                            onPressed: () => _deleteCat(c['id'] as int),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
        ],
      ),
    );
  }
}

