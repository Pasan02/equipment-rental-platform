import 'package:equatable/equatable.dart';

abstract class EquipmentEvent extends Equatable {
  const EquipmentEvent();

  @override
  List<Object?> get props => [];
}

class EquipmentFetchRequested extends EquipmentEvent {
  final bool isRefresh;
  final String? search;
  final String? categoryId;

  const EquipmentFetchRequested({
    this.isRefresh = false,
    this.search,
    this.categoryId,
  });

  @override
  List<Object?> get props => [isRefresh, search, categoryId];
}

class EquipmentLoadNextPageRequested extends EquipmentEvent {}

class CategorySelectRequested extends EquipmentEvent {
  final String? categoryId;

  const CategorySelectRequested(this.categoryId);

  @override
  List<Object?> get props => [categoryId];
}

class EquipmentSearchQueryChanged extends EquipmentEvent {
  final String query;

  const EquipmentSearchQueryChanged(this.query);

  @override
  List<Object?> get props => [query];
}
