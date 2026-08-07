import 'package:equatable/equatable.dart';
import '../../../domain/entities/category_entity.dart';
import '../../../domain/entities/equipment_entity.dart';

abstract class EquipmentState extends Equatable {
  const EquipmentState();

  @override
  List<Object?> get props => [];
}

class EquipmentInitial extends EquipmentState {}

class EquipmentLoading extends EquipmentState {}

class EquipmentLoaded extends EquipmentState {
  final List<EquipmentEntity> items;
  final List<CategoryEntity> categories;
  final String? selectedCategoryId;
  final String searchQuery;
  final int currentPage;
  final int totalPages;
  final bool hasReachedMax;

  const EquipmentLoaded({
    required this.items,
    required this.categories,
    this.selectedCategoryId,
    this.searchQuery = '',
    required this.currentPage,
    required this.totalPages,
    required this.hasReachedMax,
  });

  EquipmentLoaded copyWith({
    List<EquipmentEntity>? items,
    List<CategoryEntity>? categories,
    String? selectedCategoryId,
    String? searchQuery,
    int? currentPage,
    int? totalPages,
    bool? hasReachedMax,
  }) {
    return EquipmentLoaded(
      items: items ?? this.items,
      categories: categories ?? this.categories,
      selectedCategoryId: selectedCategoryId ?? this.selectedCategoryId,
      searchQuery: searchQuery ?? this.searchQuery,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      hasReachedMax: hasReachedMax ?? this.hasReachedMax,
    );
  }

  @override
  List<Object?> get props => [
        items,
        categories,
        selectedCategoryId,
        searchQuery,
        currentPage,
        totalPages,
        hasReachedMax,
      ];
}

class EquipmentFailure extends EquipmentState {
  final String message;

  const EquipmentFailure({required this.message});

  @override
  List<Object?> get props => [message];
}
