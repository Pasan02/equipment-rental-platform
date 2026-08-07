import 'package:equatable/equatable.dart';
import 'category_entity.dart';

class EquipmentImageEntity extends Equatable {
  final String id;
  final String imageUrl;
  final int sortOrder;
  final bool isPrimary;

  const EquipmentImageEntity({
    required this.id,
    required this.imageUrl,
    required this.sortOrder,
    required this.isPrimary,
  });

  @override
  List<Object?> get props => [id, imageUrl, sortOrder, isPrimary];
}

class EquipmentEntity extends Equatable {
  final String id;
  final String name;
  final String description;
  final double rentalPricePerDay;
  final double depositAmount;
  final int stockQuantity;
  final int availableQuantity;
  final Map<String, dynamic> specifications;
  final String? qrCode;
  final String categoryId;
  final CategoryEntity? category;
  final List<EquipmentImageEntity> images;
  final bool isActive;

  const EquipmentEntity({
    required this.id,
    required this.name,
    required this.description,
    required this.rentalPricePerDay,
    required this.depositAmount,
    required this.stockQuantity,
    required this.availableQuantity,
    required this.specifications,
    this.qrCode,
    required this.categoryId,
    this.category,
    required this.images,
    required this.isActive,
  });

  String get primaryImageUrl {
    if (images.isEmpty) return '';
    for (final img in images) {
      if (img.isPrimary) return img.imageUrl;
    }
    return images.first.imageUrl;
  }

  bool get isAvailable => availableQuantity > 0 && isActive;

  @override
  List<Object?> get props => [
        id,
        name,
        description,
        rentalPricePerDay,
        depositAmount,
        stockQuantity,
        availableQuantity,
        specifications,
        qrCode,
        categoryId,
        category,
        images,
        isActive,
      ];
}
