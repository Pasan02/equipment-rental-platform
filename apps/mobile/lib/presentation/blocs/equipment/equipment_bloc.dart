import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/datasources/equipment_remote_datasource.dart';
import '../../../domain/entities/category_entity.dart';
import '../../../domain/entities/equipment_entity.dart';
import 'equipment_event.dart';
import 'equipment_state.dart';

class EquipmentBloc extends Bloc<EquipmentEvent, EquipmentState> {
  final EquipmentRemoteDatasource datasource;

  EquipmentBloc({required this.datasource}) : super(EquipmentInitial()) {
    on<EquipmentFetchRequested>(_onEquipmentFetchRequested);
    on<EquipmentLoadNextPageRequested>(_onEquipmentLoadNextPageRequested);
    on<CategorySelectRequested>(_onCategorySelectRequested);
    on<EquipmentSearchQueryChanged>(_onEquipmentSearchQueryChanged);
  }

  Future<void> _onEquipmentFetchRequested(
    EquipmentFetchRequested event,
    Emitter<EquipmentState> emit,
  ) async {
    if (!event.isRefresh) {
      emit(EquipmentLoading());
    }

    try {
      final categories = await datasource.getCategories();
      final res = await datasource.getEquipmentList(
        page: 1,
        pageSize: 10,
        search: event.search,
        categoryId: event.categoryId,
      );

      final items = res['items'] as List<EquipmentEntity>;
      final totalPages = res['totalPages'] as int;

      emit(
        EquipmentLoaded(
          items: items,
          categories: categories,
          selectedCategoryId: event.categoryId,
          searchQuery: event.search ?? '',
          currentPage: 1,
          totalPages: totalPages,
          hasReachedMax: 1 >= totalPages,
        ),
      );
    } catch (e) {
      emit(EquipmentFailure(message: 'Failed to load equipment catalog: $e'));
    }
  }

  Future<void> _onEquipmentLoadNextPageRequested(
    EquipmentLoadNextPageRequested event,
    Emitter<EquipmentState> emit,
  ) async {
    final currentState = state;
    if (currentState is EquipmentLoaded && !currentState.hasReachedMax) {
      try {
        final nextPage = currentState.currentPage + 1;
        final res = await datasource.getEquipmentList(
          page: nextPage,
          pageSize: 10,
          search: currentState.searchQuery,
          categoryId: currentState.selectedCategoryId,
        );

        final newItems = res['items'] as List<EquipmentEntity>;
        final totalPages = res['totalPages'] as int;

        emit(
          currentState.copyWith(
            items: List.of(currentState.items)..addAll(newItems),
            currentPage: nextPage,
            totalPages: totalPages,
            hasReachedMax: nextPage >= totalPages,
          ),
        );
      } catch (_) {
        // Keep existing items if next page fetch fails
      }
    }
  }

  Future<void> _onCategorySelectRequested(
    CategorySelectRequested event,
    Emitter<EquipmentState> emit,
  ) async {
    final currentState = state;
    String search = '';
    if (currentState is EquipmentLoaded) {
      search = currentState.searchQuery;
    }

    add(EquipmentFetchRequested(search: search, categoryId: event.categoryId));
  }

  Future<void> _onEquipmentSearchQueryChanged(
    EquipmentSearchQueryChanged event,
    Emitter<EquipmentState> emit,
  ) async {
    final currentState = state;
    String? categoryId;
    if (currentState is EquipmentLoaded) {
      categoryId = currentState.selectedCategoryId;
    }

    add(EquipmentFetchRequested(search: event.query, categoryId: categoryId));
  }
}
