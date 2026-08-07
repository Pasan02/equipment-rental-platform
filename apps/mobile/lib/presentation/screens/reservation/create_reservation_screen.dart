import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/datasources/equipment_remote_datasource.dart';
import '../../../domain/entities/equipment_entity.dart';
import '../../blocs/reservation/reservation_bloc.dart';
import '../../blocs/reservation/reservation_event.dart';
import '../../blocs/reservation/reservation_state.dart';

class CreateReservationScreen extends StatefulWidget {
  final String equipmentId;

  const CreateReservationScreen({super.key, required this.equipmentId});

  @override
  State<CreateReservationScreen> createState() => _CreateReservationScreenState();
}

class _CreateReservationScreenState extends State<CreateReservationScreen> {
  EquipmentEntity? _equipment;
  bool _isLoadingEquipment = true;
  int _quantity = 1;
  DateTime _pickupDate = DateTime.now().add(const Duration(days: 1));
  DateTime _returnDate = DateTime.now().add(const Duration(days: 3));
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchEquipment();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _fetchEquipment() async {
    try {
      final datasource = context.read<EquipmentRemoteDatasource>();
      final item = await datasource.getEquipmentDetail(widget.equipmentId);
      setState(() {
        _equipment = item;
        _isLoadingEquipment = false;
      });
    } catch (_) {
      setState(() {
        _isLoadingEquipment = false;
      });
    }
  }

  int get _rentalDays {
    final diff = _returnDate.difference(_pickupDate).inDays;
    return diff <= 0 ? 1 : diff;
  }

  double get _totalRentalAmount {
    if (_equipment == null) return 0.0;
    return _equipment!.rentalPricePerDay * _quantity * _rentalDays;
  }

  double get _totalDepositAmount {
    if (_equipment == null) return 0.0;
    return _equipment!.depositAmount * _quantity;
  }

  Future<void> _selectPickupDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _pickupDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _pickupDate = picked;
        if (_returnDate.isBefore(_pickupDate.add(const Duration(days: 1)))) {
          _returnDate = _pickupDate.add(const Duration(days: 1));
        }
      });
    }
  }

  Future<void> _selectReturnDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _returnDate,
      firstDate: _pickupDate.add(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _returnDate = picked;
      });
    }
  }

  void _showConfirmationBottomSheet() {
    final dateFormat = DateFormat('yyyy-MM-dd');
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (bottomSheetContext) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Confirm Reservation',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 16),
              _buildSummaryRow('Equipment', _equipment!.name),
              _buildSummaryRow('Quantity', '$_quantity unit(s)'),
              _buildSummaryRow('Pickup Date', Formatters.formatDate(_pickupDate)),
              _buildSummaryRow('Return Date', Formatters.formatDate(_returnDate)),
              _buildSummaryRow('Duration', '$_rentalDays day(s)'),
              const Divider(height: 24),
              _buildSummaryRow(
                'Total Rental',
                Formatters.formatCurrency(_totalRentalAmount),
                isBold: true,
              ),
              _buildSummaryRow(
                'Security Deposit',
                Formatters.formatCurrency(_totalDepositAmount),
                isBold: true,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(bottomSheetContext);
                    context.read<ReservationBloc>().add(
                          ReservationCreateRequested(
                            pickupDate: dateFormat.format(_pickupDate),
                            returnDate: dateFormat.format(_returnDate),
                            notes: _notesController.text.trim(),
                            items: [
                              {
                                'equipmentId': _equipment!.id,
                                'quantity': _quantity,
                              }
                            ],
                          ),
                        );
                  },
                  child: const Text('Confirm & Submit'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isBold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: isBold ? AppColors.textPrimary : AppColors.textSecondary,
              fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
              color: isBold ? AppColors.accent : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Reservation'),
      ),
      body: BlocListener<ReservationBloc, ReservationState>(
        listener: (context, state) {
          if (state is ReservationCreateSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Reservation submitted successfully!'),
                backgroundColor: AppColors.success,
              ),
            );
            context.go('/reservations');
          } else if (state is ReservationFailure) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        child: _isLoadingEquipment
            ? const Center(child: CircularProgressIndicator())
            : _equipment == null
                ? const Center(child: Text('Equipment not found'))
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Equipment Summary Card
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Container(
                                  width: 64,
                                  height: 64,
                                  decoration: BoxDecoration(
                                    color: AppColors.borderLight,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: _equipment!.primaryImageUrl.isNotEmpty
                                      ? Image.network(
                                          _equipment!.primaryImageUrl,
                                          fit: BoxFit.cover,
                                        )
                                      : const Icon(Icons.image),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        _equipment!.name,
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${Formatters.formatCurrency(_equipment!.rentalPricePerDay)} / day',
                                        style: const TextStyle(
                                          fontSize: 13,
                                          color: AppColors.accent,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Quantity Stepper
                        const Text(
                          'Quantity',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            IconButton.outlined(
                              icon: const Icon(Icons.remove),
                              onPressed: _quantity > 1
                                  ? () => setState(() => _quantity--)
                                  : null,
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              child: Text(
                                '$_quantity',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            IconButton.outlined(
                              icon: const Icon(Icons.add),
                              onPressed: _quantity < _equipment!.availableQuantity
                                  ? () => setState(() => _quantity++)
                                  : null,
                            ),
                            const Spacer(),
                            Text(
                              'Max: ${_equipment!.availableQuantity}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Date Pickers
                        Row(
                          children: [
                            Expanded(
                              child: InkWell(
                                onTap: _selectPickupDate,
                                borderRadius: BorderRadius.circular(10),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppColors.borderLight),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Pickup Date',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(Icons.calendar_today,
                                              size: 16, color: AppColors.accent),
                                          const SizedBox(width: 8),
                                          Text(
                                            Formatters.formatDate(_pickupDate),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: InkWell(
                                onTap: _selectReturnDate,
                                borderRadius: BorderRadius.circular(10),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppColors.borderLight),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Return Date',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          const Icon(Icons.calendar_today,
                                              size: 16, color: AppColors.accent),
                                          const SizedBox(width: 8),
                                          Text(
                                            Formatters.formatDate(_returnDate),
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Cost Breakdown Summary Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.backgroundLight,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.borderLight),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Estimated Cost Summary',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 12),
                              _buildSummaryRow(
                                'Rental Fee ($_rentalDays day(s))',
                                Formatters.formatCurrency(_totalRentalAmount),
                              ),
                              _buildSummaryRow(
                                'Security Deposit (Refundable)',
                                Formatters.formatCurrency(_totalDepositAmount),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Notes Field
                        TextFormField(
                          controller: _notesController,
                          maxLines: 3,
                          decoration: const InputDecoration(
                            labelText: 'Special Requests / Notes (Optional)',
                            hintText: 'Add any specific instructions for pickup...',
                          ),
                        ),
                        const SizedBox(height: 32),

                        // Action Button
                        BlocBuilder<ReservationBloc, ReservationState>(
                          builder: (context, state) {
                            final isSubmitting = state is ReservationLoading;
                            return SizedBox(
                              width: double.infinity,
                              height: 50,
                              child: ElevatedButton(
                                onPressed: isSubmitting
                                    ? null
                                    : _showConfirmationBottomSheet,
                                child: isSubmitting
                                    ? const CircularProgressIndicator(
                                        color: Colors.white)
                                    : const Text(
                                        'Review & Submit Reservation',
                                        style: TextStyle(fontSize: 16),
                                      ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
      ),
    );
  }
}
