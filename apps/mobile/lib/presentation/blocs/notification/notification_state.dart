import 'package:equatable/equatable.dart';
import '../../../domain/entities/notification_entity.dart';

abstract class NotificationState extends Equatable {
  const NotificationState();

  @override
  List<Object?> get props => [];
}

class NotificationInitial extends NotificationState {}

class NotificationLoading extends NotificationState {}

class NotificationLoaded extends NotificationState {
  final List<NotificationEntity> notifications;
  final int unreadCount;

  const NotificationLoaded({
    required this.notifications,
    required this.unreadCount,
  });

  @override
  List<Object?> get props => [notifications, unreadCount];
}

class NotificationFailure extends NotificationState {
  final String message;

  const NotificationFailure({required this.message});

  @override
  List<Object?> get props => [message];
}
