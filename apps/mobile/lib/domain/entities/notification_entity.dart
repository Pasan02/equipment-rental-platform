import 'package:equatable/equatable.dart';

class NotificationEntity extends Equatable {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type; // RESERVATION_APPROVED | RESERVATION_REJECTED | UPCOMING_RETURN | RESERVATION_EXPIRED
  final bool isRead;
  final String? readAt;
  final String createdAt;

  const NotificationEntity({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        message,
        type,
        isRead,
        readAt,
        createdAt,
      ];
}
