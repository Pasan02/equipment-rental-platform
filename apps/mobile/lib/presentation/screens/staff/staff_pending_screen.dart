import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../domain/entities/reservation_entity.dart';
import '../../blocs/reservation/reservation_bloc.dart';
import '../../blocs/reservation/reservation_event.dart';
import '../../blocs/reservation/reservation_state.dart';

class StaffPendingScreen extends StatefulWidget {
  const StaffPendingScreen({super.key});

  @override
  State<StaffPendingScreen> createState() => _StaffPendingScreenState();
}

class _StaffPendingScreenState extends State<StaffPendingScreen> {
  String _selectedStatus = 'PENDING';
  final _reasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    context.read<ReservationBloc>().add(
          const ReservationFetchRequested(statusFilter: 'PENDING'),
        );
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  void _showRejectDialog(String reservationId) {
    _reasonController.clear();
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Reject Reservation'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Please provide a reason for rejecting this reservation:'),
              const SizedBox(height: 12),
              TextField(
                controller: _reasonController,
                maxLines: 2,
                decoration: const InputDecoration(
                  hintText: 'e.g. Equipment unavailable / damaged',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
              onPressed: () {
                final reason = _reasonController.text.trim();
                if (reason.isEmpty) return;
                Navigator.pop(dialogContext);
                context.read<ReservationBloc>().add(
                      ReservationRejectRequested(reservationId, reason: reason),
                    );
              },
              child: const Text('Reject'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final statusList = ['PENDING', 'APPROVED', 'ACTIVE'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff Reservation Queue'),
      ),
      body: BlocListener<ReservationBloc, ReservationState>(
        listener: (context, state) {
          if (state is ReservationActionSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.success,
              ),
            );
          } else if (state is ReservationFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        child: Column(
          children: [
            // Status Tabs Bar
            Container(
              height: 48,
              margin: const EdgeInsets.only(top: 8),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: statusList.length,
                itemBuilder: (context, index) {
                  final status = statusList[index];
                  final isSelected = _selectedStatus == status;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(
                        status == 'PENDING'
                            ? 'Pending Approval'
                            : status == 'APPROVED'
                                ? 'Ready for Pickup'
                                : 'Active Rentals',
                      ),
                      selected: isSelected,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedStatus = status;
                          });
                          context.read<ReservationBloc>().add(
                                ReservationFetchRequested(statusFilter: status),
                              );
                        }
                      },
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),

            // Reservations Cards Queue
            Expanded(
              child: BlocBuilder<ReservationBloc, ReservationState>(
                builder: (context, state) {
                  if (state is ReservationLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (state is ReservationLoaded) {
                    if (state.reservations.isEmpty) {
                      return Center(
                        child: Text(
                          'No ${_selectedStatus.toLowerCase()} reservations.',
                        ),
                      );
                    }

                    return RefreshIndicator(
                      onRefresh: () async {
                        context.read<ReservationBloc>().add(
                              ReservationFetchRequested(
                                statusFilter: _selectedStatus,
                                isRefresh: true,
                              ),
                            );
                      },
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: state.reservations.length,
                        itemBuilder: (context, index) {
                          final item = state.reservations[index];
                          return _buildStaffCard(context, item);
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
      ),
    );
  }

  Widget _buildStaffCard(BuildContext context, ReservationEntity item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          context.push('/staff/reservation/${item.id}');
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Customer Profile & Res #
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
                  Text(
                    Formatters.formatCurrency(item.totalAmount),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: AppColors.accent,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              if (item.customer != null) ...[
                Row(
                  children: [
                    const Icon(Icons.person_outline,
                        size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Text(
                      item.customer!.fullName,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '(${item.customer!.email})',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
              ],
              Row(
                children: [
                  const Icon(Icons.date_range,
                      size: 16, color: AppColors.textSecondary),
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

              // Action Toolbar
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (item.status == 'PENDING') ...[
                    OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                      ),
                      onPressed: () => _showRejectDialog(item.id),
                      child: const Text('Reject'),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                      ),
                      onPressed: () {
                        context
                            .read<ReservationBloc>()
                            .add(ReservationApproveRequested(item.id));
                      },
                      child: const Text('Approve'),
                    ),
                  ],
                  if (item.status == 'APPROVED') ...[
                    ElevatedButton.icon(
                      icon: const Icon(Icons.check_circle_outline, size: 18),
                      label: const Text('Activate Pickup'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.statusActive,
                      ),
                      onPressed: () {
                        context
                            .read<ReservationBloc>()
                            .add(ReservationActivateRequested(item.id));
                      },
                    ),
                  ],
                  if (item.status == 'ACTIVE') ...[
                    ElevatedButton.icon(
                      icon: const Icon(Icons.assignment_turned_in, size: 18),
                      label: const Text('Process Return'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.statusReturned,
                      ),
                      onPressed: () {
                        context
                            .read<ReservationBloc>()
                            .add(ReservationReturnRequested(item.id));
                      },
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
