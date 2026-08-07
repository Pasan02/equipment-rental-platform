import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/datasources/reservation_remote_datasource.dart';
import '../../../domain/entities/reservation_entity.dart';
import '../../blocs/reservation/reservation_bloc.dart';
import '../../blocs/reservation/reservation_event.dart';

class ReservationDetailScreen extends StatefulWidget {
  final String reservationId;

  const ReservationDetailScreen({super.key, required this.reservationId});

  @override
  State<ReservationDetailScreen> createState() => _ReservationDetailScreenState();
}

class _ReservationDetailScreenState extends State<ReservationDetailScreen> {
  ReservationEntity? _reservation;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadDetail();
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

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Cancel Reservation'),
          content: const Text(
            'Are you sure you want to cancel this reservation? Any reserved inventory will be released.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('No, Keep It'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
              ),
              onPressed: () {
                Navigator.pop(dialogContext);
                context.read<ReservationBloc>().add(
                      ReservationCancelRequested(widget.reservationId),
                    );
                _loadDetail();
              },
              child: const Text('Yes, Cancel'),
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
        title: Text(_reservation?.reservationNumber ?? 'Reservation Detail'),
      ),
      body: _isLoading
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
                                // Status Progress Timeline
                                _buildStatusTimeline(_reservation!.status),
                                const SizedBox(height: 24),

                                // General Details Card
                                Card(
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      children: [
                                        _buildRow('Reservation #', _reservation!.reservationNumber),
                                        _buildRow('Status', _reservation!.status, isStatus: true),
                                        _buildRow('Pickup Date', Formatters.formatDate(_reservation!.pickupDate)),
                                        _buildRow('Return Date', Formatters.formatDate(_reservation!.returnDate)),
                                        if (_reservation!.actualReturnDate != null)
                                          _buildRow('Actual Return', Formatters.formatDate(_reservation!.actualReturnDate)),
                                        _buildRow('Created At', Formatters.formatDateTime(_reservation!.createdAt)),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 24),

                                // Rejection Reason Banner
                                if (_reservation!.status == 'REJECTED' && _reservation!.rejectionReason != null) ...[
                                  Container(
                                    width: double.infinity,
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      color: AppColors.error.withAlpha(20),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(color: AppColors.error.withAlpha(50)),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          'Rejection Reason:',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.error,
                                            fontSize: 13,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          _reservation!.rejectionReason!,
                                          style: const TextStyle(
                                            color: AppColors.error,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 24),
                                ],

                                // Reserved Equipment Items List
                                const Text(
                                  'Reserved Items',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.textPrimary,
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
                                            color: AppColors.accent,
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
                                                    color: AppColors.textSecondary,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Text(
                                            Formatters.formatCurrency(item.subtotal),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 14,
                                              color: AppColors.accent,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }),
                                const SizedBox(height: 24),

                                // Financial Breakdown Summary
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.borderLight),
                                  ),
                                  child: Column(
                                    children: [
                                      _buildRow(
                                        'Total Rental Amount',
                                        Formatters.formatCurrency(_reservation!.totalAmount),
                                        isBold: true,
                                      ),
                                      _buildRow(
                                        'Total Security Deposit',
                                        Formatters.formatCurrency(_reservation!.depositTotal),
                                        isBold: true,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                        // Cancel Action Button
                        if (_reservation!.canCancel)
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              border: Border(
                                top: BorderSide(color: AppColors.borderLight),
                              ),
                            ),
                            child: SafeArea(
                              child: SizedBox(
                                width: double.infinity,
                                height: 48,
                                child: OutlinedButton(
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.error,
                                    side: const BorderSide(color: AppColors.error),
                                  ),
                                  onPressed: _showCancelDialog,
                                  child: const Text('Cancel Reservation'),
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
    );
  }

  Widget _buildStatusTimeline(String status) {
    final steps = ['PENDING', 'APPROVED', 'ACTIVE', 'RETURNED'];
    int currentStep = steps.indexOf(status);
    if (status == 'REJECTED' || status == 'CANCELLED') {
      currentStep = -1;
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Workflow Timeline',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: List.generate(steps.length, (index) {
              final stepName = steps[index];
              final isDone = currentStep >= index;
              final isCurrent = currentStep == index;

              return Expanded(
                child: Column(
                  children: [
                    Row(
                      children: [
                        if (index > 0)
                          Expanded(
                            child: Container(
                              height: 2,
                              color: isDone ? AppColors.accent : AppColors.borderLight,
                            ),
                          ),
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isDone
                                ? AppColors.accent
                                : AppColors.borderLight,
                          ),
                          child: Center(
                            child: isDone
                                ? const Icon(Icons.check,
                                    size: 14, color: Colors.white)
                                : Text(
                                    '${index + 1}',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                          ),
                        ),
                        if (index < steps.length - 1)
                          Expanded(
                            child: Container(
                              height: 2,
                              color: currentStep > index
                                  ? AppColors.accent
                                  : AppColors.borderLight,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      stepName,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight:
                            isCurrent ? FontWeight.bold : FontWeight.normal,
                        color: isDone
                            ? AppColors.textPrimary
                            : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isStatus = false, bool isBold = false}) {
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
