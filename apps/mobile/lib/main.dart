import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/network/dio_client.dart';
import 'core/router/app_router.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'data/datasources/equipment_remote_datasource.dart';
import 'data/datasources/notification_remote_datasource.dart';
import 'data/datasources/reservation_remote_datasource.dart';
import 'presentation/blocs/auth/auth_bloc.dart';
import 'presentation/blocs/auth/auth_event.dart';
import 'presentation/blocs/equipment/equipment_bloc.dart';
import 'presentation/blocs/notification/notification_bloc.dart';
import 'presentation/blocs/reservation/reservation_bloc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();
  final tokenStorage = TokenStorage(prefs: prefs);
  final dioClient = DioClient(tokenStorage: tokenStorage);

  final equipmentDatasource = EquipmentRemoteDatasource(dioClient: dioClient);
  final reservationDatasource = ReservationRemoteDatasource(dioClient: dioClient);
  final notificationDatasource = NotificationRemoteDatasource(dioClient: dioClient);

  final authBloc = AuthBloc(
    dioClient: dioClient,
    tokenStorage: tokenStorage,
  )..add(AuthCheckRequested());

  final equipmentBloc = EquipmentBloc(datasource: equipmentDatasource);
  final reservationBloc = ReservationBloc(datasource: reservationDatasource);
  final notificationBloc = NotificationBloc(datasource: notificationDatasource);

  final appRouter = AppRouter(authBloc: authBloc);

  runApp(
    EquipmentRentalApp(
      authBloc: authBloc,
      equipmentBloc: equipmentBloc,
      reservationBloc: reservationBloc,
      notificationBloc: notificationBloc,
      equipmentDatasource: equipmentDatasource,
      reservationDatasource: reservationDatasource,
      notificationDatasource: notificationDatasource,
      appRouter: appRouter,
    ),
  );
}

class EquipmentRentalApp extends StatelessWidget {
  final AuthBloc authBloc;
  final EquipmentBloc equipmentBloc;
  final ReservationBloc reservationBloc;
  final NotificationBloc notificationBloc;
  final EquipmentRemoteDatasource equipmentDatasource;
  final ReservationRemoteDatasource reservationDatasource;
  final NotificationRemoteDatasource notificationDatasource;
  final AppRouter appRouter;

  const EquipmentRentalApp({
    super.key,
    required this.authBloc,
    required this.equipmentBloc,
    required this.reservationBloc,
    required this.notificationBloc,
    required this.equipmentDatasource,
    required this.reservationDatasource,
    required this.notificationDatasource,
    required this.appRouter,
  });

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider.value(value: equipmentDatasource),
        RepositoryProvider.value(value: reservationDatasource),
        RepositoryProvider.value(value: notificationDatasource),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider.value(value: authBloc),
          BlocProvider.value(value: equipmentBloc),
          BlocProvider.value(value: reservationBloc),
          BlocProvider.value(value: notificationBloc),
        ],
        child: MaterialApp.router(
          title: 'Equipment Rental Platform',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeMode.system,
          routerConfig: appRouter.router,
        ),
      ),
    );
  }
}
