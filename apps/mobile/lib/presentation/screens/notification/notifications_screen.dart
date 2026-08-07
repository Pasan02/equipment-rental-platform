import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../domain/entities/notification_entity.dart';
import '../../blocs/notification/notification_bloc.dart';
import '../../blocs/notification/notification_event.dart';
import '../../blocs/notification/notification_state.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<NotificationBloc>().add(NotificationsFetchRequested());
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'RESERVATION_APPROVED':
        return Icons.check_circle_outline;
      case 'RESERVATION_REJECTED':
        return Icons.cancel_outlined;
      case 'UPCOMING_RETURN':
        return Icons.access_time;
      case 'RESERVATION_EXPIRED':
        return Icons.timer_off_outlined;
      default:
        return Icons.notifications_none;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'RESERVATION_APPROVED':
        return AppColors.success;
      case 'RESERVATION_REJECTED':
        return AppColors.error;
      case 'UPCOMING_RETURN':
        return AppColors.warning;
      case 'RESERVATION_EXPIRED':
        return AppColors.textMuted;
      default:
        return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          BlocBuilder<NotificationBloc, NotificationState>(
            builder: (context, state) {
              if (state is NotificationLoaded && state.unreadCount > 0) {
                return TextButton(
                  onPressed: () {
                    context
                        .read<NotificationBloc>()
                        .add(NotificationsMarkAllReadRequested());
                  },
                  child: const Text('Mark All Read'),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: BlocBuilder<NotificationBloc, NotificationState>(
        builder: (context, state) {
          if (state is NotificationLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (state is NotificationFailure) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(state.message, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () {
                      context
                          .read<NotificationBloc>()
                          .add(NotificationsFetchRequested());
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (state is NotificationLoaded) {
            if (state.notifications.isEmpty) {
              return const Center(
                child: Text('No notifications yet.'),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context
                    .read<NotificationBloc>()
                    .add(NotificationsFetchRequested());
              },
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.notifications.length,
                itemBuilder: (context, index) {
                  final item = state.notifications[index];
                  return _buildNotificationTile(context, item);
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildNotificationTile(BuildContext context, NotificationEntity item) {
    final icon = _getNotificationIcon(item.type);
    final color = _getNotificationColor(item.type);

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      color: item.isRead ? Colors.white : AppColors.accent.withAlpha(12),
      child: ListTile(
        onTap: () {
          if (!item.isRead) {
            context
                .read<NotificationBloc>()
                .add(NotificationMarkReadRequested(item.id));
          }
        },
        leading: CircleAvatar(
          backgroundColor: color.withAlpha(30),
          child: Icon(icon, color: color, size: 22),
        ),
        title: Text(
          item.title,
          style: TextStyle(
            fontWeight: item.isRead ? FontWeight.normal : FontWeight.bold,
            fontSize: 14,
            color: AppColors.textPrimary,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              item.message,
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 6),
            Text(
              Formatters.formatDateTime(item.createdAt),
              style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
            ),
          ],
        ),
        trailing: !item.isRead
            ? Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.accent,
                  shape: BoxShape.circle,
                ),
              )
            : null,
      ),
    );
  }
}
