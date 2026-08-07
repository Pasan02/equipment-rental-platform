import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../presentation/blocs/auth/auth_bloc.dart';
import '../../presentation/blocs/auth/auth_state.dart';
import '../../presentation/screens/auth/login_screen.dart';
import '../../presentation/screens/home/home_screen.dart';
import '../../presentation/screens/splash_screen.dart';

class AppRouter {
  final AuthBloc authBloc;

  AppRouter({required this.authBloc});

  late final GoRouter router = GoRouter(
    initialLocation: '/',
    refreshListenable: GoRouterRefreshStream(authBloc.stream),
    redirect: (BuildContext context, GoRouterState state) {
      final authState = authBloc.state;
      final isLoggingIn = state.matchedLocation == '/login';
      final isSplash = state.matchedLocation == '/';

      if (authState is AuthInitial || authState is AuthLoading) {
        return isSplash ? null : '/';
      }

      if (authState is Unauthenticated || authState is AuthFailure) {
        return isLoggingIn ? null : '/login';
      }

      if (authState is Authenticated) {
        if (isLoggingIn || isSplash) {
          return '/home';
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
    ],
  );
}

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    stream.listen((_) => notifyListeners());
  }
}
