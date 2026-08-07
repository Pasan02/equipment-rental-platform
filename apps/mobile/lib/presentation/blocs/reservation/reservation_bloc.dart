import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/datasources/reservation_remote_datasource.dart';
import '../../../domain/entities/reservation_entity.dart';
import 'reservation_event.dart';
import 'reservation_state.dart';

class ReservationBloc extends Bloc<ReservationEvent, ReservationState> {
  final ReservationRemoteDatasource datasource;

  ReservationBloc({required this.datasource}) : super(ReservationInitial()) {
    on<ReservationFetchRequested>(_onReservationFetchRequested);
    on<ReservationCreateRequested>(_onReservationCreateRequested);
    on<ReservationCancelRequested>(_onReservationCancelRequested);
    on<ReservationApproveRequested>(_onReservationApproveRequested);
    on<ReservationRejectRequested>(_onReservationRejectRequested);
    on<ReservationActivateRequested>(_onReservationActivateRequested);
    on<ReservationReturnRequested>(_onReservationReturnRequested);
  }

  Future<void> _onReservationFetchRequested(
    ReservationFetchRequested event,
    Emitter<ReservationState> emit,
  ) async {
    if (!event.isRefresh) {
      emit(ReservationLoading());
    }

    try {
      final res = await datasource.getReservations(
        page: 1,
        pageSize: 50,
        status: event.statusFilter,
      );

      final items = res['items'] as List<ReservationEntity>;
      emit(
        ReservationLoaded(
          reservations: items,
          activeStatusFilter: event.statusFilter ?? 'ALL',
        ),
      );
    } catch (e) {
      emit(ReservationFailure(message: 'Failed to fetch reservations: $e'));
    }
  }

  Future<void> _onReservationCreateRequested(
    ReservationCreateRequested event,
    Emitter<ReservationState> emit,
  ) async {
    emit(ReservationLoading());
    try {
      final res = await datasource.createReservation(
        pickupDate: event.pickupDate,
        returnDate: event.returnDate,
        notes: event.notes,
        items: event.items,
      );

      emit(ReservationCreateSuccess(reservation: res));
    } catch (e) {
      emit(ReservationFailure(message: 'Failed to submit reservation: $e'));
    }
  }

  Future<void> _onReservationCancelRequested(
    ReservationCancelRequested event,
    Emitter<ReservationState> emit,
  ) async {
    try {
      await datasource.cancelReservation(event.reservationId);
      emit(const ReservationActionSuccess(message: 'Reservation cancelled successfully'));
      add(const ReservationFetchRequested());
    } catch (e) {
      emit(ReservationFailure(message: 'Failed to cancel reservation: $e'));
    }
  }

  Future<void> _onReservationApproveRequested(
    ReservationApproveRequested event,
    Emitter<ReservationState> emit,
  ) async {
    try {
      await datasource.approveReservation(event.reservationId, notes: event.notes);
      emit(const ReservationActionSuccess(message: 'Reservation approved successfully'));
      add(const ReservationFetchRequested());
    } catch (e) {
      emit(ReservationFailure(message: 'Failed to approve reservation: $e'));
    }
  }

  Future<void> _onReservationRejectRequested(
    ReservationRejectRequested event,
    Emitter<ReservationState> emit,
  ) async {
    try {
      await datasource.rejectReservation(event.reservationId, reason: event.reason);
      emit(const ReservationActionSuccess(message: 'Reservation rejected successfully'));
      add(const ReservationFetchRequested());
    } catch (e) {
      emit(ReservationFailure(message: 'Failed to reject reservation: $e'));
    }
  }

  Future<void> _onReservationActivateRequested(
    ReservationActivateRequested event,
    Emitter<ReservationState> emit,
  ) async {
    try {
      await datasource.activateReservation(event.reservationId);
      emit(const ReservationActionSuccess(message: 'Pickup activated successfully'));
      add(const ReservationFetchRequested());
    } catch (e) {
      emit(ReservationFailure(message: 'Failed to activate pickup: $e'));
    }
  }

  Future<void> _onReservationReturnRequested(
    ReservationReturnRequested event,
    Emitter<ReservationState> emit,
  ) async {
    try {
      await datasource.returnReservation(event.reservationId, notes: event.notes);
      emit(const ReservationActionSuccess(message: 'Return processed successfully'));
      add(const ReservationFetchRequested());
    } catch (e) {
      emit(ReservationFailure(message: 'Failed to process return: $e'));
    }
  }
}
