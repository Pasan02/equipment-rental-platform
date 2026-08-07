import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../domain/entities/equipment_entity.dart';
import '../../blocs/equipment/equipment_bloc.dart';
import '../../blocs/equipment/equipment_event.dart';
import '../../blocs/equipment/equipment_state.dart';

class EquipmentListScreen extends StatefulWidget {
  const EquipmentListScreen({super.key});

  @override
  State<EquipmentListScreen> createState() => _EquipmentListScreenState();
}

class _EquipmentListScreenState extends State<EquipmentListScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    context.read<EquipmentBloc>().add(const EquipmentFetchRequested());
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_isBottom) {
      context.read<EquipmentBloc>().add(EquipmentLoadNextPageRequested());
    }
  }

  bool get _isBottom {
    if (!_scrollController.hasClients) return false;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;
    return currentScroll >= (maxScroll * 0.9);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Browse Equipment'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/');
            }
          },
        ),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search equipment by name...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          context
                              .read<EquipmentBloc>()
                              .add(const EquipmentSearchQueryChanged(''));
                        },
                      )
                    : null,
              ),
              onChanged: (query) {
                context
                    .read<EquipmentBloc>()
                    .add(EquipmentSearchQueryChanged(query));
              },
            ),
          ),

          // Categories Horizontal Chips
          BlocBuilder<EquipmentBloc, EquipmentState>(
            builder: (context, state) {
              if (state is EquipmentLoaded) {
                return SizedBox(
                  height: 48,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: FilterChip(
                          label: const Text('All Categories'),
                          selected: state.selectedCategoryId == null,
                          onSelected: (_) {
                            context
                                .read<EquipmentBloc>()
                                .add(const CategorySelectRequested(null));
                          },
                        ),
                      ),
                      ...state.categories.map((cat) {
                        final isSelected = state.selectedCategoryId == cat.id;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: FilterChip(
                            label: Text(cat.name),
                            selected: isSelected,
                            onSelected: (_) {
                              context.read<EquipmentBloc>().add(
                                    CategorySelectRequested(
                                      isSelected ? null : cat.id,
                                    ),
                                  );
                            },
                          ),
                        );
                      }),
                    ],
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),

          const SizedBox(height: 8),

          // Equipment Items Grid
          Expanded(
            child: BlocBuilder<EquipmentBloc, EquipmentState>(
              builder: (context, state) {
                if (state is EquipmentLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state is EquipmentFailure) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(state.message, textAlign: TextAlign.center),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: () {
                            context
                                .read<EquipmentBloc>()
                                .add(const EquipmentFetchRequested());
                          },
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                if (state is EquipmentLoaded) {
                  if (state.items.isEmpty) {
                    return const Center(
                      child: Text('No equipment items found.'),
                    );
                  }

                  return RefreshIndicator(
                    onRefresh: () async {
                      context.read<EquipmentBloc>().add(
                            const EquipmentFetchRequested(isRefresh: true),
                          );
                    },
                    child: GridView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.72,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: state.hasReachedMax
                          ? state.items.length
                          : state.items.length + 1,
                      itemBuilder: (context, index) {
                        if (index >= state.items.length) {
                          return const Center(
                            child: CircularProgressIndicator(),
                          );
                        }

                        final item = state.items[index];
                        return _buildEquipmentCard(context, item);
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
    );
  }

  Widget _buildEquipmentCard(BuildContext context, EquipmentEntity item) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () {
          context.push('/equipment/${item.id}');
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thumbnail Image Container
            Expanded(
              child: Container(
                width: double.infinity,
                color: AppColors.borderLight.withAlpha(50),
                child: item.primaryImageUrl.isNotEmpty
                    ? Image.network(
                        item.primaryImageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.build_circle_outlined,
                          size: 48,
                          color: AppColors.textMuted,
                        ),
                      )
                    : const Icon(
                        Icons.build_circle_outlined,
                        size: 48,
                        color: AppColors.textMuted,
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  if (item.category != null)
                    Text(
                      item.category!.name,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${Formatters.formatCurrency(item.rentalPricePerDay)}/day',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.accent,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: item.isAvailable
                              ? AppColors.success.withAlpha(30)
                              : AppColors.error.withAlpha(30),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          item.isAvailable
                              ? '${item.availableQuantity} Avail'
                              : 'Out of Stock',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: item.isAvailable
                                ? AppColors.success
                                : AppColors.error,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
