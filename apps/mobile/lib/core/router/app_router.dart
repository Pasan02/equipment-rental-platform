import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../presentation/blocs/auth/auth_bloc.dart';
import '../../presentation/blocs/auth/auth_state.dart';
import '../../presentation/screens/auth/login_screen.dart';
import '../../presentation/screens/equipment/equipment_detail_screen.dart';
import '../../presentation/screens/equipment/equipment_list_screen.dart';
import '../../presentation/screens/home/home_screen.dart';
import '../../presentation/screens/notification/notifications_screen.dart';
import '../../presentation/screens/reservation/create_reservation_screen.dart';
import '../../presentation/screens/reservation/reservation_detail_screen.dart';
import '../../presentation/screens/reservation/reservations_list_screen.dart';
import '../../presentation/screens/splash_screen.dart';
import '../../presentation/screens/staff/qr_scanner_screen.dart';
import '../../presentation/screens/staff/staff_pending_screen.dart';
import '../../presentation/screens/staff/staff_reservation_detail_screen.dart';

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
      GoRoute(
        path: '/equipment',
        builder: (context, state) => const EquipmentListScreen(),
      ),
      GoRoute(
        path: '/equipment/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return EquipmentDetailScreen(equipmentId: id);
        },
      ),
      GoRoute(
        path: '/reservation/create',
        builder: (context, state) {
          final equipmentId = state.uri.queryParameters['equipmentId'] ?? '';
          return CreateReservationScreen(equipmentId: equipmentId);
        },
      ),
      GoRoute(
        path: '/reservations',
        builder: (context, state) => const ReservationsListScreen(),
      ),
      GoRoute(
        path: '/reservations/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return ReservationDetailScreen(reservationId: id);
        },
      ),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/staff/pending',
        builder: (context, state) => const StaffPendingScreen(),
      ),
      GoRoute(
        path: '/staff/reservation/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return StaffReservationDetailScreen(reservationId: id);
        },
      ),
      GoRoute(
        path: '/staff/scan',
        builder: (context, state) => const QrScannerScreen(),
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
