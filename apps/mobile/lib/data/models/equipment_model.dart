import '../../domain/entities/equipment_entity.dart';
import 'category_model.dart';

class EquipmentImageModel extends EquipmentImageEntity {
  const EquipmentImageModel({
    required super.id,
    required super.imageUrl,
    required super.sortOrder,
    required super.isPrimary,
  });

  factory EquipmentImageModel.fromJson(Map<String, dynamic> json) {
    return EquipmentImageModel(
      id: json['id'] ?? '',
      imageUrl: json['imageUrl'] ?? json['image_url'] ?? '',
      sortOrder: json['sortOrder'] ?? json['sort_order'] ?? 0,
      isPrimary: json['isPrimary'] ?? json['is_primary'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'imageUrl': imageUrl,
      'sortOrder': sortOrder,
      'isPrimary': isPrimary,
    };
  }
}

class EquipmentModel extends EquipmentEntity {
  const EquipmentModel({
    required super.id,
    required super.name,
    required super.description,
    required super.rentalPricePerDay,
    required super.depositAmount,
    required super.stockQuantity,
    required super.availableQuantity,
    required super.specifications,
    super.qrCode,
    required super.categoryId,
    super.category,
    required super.images,
    required super.isActive,
  });

  factory EquipmentModel.fromJson(Map<String, dynamic> json) {
    var rawPrice = json['rentalPricePerDay'] ?? json['rental_price_per_day'] ?? 0;
    var rawDeposit = json['depositAmount'] ?? json['deposit_amount'] ?? 0;

    List<EquipmentImageModel> imgList = [];
    if (json['images'] != null && json['images'] is List) {
      imgList = (json['images'] as List)
          .map((i) => EquipmentImageModel.fromJson(i))
          .toList();
    }

    CategoryModel? catModel;
    if (json['category'] != null) {
      catModel = CategoryModel.fromJson(json['category']);
    }

    Map<String, dynamic> specs = {};
    if (json['specifications'] != null) {
      if (json['specifications'] is Map) {
        specs = Map<String, dynamic>.from(json['specifications']);
      }
    }

    return EquipmentModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      rentalPricePerDay: (rawPrice is num) ? rawPrice.toDouble() : double.tryParse(rawPrice.toString()) ?? 0.0,
      depositAmount: (rawDeposit is num) ? rawDeposit.toDouble() : double.tryParse(rawDeposit.toString()) ?? 0.0,
      stockQuantity: json['stockQuantity'] ?? json['stock_quantity'] ?? 0,
      availableQuantity: json['availableQuantity'] ?? json['available_quantity'] ?? 0,
      specifications: specs,
      qrCode: json['qrCode'] ?? json['qr_code'],
      categoryId: json['categoryId'] ?? json['category_id'] ?? '',
      category: catModel,
      images: imgList,
      isActive: json['isActive'] ?? json['is_active'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'rentalPricePerDay': rentalPricePerDay,
      'depositAmount': depositAmount,
      'stockQuantity': stockQuantity,
      'availableQuantity': availableQuantity,
      'specifications': specifications,
      'qrCode': qrCode,
      'categoryId': categoryId,
      'isActive': isActive,
    };
  }
}
