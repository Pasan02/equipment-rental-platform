import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../storage/token_storage.dart';

class DioClient {
  late final Dio dio;
  final TokenStorage tokenStorage;
  Function()? onUnauthenticated;

  DioClient({required this.tokenStorage, this.onUnauthenticated}) {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectionTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokenStorage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers[ApiConfig.authHeader] =
                '${ApiConfig.bearerPrefix}$token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401 &&
              !error.requestOptions.path.contains('/auth/login') &&
              !error.requestOptions.path.contains('/auth/refresh')) {
            // Attempt token refresh
            final refreshed = await _refreshToken();
            if (refreshed) {
              try {
                final newAccessToken = await tokenStorage.getAccessToken();
                final retryOptions = error.requestOptions;
                retryOptions.headers[ApiConfig.authHeader] =
                    '${ApiConfig.bearerPrefix}$newAccessToken';
                final response = await dio.fetch(retryOptions);
                return handler.resolve(response);
              } catch (e) {
                return handler.next(error);
              }
            } else {
              await tokenStorage.clearAll();
              onUnauthenticated?.call();
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) return false;

      final refreshDio = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));
      final response = await refreshDio.post('/auth/refresh', data: {
        'refreshToken': refreshToken,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data['data'];
        final newAccessToken = data['accessToken'] ?? data['access_token'];
        final newRefreshToken = data['refreshToken'] ?? data['refresh_token'];

        if (newAccessToken != null) {
          await tokenStorage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken ?? refreshToken,
          );
          return true;
        }
      }
    } catch (_) {
      // Refresh failed
    }
    return false;
  }
}
