import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/datasources/notification_remote_datasource.dart';
import 'notification_event.dart';
import 'notification_state.dart';

class NotificationBloc extends Bloc<NotificationEvent, NotificationState> {
  final NotificationRemoteDatasource datasource;

  NotificationBloc({required this.datasource}) : super(NotificationInitial()) {
    on<NotificationsFetchRequested>(_onNotificationsFetchRequested);
    on<NotificationMarkReadRequested>(_onNotificationMarkReadRequested);
    on<NotificationsMarkAllReadRequested>(_onNotificationsMarkAllReadRequested);
  }

  Future<void> _onNotificationsFetchRequested(
    NotificationsFetchRequested event,
    Emitter<NotificationState> emit,
  ) async {
    emit(NotificationLoading());
    try {
      final items = await datasource.getNotifications();
      final unreadCount = await datasource.getUnreadCount();
      emit(NotificationLoaded(notifications: items, unreadCount: unreadCount));
    } catch (e) {
      emit(NotificationFailure(message: 'Failed to fetch notifications: $e'));
    }
  }

  Future<void> _onNotificationMarkReadRequested(
    NotificationMarkReadRequested event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      await datasource.markAsRead(event.notificationId);
      add(NotificationsFetchRequested());
    } catch (_) {}
  }

  Future<void> _onNotificationsMarkAllReadRequested(
    NotificationsMarkAllReadRequested event,
    Emitter<NotificationState> emit,
  ) async {
    try {
      await datasource.markAllAsRead();
      add(NotificationsFetchRequested());
    } catch (_) {}
  }
}
