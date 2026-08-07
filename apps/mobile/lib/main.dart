import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/network/dio_client.dart';
import 'core/router/app_router.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'presentation/blocs/auth/auth_bloc.dart';
import 'presentation/blocs/auth/auth_event.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();
  final tokenStorage = TokenStorage(prefs: prefs);
  final dioClient = DioClient(tokenStorage: tokenStorage);

  final authBloc = AuthBloc(
    dioClient: dioClient,
    tokenStorage: tokenStorage,
  )..add(AuthCheckRequested());

  final appRouter = AppRouter(authBloc: authBloc);

  runApp(
    EquipmentRentalApp(
      authBloc: authBloc,
      appRouter: appRouter,
    ),
  );
}

class EquipmentRentalApp extends StatelessWidget {
  final AuthBloc authBloc;
  final AppRouter appRouter;

  const EquipmentRentalApp({
    super.key,
    required this.authBloc,
    required this.appRouter,
  });

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>.value(
      value: authBloc,
      child: MaterialApp.router(
        title: 'Equipment Rental Platform',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        routerConfig: appRouter.router,
      ),
    );
  }
}
