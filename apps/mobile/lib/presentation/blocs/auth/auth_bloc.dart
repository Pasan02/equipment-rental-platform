import 'dart:convert';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../../data/models/user_model.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final DioClient dioClient;
  final TokenStorage tokenStorage;

  AuthBloc({required this.dioClient, required this.tokenStorage})
      : super(AuthInitial()) {
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<AuthLoginRequested>(_onAuthLoginRequested);
    on<AuthLogoutRequested>(_onAuthLogoutRequested);

    dioClient.onUnauthenticated = () {
      add(AuthLogoutRequested());
    };
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final token = await tokenStorage.getAccessToken();
      final userDataJson = tokenStorage.getUserData();

      if (token != null && token.isNotEmpty && userDataJson != null) {
        final userMap = jsonDecode(userDataJson);
        final user = UserModel.fromJson(userMap);
        emit(Authenticated(user: user, accessToken: token));
      } else {
        emit(Unauthenticated());
      }
    } catch (_) {
      emit(Unauthenticated());
    }
  }

  Future<void> _onAuthLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final response = await dioClient.dio.post('/auth/login', data: {
        'email': event.email,
        'password': event.password,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final resData = response.data['data'] ?? response.data;
        final accessToken = resData['accessToken'] ?? resData['access_token'];
        final refreshToken = resData['refreshToken'] ?? resData['refresh_token'];
        final userMap = resData['user'];

        if (accessToken != null && userMap != null) {
          final user = UserModel.fromJson(userMap);

          await tokenStorage.saveTokens(
            accessToken: accessToken,
            refreshToken: refreshToken ?? '',
          );
          await tokenStorage.saveUserMeta(
            role: user.role,
            userJson: jsonEncode(user.toJson()),
          );

          emit(Authenticated(user: user, accessToken: accessToken));
          return;
        }
      }
      emit(const AuthFailure(message: 'Invalid response format from server'));
    } on DioException catch (e) {
      final msg = e.response?.data?['error']?['message'] ??
          e.response?.data?['message'] ??
          'Login failed. Please check your credentials.';
      emit(AuthFailure(message: msg.toString()));
    } catch (e) {
      emit(AuthFailure(message: 'Unexpected error: $e'));
    }
  }

  Future<void> _onAuthLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    try {
      await dioClient.dio.post('/auth/logout');
    } catch (_) {}
    await tokenStorage.clearAll();
    emit(Unauthenticated());
  }
}
