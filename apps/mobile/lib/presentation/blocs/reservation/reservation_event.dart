import 'package:equatable/equatable.dart';

abstract class ReservationEvent extends Equatable {
  const ReservationEvent();

  @override
  List<Object?> get props => [];
}

class ReservationFetchRequested extends ReservationEvent {
  final String? statusFilter;
  final bool isRefresh;

  const ReservationFetchRequested({this.statusFilter, this.isRefresh = false});

  @override
  List<Object?> get props => [statusFilter, isRefresh];
}

class ReservationCreateRequested extends ReservationEvent {
  final String pickupDate;
  final String returnDate;
  final String? notes;
  final List<Map<String, dynamic>> items;

  const ReservationCreateRequested({
    required this.pickupDate,
    required this.returnDate,
    this.notes,
    required this.items,
  });

  @override
  List<Object?> get props => [pickupDate, returnDate, notes, items];
}

class ReservationCancelRequested extends ReservationEvent {
  final String reservationId;

  const ReservationCancelRequested(this.reservationId);

  @override
  List<Object?> get props => [reservationId];
}
