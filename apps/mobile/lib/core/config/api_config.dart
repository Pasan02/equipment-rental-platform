class ApiConfig {
  // Use 10.0.2.2 for Android Emulator, localhost for iOS/Web/Desktop
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );

  static const String fallbackBaseUrl = 'http://localhost:3000/api/v1';

  static const Duration connectionTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);

  // Headers
  static const String authHeader = 'Authorization';
  static const String bearerPrefix = 'Bearer ';

  // Storage Keys
  static const String keyAccessToken = 'access_token';
  static const String keyRefreshToken = 'refresh_token';
  static const String keyUserRole = 'user_role';
  static const String keyUserData = 'user_data';
}
