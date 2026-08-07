import 'package:equatable/equatable.dart';

abstract class NotificationEvent extends Equatable {
  const NotificationEvent();

  @override
  List<Object?> get props => [];
}

class NotificationsFetchRequested extends NotificationEvent {}

class NotificationMarkReadRequested extends NotificationEvent {
  final String notificationId;

  const NotificationMarkReadRequested(this.notificationId);

  @override
  List<Object?> get props => [notificationId];
}

class NotificationsMarkAllReadRequested extends NotificationEvent {}
