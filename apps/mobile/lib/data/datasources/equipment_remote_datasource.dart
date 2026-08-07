import '../../core/network/dio_client.dart';
import '../models/category_model.dart';
import '../models/equipment_model.dart';

class EquipmentRemoteDatasource {
  final DioClient dioClient;

  EquipmentRemoteDatasource({required this.dioClient});

  // Get categories
  Future<List<CategoryModel>> getCategories() async {
    final response = await dioClient.dio.get('/categories');
    final data = response.data['data'] ?? response.data;
    if (data is List) {
      return data.map((json) => CategoryModel.fromJson(json)).toList();
    }
    return [];
  }

  // Get equipment list with search, category filter, pagination
  Future<Map<String, dynamic>> getEquipmentList({
    int page = 1,
    int pageSize = 10,
    String? search,
    String? categoryId,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (search != null && search.isNotEmpty) queryParams['search'] = search;
    if (categoryId != null && categoryId.isNotEmpty) queryParams['categoryId'] = categoryId;

    final response = await dioClient.dio.get(
      '/equipment',
      queryParameters: queryParams,
    );

    final res = response.data;
    final itemsJson = res['data'] ?? res;
    List<EquipmentModel> items = [];
    if (itemsJson is List) {
      items = itemsJson.map((json) => EquipmentModel.fromJson(json)).toList();
    }

    final meta = res['meta'] ?? {};
    final total = meta['total'] ?? items.length;
    final totalPages = meta['totalPages'] ?? 1;

    return {
      'items': items,
      'total': total,
      'totalPages': totalPages,
    };
  }

  // Get single equipment detail
  Future<EquipmentModel> getEquipmentDetail(String id) async {
    final response = await dioClient.dio.get('/equipment/$id');
    final data = response.data['data'] ?? response.data;
    return EquipmentModel.fromJson(data);
  }

  // Check equipment date range availability
  Future<Map<String, dynamic>> checkAvailability({
    required String equipmentId,
    required String pickupDate,
    required String returnDate,
    int quantity = 1,
  }) async {
    final response = await dioClient.dio.get(
      '/equipment/$equipmentId/availability',
      queryParameters: {
        'pickupDate': pickupDate,
        'returnDate': returnDate,
        'quantity': quantity,
      },
    );
    return response.data['data'] ?? response.data;
  }
}
