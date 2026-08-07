import 'package:equatable/equatable.dart';
import 'equipment_entity.dart';
import 'user_entity.dart';

class ReservationItemEntity extends Equatable {
  final String id;
  final String reservationId;
  final String equipmentId;
  final EquipmentEntity? equipment;
  final int quantity;
  final double unitPrice;
  final double subtotal;
  final double deposit;

  const ReservationItemEntity({
    required this.id,
    required this.reservationId,
    required this.equipmentId,
    this.equipment,
    required this.quantity,
    required this.unitPrice,
    required this.subtotal,
    required this.deposit,
  });

  @override
  List<Object?> get props => [
        id,
        reservationId,
        equipmentId,
        equipment,
        quantity,
        unitPrice,
        subtotal,
        deposit,
      ];
}

class ReservationEntity extends Equatable {
  final String id;
  final String reservationNumber;
  final String customerId;
  final UserEntity? customer;
  final String? approvedBy;
  final String status; // PENDING | APPROVED | REJECTED | ACTIVE | RETURNED | CANCELLED
  final String pickupDate;
  final String returnDate;
  final String? actualReturnDate;
  final double totalAmount;
  final double depositTotal;
  final String? notes;
  final String? rejectionReason;
  final List<ReservationItemEntity> items;
  final String createdAt;

  const ReservationEntity({
    required this.id,
    required this.reservationNumber,
    required this.customerId,
    this.customer,
    this.approvedBy,
    required this.status,
    required this.pickupDate,
    required this.returnDate,
    this.actualReturnDate,
    required this.totalAmount,
    required this.depositTotal,
    this.notes,
    this.rejectionReason,
    required this.items,
    required this.createdAt,
  });

  bool get canCancel => status == 'PENDING' || status == 'APPROVED';

  @override
  List<Object?> get props => [
        id,
        reservationNumber,
        customerId,
        customer,
        approvedBy,
        status,
        pickupDate,
        returnDate,
        actualReturnDate,
        totalAmount,
        depositTotal,
        notes,
        rejectionReason,
        items,
        createdAt,
      ];
}
