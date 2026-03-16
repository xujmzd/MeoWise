import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 后端基础配置
class ApiConfig {
  /// 本地开发时：
  /// - Android 模拟器：10.0.2.2
  /// - iOS 模拟器 / Web / 桌面：127.0.0.1
  //static const String baseUrl = 'http://10.0.2.2:8000/api/v1';
   static const String baseUrl = 'http://127.0.0.1:8080/api/v1';
}

/// 统一管理 token 的 key
class _StorageKeys {
  static const String accessToken = 'access_token';
}

/// 通用 ApiClient
class ApiClient {
  final Dio _dio;

  ApiClient._internal(this._dio);

  static Future<ApiClient> create() async {
    final dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_StorageKeys.accessToken);

    if (token != null && token.isNotEmpty) {
      dio.options.headers['Authorization'] = 'Bearer $token';
    }

    // 拦截器：对 401 等做一些统一处理（可按需扩展）
    dio.interceptors.add(
      InterceptorsWrapper(
        onError: (e, handler) {
          // TODO: 例如遇到 401 时跳转到登录页
          return handler.next(e);
        },
      ),
    );

    return ApiClient._internal(dio);
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_StorageKeys.accessToken, token);
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_StorageKeys.accessToken);
    _dio.options.headers.remove('Authorization');
  }

  // ===== 认证相关 =====

  /// 注册
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
  }) async {
    final resp = await _dio.post(
      '/auth/register',
      data: {
        'email': email,
        'password': password,
      },
    );
    return resp.data as Map<String, dynamic>;
  }

  /// 登录（获取 JWT）
  Future<String> login({
    required String email,
    required String password,
  }) async {
    final resp = await _dio.post(
      '/auth/token',
      options: Options(
        // FastAPI OAuth2PasswordRequestForm 使用 form-data
        contentType: Headers.formUrlEncodedContentType,
      ),
      data: {
        'username': email,
        'password': password,
      },
    );
    final data = resp.data as Map<String, dynamic>;
    final token = data['access_token'] as String;
    await _saveToken(token);
    return token;
  }

  // ===== 用户资料相关 =====

  /// 获取当前用户资料 /users/me
  Future<Map<String, dynamic>> getCurrentUser() async {
    final resp = await _dio.get('/users/me');
    return resp.data as Map<String, dynamic>;
  }

  /// 更新当前用户资料（昵称、头像等）
  Future<Map<String, dynamic>> updateCurrentUser({
    String? nickname,
    String? avatarUrl,
  }) async {
    final Map<String, dynamic> body = {};
    if (nickname != null) body['nickname'] = nickname;
    if (avatarUrl != null) body['avatar_url'] = avatarUrl;

    final resp = await _dio.patch('/users/me', data: body);
    return resp.data as Map<String, dynamic>;
  }

  /// 修改密码
  Future<void> changePassword({
    required String oldPassword,
    required String newPassword,
  }) async {
    await _dio.post(
      '/users/me/change_password',
      data: {
        'old_password': oldPassword,
        'new_password': newPassword,
      },
    );
  }

  // ===== 设备相关 =====

  /// 获取当前用户的设备列表
  Future<List<Map<String, dynamic>>> getDevices() async {
    final resp = await _dio.get('/devices/');
    final list = resp.data as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  /// 绑定设备（蓝牙配网后，把 device_sn 和 name 传上来）
  Future<Map<String, dynamic>> bindDevice({
    required String deviceSn,
    required String name,
  }) async {
    final resp = await _dio.post(
      '/devices/',
      data: {
        'device_sn': deviceSn,
        'name': name,
      },
    );
    return resp.data as Map<String, dynamic>;
  }

  /// 手动放粮（amountG 单位：克）
  Future<void> manualFeed({
    required int deviceId,
    required double amountG,
  }) async {
    await _dio.post(
      '/devices/$deviceId/manual_feed',
      queryParameters: {
        'amount_g': amountG,
      },
    );
  }

  // ===== 定时计划 =====

  /// 获取某设备的定时喂食计划列表
  Future<List<Map<String, dynamic>>> getFeedingPlans({
    required int deviceId,
  }) async {
    final resp = await _dio.get('/feedings/devices/$deviceId/plans');
    final list = resp.data as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  /// 创建定时计划
  Future<Map<String, dynamic>> createFeedingPlan({
    required int deviceId,
    required String name,
    required String timeOfDay, // "HH:MM:SS"
    String daysOfWeek = '0,1,2,3,4,5,6',
    required double amountG,
    bool isEnabled = true,
  }) async {
    final data = {
      'name': name,
      'time_of_day': timeOfDay,
      'days_of_week': daysOfWeek,
      'amount_g': amountG,
      'is_enabled': isEnabled,
    };
    final resp = await _dio.post(
      '/feedings/devices/$deviceId/plans',
      data: data,
    );
    return resp.data as Map<String, dynamic>;
  }

  /// 更新定时计划（只传需要改的字段）
  Future<Map<String, dynamic>> updateFeedingPlan({
    required int planId,
    String? name,
    String? timeOfDay,
    String? daysOfWeek,
    double? amountG,
    bool? isEnabled,
  }) async {
    final Map<String, dynamic> patch = {};
    if (name != null) patch['name'] = name;
    if (timeOfDay != null) patch['time_of_day'] = timeOfDay;
    if (daysOfWeek != null) patch['days_of_week'] = daysOfWeek;
    if (amountG != null) patch['amount_g'] = amountG;
    if (isEnabled != null) patch['is_enabled'] = isEnabled;

    final resp = await _dio.patch(
      '/feedings/plans/$planId',
      data: patch,
    );
    return resp.data as Map<String, dynamic>;
  }

  /// 删除定时计划
  Future<void> deleteFeedingPlan({required int planId}) async {
    await _dio.delete('/feedings/plans/$planId');
  }

  // ===== 进食报告 & 会话 =====

  /// 获取某设备的进食会话列表
  Future<List<Map<String, dynamic>>> getFeedingSessions({
    required int deviceId,
  }) async {
    final resp = await _dio.get('/stats/devices/$deviceId/sessions');
    final list = resp.data as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  /// 获取进食报告（period = "daily" 或 "weekly"）
  Future<Map<String, dynamic>> getFeedingReport({
    required int deviceId,
    required String period, // "daily" | "weekly"
  }) async {
    final resp = await _dio.get('/stats/devices/$deviceId/report/$period');
    return resp.data as Map<String, dynamic>;
  }

  // ===== 猫咪管理 =====

  /// 获取当前用户的猫咪列表
  Future<List<Map<String, dynamic>>> getCats() async {
    final resp = await _dio.get('/cats/');
    final list = resp.data as List<dynamic>;
    return list.cast<Map<String, dynamic>>();
  }

  /// 新增猫咪
  Future<Map<String, dynamic>> createCat({
    required String name,
    required double standardWeightKg,
  }) async {
    final resp = await _dio.post(
      '/cats/',
      data: {
        'name': name,
        'standard_weight_kg': standardWeightKg,
      },
    );
    return resp.data as Map<String, dynamic>;
  }

  /// 更新猫咪
  Future<Map<String, dynamic>> updateCat({
    required int catId,
    required String name,
    required double standardWeightKg,
  }) async {
    final resp = await _dio.patch(
      '/cats/$catId',
      data: {
        'name': name,
        'standard_weight_kg': standardWeightKg,
      },
    );
    return resp.data as Map<String, dynamic>;
  }

  /// 删除猫咪
  Future<void> deleteCat({required int catId}) async {
    await _dio.delete('/cats/$catId');
  }
}