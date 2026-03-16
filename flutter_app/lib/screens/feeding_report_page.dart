import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';

import '../api/api_client.dart';
import '../ui/meowise_theme.dart';

class FeedingReportPage extends StatefulWidget {
  static const routeName = '/feeding_report';

  const FeedingReportPage({super.key});

  @override
  State<FeedingReportPage> createState() => _FeedingReportPageState();
}

class _FeedingReportPageState extends State<FeedingReportPage> {
  late final int _deviceId;
  bool _loadingDaily = true;
  bool _loadingWeekly = true;
  Map<String, dynamic>? _daily;
  Map<String, dynamic>? _weekly;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _deviceId =
        ModalRoute.of(context)?.settings.arguments as int? ?? 0;
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    final client = await ApiClient.create();
    try {
      final daily = await client.getFeedingReport(
        deviceId: _deviceId,
        period: 'daily',
      );
      final weekly = await client.getFeedingReport(
        deviceId: _deviceId,
        period: 'weekly',
      );
      setState(() {
        _daily = daily;
        _weekly = weekly;
        _loadingDaily = false;
        _loadingWeekly = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingDaily = false;
        _loadingWeekly = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('加载进食报告失败：$e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('进食报告'),
          bottom: const TabBar(
            indicatorColor: MeowiseColors.mistBlue,
            labelColor: MeowiseColors.charcoalBrown,
            tabs: [
              Tab(text: '日'),
              Tab(text: '周'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildReportContent(
              context: context,
              deviceId: _deviceId,
              period: 'daily',
              report: _daily,
              isLoading: _loadingDaily,
            ),
            _buildReportContent(
              context: context,
              deviceId: _deviceId,
              period: 'weekly',
              report: _weekly,
              isLoading: _loadingWeekly,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReportContent({
    required BuildContext context,
    required int deviceId,
    required String period,
    required Map<String, dynamic>? report,
    required bool isLoading,
  }) {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final stats = report?['stats'] as Map<String, dynamic>?;
    final sessions = (report?['sessions'] as List<dynamic>? ?? [])
        .cast<Map<String, dynamic>>();

    final totalSessions = stats?['total_sessions'] ?? 0;
    final totalDispensed = (stats?['total_dispensed_g'] ?? 0).toDouble();
    final avgDuration =
        (stats?['avg_session_duration_sec'] ?? 0).toDouble();

    final spots = <FlSpot>[];
    for (var i = 0; i < sessions.length; i++) {
      final s = sessions[i];
      final amount = (s['dispensed_g'] ?? 0).toDouble();
      spots.add(FlSpot(i.toDouble(), amount));
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '设备 ID: $deviceId',
            style: const TextStyle(color: MeowiseColors.charcoalBrown),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: MeowiseColors.creamWhite,
              borderRadius: BorderRadius.circular(24),
              boxShadow: const [
                BoxShadow(
                  color: MeowiseColors.softShadow,
                  blurRadius: 14,
                  offset: Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('进食次数: $totalSessions'),
                Text('总克数: ${totalDispensed.toStringAsFixed(1)} g'),
                Text(
                    '平均进食时长: ${avgDuration.toStringAsFixed(0)} s'),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            '进食克数折线图',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: spots.isEmpty
                ? const Center(
                    child: Text(
                      '暂无数据',
                      style: TextStyle(
                        color: MeowiseColors.charcoalBrown,
                      ),
                    ),
                  )
                : LineChart(
                    LineChartData(
                      gridData: const FlGridData(show: false),
                      borderData: FlBorderData(show: false),
                      titlesData: FlTitlesData(
                        leftTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: true),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 22,
                            getTitlesWidget: (value, meta) {
                              return Text(
                                value.toInt().toString(),
                                style: const TextStyle(fontSize: 10),
                              );
                            },
                          ),
                        ),
                        rightTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                        topTitles: const AxisTitles(
                          sideTitles: SideTitles(showTitles: false),
                        ),
                      ),
                      lineBarsData: [
                        LineChartBarData(
                          isCurved: true,
                          color: MeowiseColors.mistBlue,
                          barWidth: 3,
                          belowBarData: BarAreaData(
                            show: true,
                            color: MeowiseColors.mistBlue.withOpacity(0.25),
                          ),
                          dotData: const FlDotData(show: true),
                          spots: spots,
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

