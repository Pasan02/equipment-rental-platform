import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../domain/entities/reservation_entity.dart';
import '../../blocs/reservation/reservation_bloc.dart';
import '../../blocs/reservation/reservation_event.dart';
import '../../blocs/reservation/reservation_state.dart';

class ReservationsListScreen extends StatefulWidget {
  const ReservationsListScreen({super.key});

  @override
  State<ReservationsListScreen> createState() => _ReservationsListScreenState();
}

class _ReservationsListScreenState extends State<ReservationsListScreen> {
  String _selectedStatus = 'ALL';

  @override
  void initState() {
    super.initState();
    context.read<ReservationBloc>().add(const ReservationFetchRequested());
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return AppColors.statusPending;
      case 'APPROVED':
        return AppColors.statusApproved;
      case 'ACTIVE':
        return AppColors.statusActive;
      case 'RETURNED':
        return AppColors.statusReturned;
      case 'REJECTED':
        return AppColors.statusRejected;
      case 'CANCELLED':
        return AppColors.statusCancelled;
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusList = ['ALL', 'PENDING', 'APPROVED', 'ACTIVE', 'RETURNED', 'CANCELLED'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Reservations'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
      ),
      body: Column(
        children: [
          // Status Filter Tabs
          SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              itemCount: statusList.length,
              itemBuilder: (context, index) {
                final status = statusList[index];
                final isSelected = _selectedStatus == status;
                return Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ChoiceChip(
                    label: Text(status),
                    selected: isSelected,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedStatus = status;
                        });
                        context.read<ReservationBloc>().add(
                              ReservationFetchRequested(
                                statusFilter: status == 'ALL' ? null : status,
                              ),
                            );
                      }
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),

          // Reservation Cards List
          Expanded(
            child: BlocBuilder<ReservationBloc, ReservationState>(
              builder: (context, state) {
                if (state is ReservationLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state is ReservationFailure) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(state.message, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () {
                            context.read<ReservationBloc>().add(
                                  ReservationFetchRequested(
                                    statusFilter: _selectedStatus == 'ALL'
                                        ? null
                                        : _selectedStatus,
                                  ),
                                );
                          },
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                if (state is ReservationLoaded) {
                  if (state.reservations.isEmpty) {
                    return const Center(
                      child: Text('No reservations found.'),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      context.read<ReservationBloc>().add(
                            ReservationFetchRequested(
                              statusFilter: _selectedStatus == 'ALL'
                                  ? null
                                  : _selectedStatus,
                              isRefresh: true,
                            ),
                          );
                    },
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: state.reservations.length,
                      itemBuilder: (context, index) {
                        final item = state.reservations[index];
                        return _buildReservationCard(context, item);
                      },
                    ),
                  );
                }

                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReservationCard(BuildContext context, ReservationEntity item) {
    final statusColor = _getStatusColor(item.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          context.push('/reservations/${item.id}');
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    item.reservationNumber,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withAlpha(25),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      item.status,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(Icons.date_range, size: 16, color: AppColors.textSecondary),
                  const SizedBox(width: 6),
                  Text(
                    '${Formatters.formatDate(item.pickupDate)} → ${Formatters.formatDate(item.returnDate)}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${item.items.length} item(s)',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textMuted,
                    ),
                  ),
                  Text(
                    Formatters.formatCurrency(item.totalAmount),
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppColors.accent,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
