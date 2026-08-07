import '../../domain/entities/reservation_entity.dart';
import 'equipment_model.dart';
import 'user_model.dart';

class ReservationItemModel extends ReservationItemEntity {
  const ReservationItemModel({
    required super.id,
    required super.reservationId,
    required super.equipmentId,
    super.equipment,
    required super.quantity,
    required super.unitPrice,
    required super.subtotal,
    required super.deposit,
  });

  factory ReservationItemModel.fromJson(Map<String, dynamic> json) {
    var rawUnitPrice = json['unitPrice'] ?? json['unit_price'] ?? 0;
    var rawSubtotal = json['subtotal'] ?? 0;
    var rawDeposit = json['deposit'] ?? 0;

    EquipmentModel? eq;
    if (json['equipment'] != null) {
      eq = EquipmentModel.fromJson(json['equipment']);
    }

    return ReservationItemModel(
      id: json['id'] ?? '',
      reservationId: json['reservationId'] ?? json['reservation_id'] ?? '',
      equipmentId: json['equipmentId'] ?? json['equipment_id'] ?? '',
      equipment: eq,
      quantity: json['quantity'] ?? 1,
      unitPrice: (rawUnitPrice is num) ? rawUnitPrice.toDouble() : double.tryParse(rawUnitPrice.toString()) ?? 0.0,
      subtotal: (rawSubtotal is num) ? rawSubtotal.toDouble() : double.tryParse(rawSubtotal.toString()) ?? 0.0,
      deposit: (rawDeposit is num) ? rawDeposit.toDouble() : double.tryParse(rawDeposit.toString()) ?? 0.0,
    );
  }
}

class ReservationModel extends ReservationEntity {
  const ReservationModel({
    required super.id,
    required super.reservationNumber,
    required super.customerId,
    super.customer,
    super.approvedBy,
    required super.status,
    required super.pickupDate,
    required super.returnDate,
    super.actualReturnDate,
    required super.totalAmount,
    required super.depositTotal,
    super.notes,
    super.rejectionReason,
    required super.items,
    required super.createdAt,
  });

  factory ReservationModel.fromJson(Map<String, dynamic> json) {
    var rawTotal = json['totalAmount'] ?? json['total_amount'] ?? 0;
    var rawDepositTotal = json['depositTotal'] ?? json['deposit_total'] ?? 0;

    UserModel? cust;
    if (json['customer'] != null) {
      cust = UserModel.fromJson(json['customer']);
    }

    List<ReservationItemEntity> itemList = [];
    if (json['items'] != null && json['items'] is List) {
      itemList = (json['items'] as List)
          .map((i) => ReservationItemModel.fromJson(i))
          .toList();
    }

    return ReservationModel(
      id: json['id'] ?? '',
      reservationNumber: json['reservationNumber'] ?? json['reservation_number'] ?? '',
      customerId: json['customerId'] ?? json['customer_id'] ?? '',
      customer: cust,
      approvedBy: json['approvedBy'] ?? json['approved_by'],
      status: json['status'] ?? 'PENDING',
      pickupDate: json['pickupDate'] ?? json['pickup_date'] ?? '',
      returnDate: json['returnDate'] ?? json['return_date'] ?? '',
      actualReturnDate: json['actualReturnDate'] ?? json['actual_return_date'],
      totalAmount: (rawTotal is num) ? rawTotal.toDouble() : double.tryParse(rawTotal.toString()) ?? 0.0,
      depositTotal: (rawDepositTotal is num) ? rawDepositTotal.toDouble() : double.tryParse(rawDepositTotal.toString()) ?? 0.0,
      notes: json['notes'],
      rejectionReason: json['rejectionReason'] ?? json['rejection_reason'],
      items: itemList,
      createdAt: json['createdAt'] ?? json['created_at'] ?? '',
    );
  }
}
