import '../../core/network/dio_client.dart';
import '../models/reservation_model.dart';

class ReservationRemoteDatasource {
  final DioClient dioClient;

  ReservationRemoteDatasource({required this.dioClient});

  // Create Reservation
  Future<ReservationModel> createReservation({
    required String pickupDate,
    required String returnDate,
    String? notes,
    required List<Map<String, dynamic>> items,
  }) async {
    final response = await dioClient.dio.post(
      '/reservations',
      data: {
        'pickupDate': pickupDate,
        'returnDate': returnDate,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        'items': items,
      },
    );

    final data = response.data['data'] ?? response.data;
    return ReservationModel.fromJson(data);
  }

  // Get user reservations
  Future<Map<String, dynamic>> getReservations({
    int page = 1,
    int pageSize = 10,
    String? status,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (status != null && status.isNotEmpty && status != 'ALL') {
      queryParams['status'] = status;
    }

    final response = await dioClient.dio.get(
      '/reservations',
      queryParameters: queryParams,
    );

    final res = response.data;
    final itemsJson = res['data'] ?? res;
    List<ReservationModel> items = [];
    if (itemsJson is List) {
      items = itemsJson.map((j) => ReservationModel.fromJson(j)).toList();
    }

    final meta = res['meta'] ?? {};
    return {
      'items': items,
      'total': meta['total'] ?? items.length,
      'totalPages': meta['totalPages'] ?? 1,
    };
  }

  // Get single reservation detail
  Future<ReservationModel> getReservationDetail(String id) async {
    final response = await dioClient.dio.get('/reservations/$id');
    final data = response.data['data'] ?? response.data;
    return ReservationModel.fromJson(data);
  }

  // Cancel reservation
  Future<ReservationModel> cancelReservation(String id) async {
    final response = await dioClient.dio.patch('/reservations/$id/cancel');
    final data = response.data['data'] ?? response.data;
    return ReservationModel.fromJson(data);
  }
}
