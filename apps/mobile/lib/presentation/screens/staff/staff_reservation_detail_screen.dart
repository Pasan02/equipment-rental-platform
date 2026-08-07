import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/datasources/reservation_remote_datasource.dart';
import '../../../domain/entities/reservation_entity.dart';
import '../../blocs/reservation/reservation_bloc.dart';
import '../../blocs/reservation/reservation_event.dart';
import '../../blocs/reservation/reservation_state.dart';

class StaffReservationDetailScreen extends StatefulWidget {
  final String reservationId;

  const StaffReservationDetailScreen({super.key, required this.reservationId});

  @override
  State<StaffReservationDetailScreen> createState() =>
      _StaffReservationDetailScreenState();
}

class _StaffReservationDetailScreenState
    extends State<StaffReservationDetailScreen> {
  ReservationEntity? _reservation;
  bool _isLoading = true;
  String? _errorMessage;
  final _reasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final datasource = context.read<ReservationRemoteDatasource>();
      final item = await datasource.getReservationDetail(widget.reservationId);
      setState(() {
        _reservation = item;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load reservation: $e';
        _isLoading = false;
      });
    }
  }

  void _showRejectDialog() {
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
                      ReservationRejectRequested(widget.reservationId,
                          reason: reason),
                    );
                _loadDetail();
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
    return Scaffold(
      appBar: AppBar(
        title: Text(_reservation?.reservationNumber ?? 'Staff Processing'),
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
            _loadDetail();
          }
        },
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(_errorMessage!),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _loadDetail,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : _reservation == null
                    ? const Center(child: Text('Reservation not found'))
                    : Column(
                        children: [
                          Expanded(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Customer Profile Card
                                  if (_reservation!.customer != null) ...[
                                    Card(
                                      child: Padding(
                                        padding: const EdgeInsets.all(16),
                                        child: Row(
                                          children: [
                                            CircleAvatar(
                                              radius: 24,
                                              backgroundColor: AppColors.accent,
                                              child: Text(
                                                _reservation!
                                                    .customer!.firstName[0]
                                                    .toUpperCase(),
                                                style: const TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 14),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    _reservation!
                                                        .customer!.fullName,
                                                    style: const TextStyle(
                                                      fontSize: 16,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    _reservation!.customer!.email,
                                                    style: const TextStyle(
                                                      fontSize: 13,
                                                      color:
                                                          AppColors.textSecondary,
                                                    ),
                                                  ),
                                                  if (_reservation!
                                                          .customer!.phone !=
                                                      null) ...[
                                                    const SizedBox(height: 2),
                                                    Text(
                                                      _reservation!
                                                          .customer!.phone!,
                                                      style: const TextStyle(
                                                        fontSize: 13,
                                                        color:
                                                            AppColors.textSecondary,
                                                      ),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                  ],

                                  // Reservation Meta Card
                                  Card(
                                    child: Padding(
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        children: [
                                          _buildRow('Reservation #',
                                              _reservation!.reservationNumber),
                                          _buildRow('Status', _reservation!.status,
                                              isStatus: true),
                                          _buildRow(
                                              'Pickup Date',
                                              Formatters.formatDate(
                                                  _reservation!.pickupDate)),
                                          _buildRow(
                                              'Return Date',
                                              Formatters.formatDate(
                                                  _reservation!.returnDate)),
                                          if (_reservation!.notes != null)
                                            _buildRow(
                                                'Customer Notes', _reservation!.notes!),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 24),

                                  // Reserved Items List
                                  const Text(
                                    'Equipment Items to Fulfill',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  ..._reservation!.items.map((item) {
                                    return Card(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      child: Padding(
                                        padding: const EdgeInsets.all(12),
                                        child: Row(
                                          children: [
                                            const Icon(
                                              Icons.build_circle_outlined,
                                              size: 36,
                                              color: AppColors.primary,
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    item.equipment?.name ??
                                                        'Equipment Item',
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 14,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    'Qty: ${item.quantity} × ${Formatters.formatCurrency(item.unitPrice)}/day',
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      color:
                                                          AppColors.textSecondary,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Text(
                                              Formatters.formatCurrency(
                                                  item.subtotal),
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.accent,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  }),
                                  const SizedBox(height: 24),

                                  // Financial Totals Summary
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                      border:
                                          Border.all(color: AppColors.borderLight),
                                    ),
                                    child: Column(
                                      children: [
                                        _buildRow(
                                          'Total Rental Price',
                                          Formatters.formatCurrency(
                                              _reservation!.totalAmount),
                                          isBold: true,
                                        ),
                                        _buildRow(
                                          'Security Deposit Collected',
                                          Formatters.formatCurrency(
                                              _reservation!.depositTotal),
                                          isBold: true,
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // Staff Action Bar
                          _buildStaffActionBar(),
                        ],
                      ),
      ),
    );
  }

  Widget _buildStaffActionBar() {
    if (_reservation == null) return const SizedBox.shrink();
    final status = _reservation!.status;

    if (status != 'PENDING' && status != 'APPROVED' && status != 'ACTIVE') {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.borderLight)),
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 48,
          child: Builder(
            builder: (context) {
              if (status == 'PENDING') {
                return Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                        ),
                        onPressed: _showRejectDialog,
                        child: const Text('Reject'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.success,
                        ),
                        onPressed: () {
                          context.read<ReservationBloc>().add(
                                ReservationApproveRequested(_reservation!.id),
                              );
                        },
                        child: const Text('Approve'),
                      ),
                    ),
                  ],
                );
              } else if (status == 'APPROVED') {
                return ElevatedButton.icon(
                  icon: const Icon(Icons.check_circle_outline),
                  label: const Text('Activate Pickup'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.statusActive,
                  ),
                  onPressed: () {
                    context.read<ReservationBloc>().add(
                          ReservationActivateRequested(_reservation!.id),
                        );
                  },
                );
              } else if (status == 'ACTIVE') {
                return ElevatedButton.icon(
                  icon: const Icon(Icons.assignment_turned_in),
                  label: const Text('Process Return'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.statusReturned,
                  ),
                  onPressed: () {
                    context.read<ReservationBloc>().add(
                          ReservationReturnRequested(_reservation!.id),
                        );
                  },
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ),
      ),
    );
  }

  Widget _buildRow(String label, String value,
      {bool isStatus = false, bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: isBold || isStatus ? FontWeight.bold : FontWeight.w500,
              color: isStatus ? AppColors.accent : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
