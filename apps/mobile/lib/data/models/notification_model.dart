import '../../domain/entities/notification_entity.dart';

class NotificationModel extends NotificationEntity {
  const NotificationModel({
    required super.id,
    required super.userId,
    required super.title,
    required super.message,
    required super.type,
    required super.isRead,
    super.readAt,
    required super.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? json['user_id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'RESERVATION_APPROVED',
      isRead: json['isRead'] ?? json['is_read'] ?? false,
      readAt: json['readAt'] ?? json['read_at'],
      createdAt: json['createdAt'] ?? json['created_at'] ?? '',
    );
  }
}
