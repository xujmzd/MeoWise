import 'package:flutter/material.dart';
import 'package:getwidget/getwidget.dart';

import 'device_detail_page.dart';
import 'profile_page.dart';
import '../ui/meowise_theme.dart';

class HomePage extends StatelessWidget {
  static const routeName = '/home';

  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: 从后端加载用户绑定的设备列表 & 猫咪信息
    final devices = [
      const _DeviceCardData(
        id: 1,
        name: '客厅喂食器',
        bowlWeight: 35,
        siloRemaining: 80,
        signal: 75,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('我的设备'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline,
                color: MeowiseColors.charcoalBrown),
            onPressed: () {
              Navigator.of(context).pushNamed(ProfilePage.routeName);
            },
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: devices.length,
        padding: const EdgeInsets.only(top: 8, bottom: 80),
        itemBuilder: (context, index) {
          final d = devices[index];
          return GFCard(
            color: MeowiseColors.skinGrayPink,
            elevation: 4,
            borderRadius: BorderRadius.circular(24),
            title: GFListTile(
              titleText: d.name,
              subTitleText:
                  '食盆：${d.bowlWeight} g | 余量：${d.siloRemaining}% | 信号：${d.signal}%',
              icon: const Icon(
                Icons.pets,
                color: MeowiseColors.charcoalBrown,
              ),
            ),
            content: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                GFButton(
                  text: '详情',
                  color: MeowiseColors.mistBlue,
                  textColor: Colors.white,
                  shape: GFButtonShape.pills,
                  onPressed: () {
                    Navigator.of(context).pushNamed(
                      DeviceDetailPage.routeName,
                      arguments: d.id,
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // TODO: 调起蓝牙辅助配网流程（调用原生插件 / SDK）
        },
        icon: const Icon(Icons.bluetooth),
        label: const Text('添加设备'),
      ),
    );
  }
}

class _DeviceCardData {
  final int id;
  final String name;
  final double bowlWeight;
  final double siloRemaining;
  final int signal;

  const _DeviceCardData({
    required this.id,
    required this.name,
    required this.bowlWeight,
    required this.siloRemaining,
    required this.signal,
  });
}

