import '../../core/network/dio_client.dart';
import '../models/notification_model.dart';

class NotificationRemoteDatasource {
  final DioClient dioClient;

  NotificationRemoteDatasource({required this.dioClient});

  Future<List<NotificationModel>> getNotifications() async {
    final response = await dioClient.dio.get('/notifications');
    final data = response.data['data'] ?? response.data;
    if (data is List) {
      return data.map((j) => NotificationModel.fromJson(j)).toList();
    }
    return [];
  }

  Future<int> getUnreadCount() async {
    final response = await dioClient.dio.get('/notifications/unread-count');
    final data = response.data['data'] ?? response.data;
    if (data is Map && data.containsKey('unreadCount')) {
      return data['unreadCount'] ?? 0;
    }
    if (data is num) return data.toInt();
    return 0;
  }

  Future<void> markAsRead(String id) async {
    await dioClient.dio.patch('/notifications/$id/read');
  }

  Future<void> markAllAsRead() async {
    await dioClient.dio.patch('/notifications/read-all');
  }
}
