import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TokenStorage {
  final FlutterSecureStorage _secureStorage;
  final SharedPreferences _prefs;

  static const String _keyAccessToken = 'access_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserRole = 'user_role';
  static const String _keyUserData = 'user_data';

  TokenStorage({
    FlutterSecureStorage? secureStorage,
    required SharedPreferences prefs,
  })  : _secureStorage = secureStorage ?? const FlutterSecureStorage(),
        _prefs = prefs;

  // Save tokens
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _secureStorage.write(key: _keyAccessToken, value: accessToken);
    await _secureStorage.write(key: _keyRefreshToken, value: refreshToken);
  }

  // Get Access Token
  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: _keyAccessToken);
  }

  // Get Refresh Token
  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: _keyRefreshToken);
  }

  // Save User Meta
  Future<void> saveUserMeta({required String role, required String userJson}) async {
    await _prefs.setString(_keyUserRole, role);
    await _prefs.setString(_keyUserData, userJson);
  }

  String? getUserRole() {
    return _prefs.getString(_keyUserRole);
  }

  String? getUserData() {
    return _prefs.getString(_keyUserData);
  }

  // Clear all session storage
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    await _prefs.remove(_keyUserRole);
    await _prefs.remove(_keyUserData);
  }
}
