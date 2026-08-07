import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/datasources/equipment_remote_datasource.dart';
import '../../../domain/entities/equipment_entity.dart';

class EquipmentDetailScreen extends StatefulWidget {
  final String equipmentId;

  const EquipmentDetailScreen({super.key, required this.equipmentId});

  @override
  State<EquipmentDetailScreen> createState() => _EquipmentDetailScreenState();
}

class _EquipmentDetailScreenState extends State<EquipmentDetailScreen> {
  EquipmentEntity? _equipment;
  bool _isLoading = true;
  String? _errorMessage;
  int _selectedImageIndex = 0;

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
      final datasource = context.read<EquipmentRemoteDatasource>();
      final item = await datasource.getEquipmentDetail(widget.equipmentId);
      setState(() {
        _equipment = item;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load details: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_equipment?.name ?? 'Equipment Detail'),
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
              : _equipment == null
                  ? const Center(child: Text('Equipment not found'))
                  : Column(
                      children: [
                        Expanded(
                          child: SingleChildScrollView(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Hero Image Viewer
                                _buildImageGallery(),

                                Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      // Title & Category
                                      Text(
                                        _equipment!.name,
                                        style: const TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      if (_equipment!.category != null)
                                        Chip(
                                          label: Text(_equipment!.category!.name),
                                          backgroundColor:
                                              AppColors.accent.withAlpha(25),
                                          labelStyle: const TextStyle(
                                            color: AppColors.accent,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      const SizedBox(height: 16),

                                      // Pricing & Stock Cards
                                      Row(
                                        children: [
                                          Expanded(
                                            child: _buildInfoCard(
                                              title: 'Daily Rate',
                                              value: Formatters.formatCurrency(
                                                  _equipment!.rentalPricePerDay),
                                              color: AppColors.accent,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: _buildInfoCard(
                                              title: 'Security Deposit',
                                              value: Formatters.formatCurrency(
                                                  _equipment!.depositAmount),
                                              color: AppColors.statusPending,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: _buildInfoCard(
                                              title: 'Available',
                                              value:
                                                  '${_equipment!.availableQuantity} / ${_equipment!.stockQuantity}',
                                              color: _equipment!.isAvailable
                                                  ? AppColors.success
                                                  : AppColors.error,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 24),

                                      // Description
                                      const Text(
                                        'Description',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        _equipment!.description,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          color: AppColors.textSecondary,
                                          height: 1.4,
                                        ),
                                      ),
                                      const SizedBox(height: 24),

                                      // Specifications Table
                                      if (_equipment!.specifications.isNotEmpty) ...[
                                        const Text(
                                          'Technical Specifications',
                                          style: TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        Container(
                                          decoration: BoxDecoration(
                                            color: Colors.white,
                                            borderRadius:
                                                BorderRadius.circular(10),
                                            border: Border.all(
                                                color: AppColors.borderLight),
                                          ),
                                          child: Column(
                                            children: _equipment!
                                                .specifications.entries
                                                .map((entry) {
                                              return Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 16,
                                                        vertical: 12),
                                                decoration: const BoxDecoration(
                                                  border: Border(
                                                    bottom: BorderSide(
                                                        color: AppColors
                                                            .borderLight),
                                                  ),
                                                ),
                                                child: Row(
                                                  mainAxisAlignment:
                                                      MainAxisAlignment
                                                          .spaceBetween,
                                                  children: [
                                                    Text(
                                                      entry.key,
                                                      style: const TextStyle(
                                                        color: AppColors
                                                            .textSecondary,
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                    Text(
                                                      entry.value.toString(),
                                                      style: const TextStyle(
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        color: AppColors
                                                            .textPrimary,
                                                        fontSize: 14,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              );
                                            }).toList(),
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

                        // Bottom Reserve Action Bar
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
                              height: 50,
                              child: ElevatedButton(
                                onPressed: _equipment!.isAvailable
                                    ? () {
                                        context.push(
                                          '/reservation/create?equipmentId=${_equipment!.id}',
                                        );
                                      }
                                    : null,
                                child: Text(
                                  _equipment!.isAvailable
                                      ? 'Reserve Equipment'
                                      : 'Currently Unavailable',
                                  style: const TextStyle(fontSize: 16),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
    );
  }

  Widget _buildImageGallery() {
    final images = _equipment!.images;
    final hasImages = images.isNotEmpty;
    final currentUrl = hasImages ? images[_selectedImageIndex].imageUrl : '';

    return Column(
      children: [
        Container(
          height: 240,
          width: double.infinity,
          color: AppColors.borderLight.withAlpha(50),
          child: currentUrl.isNotEmpty
              ? Image.network(
                  currentUrl,
                  fit: BoxFit.contain,
                  errorBuilder: (_, __, ___) => const Icon(
                    Icons.build_circle_outlined,
                    size: 64,
                    color: AppColors.textMuted,
                  ),
                )
              : const Icon(
                  Icons.build_circle_outlined,
                  size: 64,
                  color: AppColors.textMuted,
                ),
        ),
        if (images.length > 1)
          SizedBox(
            height: 70,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: images.length,
              itemBuilder: (context, index) {
                final isSelected = index == _selectedImageIndex;
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedImageIndex = index;
                    });
                  },
                  child: Container(
                    width: 60,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? AppColors.accent
                            : AppColors.borderLight,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Image.network(
                        images[index].imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(Icons.image),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _buildInfoCard({
    required String title,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withAlpha(50)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
