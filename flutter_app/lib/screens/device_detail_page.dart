import 'package:flutter/material.dart';
import 'package:getwidget/getwidget.dart';

import 'feeding_report_page.dart';
import '../ui/meowise_theme.dart';

class DeviceDetailPage extends StatelessWidget {
  static const routeName = '/device_detail';

  const DeviceDetailPage({super.key});

  @override
  Widget build(BuildContext context) {
    final int deviceId =
        ModalRoute.of(context)?.settings.arguments as int? ?? 0;

    // TODO: 根据 deviceId 从后端加载设备详情、定时计划、猫咪映射关系等

    return Scaffold(
      appBar: AppBar(
        title: const Text('设备详情'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 当前状态卡片（雾霾蓝 / 数据展示）
            Container(
              padding: const EdgeInsets.all(20),
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
                children: const [
                  Text(
                    '当前状态',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: MeowiseColors.charcoalBrown,
                    ),
                  ),
                  SizedBox(height: 12),
                  _StatusRow(label: '食盆', value: '35 g'),
                  _StatusRow(label: '余量', value: '80%'),
                  _StatusRow(label: '信号', value: '75%'),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              '手动放粮',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            // 滑动解锁按钮（防误触）- 这里使用原生 Slider 占位，后续可换成专门的组件
            Slider(
              min: 0.0,
              max: 100.0,
              value: 0.0,
              activeColor: MeowiseColors.mistBlue,
              inactiveColor: MeowiseColors.skinGrayPink,
              onChanged: (value) {
                // TODO: 仅示意，推荐使用专门的 slide-to-unlock 组件或自定义
              },
            ),
            const SizedBox(height: 8),
            GFButton(
              onPressed: () async {
                // TODO: 调用后端 /api/v1/devices/{id}/manual_feed，后端转发 MQTT 指令
              },
              text: '下发放粮指令',
              color: MeowiseColors.mistBlue,
              textColor: Colors.white,
              shape: GFButtonShape.pills,
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '定时喂食计划',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.add, color: MeowiseColors.charcoalBrown),
                  onPressed: () {
                    // TODO: 打开创建/编辑计划弹窗，调用 /api/v1/feedings/devices/{id}/plans
                  },
                ),
              ],
            ),
            Expanded(
              child: ListView(
                children: const [
                  ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.all(Radius.circular(20)),
                    ),
                    tileColor: MeowiseColors.skinGrayPink,
                    title: Text('早餐'),
                    subtitle: Text('每天 08:00 - 20 g'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: GFButton(
            fullWidthButton: true,
            onPressed: () {
              Navigator.of(context).pushNamed(
                FeedingReportPage.routeName,
                arguments: deviceId,
              );
            },
            color: MeowiseColors.beanGreen,
            textColor: Colors.white,
            shape: GFButtonShape.pills,
            text: '查看进食报告',
          ),
        ),
      ),
    );
  }
}

class _StatusRow extends StatelessWidget {
  final String label;
  final String value;

  const _StatusRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: MeowiseColors.charcoalBrown),
          ),
          Text(
            value,
            style: const TextStyle(
              color: MeowiseColors.mistBlue,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

