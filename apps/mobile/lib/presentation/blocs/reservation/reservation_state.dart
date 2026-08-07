import 'package:equatable/equatable.dart';
import '../../../domain/entities/reservation_entity.dart';

abstract class ReservationState extends Equatable {
  const ReservationState();

  @override
  List<Object?> get props => [];
}

class ReservationInitial extends ReservationState {}

class ReservationLoading extends ReservationState {}

class ReservationLoaded extends ReservationState {
  final List<ReservationEntity> reservations;
  final String activeStatusFilter;

  const ReservationLoaded({
    required this.reservations,
    this.activeStatusFilter = 'ALL',
  });

  @override
  List<Object?> get props => [reservations, activeStatusFilter];
}

class ReservationCreateSuccess extends ReservationState {
  final ReservationEntity reservation;

  const ReservationCreateSuccess({required this.reservation});

  @override
  List<Object?> get props => [reservation];
}

class ReservationActionSuccess extends ReservationState {
  final String message;

  const ReservationActionSuccess({required this.message});

  @override
  List<Object?> get props => [message];
}

class ReservationFailure extends ReservationState {
  final String message;

  const ReservationFailure({required this.message});

  @override
  List<Object?> get props => [message];
}
