import 'package:intl/intl.dart';

class Formatters {
  static String formatCurrency(dynamic amount) {
    if (amount == null) return '\$0.00';
    final double value = (amount is num)
        ? amount.toDouble()
        : double.tryParse(amount.toString()) ?? 0.0;
    return NumberFormat.currency(symbol: '\$', decimalDigits: 2).format(value);
  }

  static String formatDate(dynamic date) {
    if (date == null) return '-';
    try {
      final DateTime dt = date is DateTime
          ? date
          : DateTime.parse(date.toString());
      return DateFormat('MMM dd, yyyy').format(dt);
    } catch (_) {
      return date.toString();
    }
  }

  static String formatDateTime(dynamic date) {
    if (date == null) return '-';
    try {
      final DateTime dt = date is DateTime
          ? date
          : DateTime.parse(date.toString());
      return DateFormat('MMM dd, yyyy HH:mm').format(dt);
    } catch (_) {
      return date.toString();
    }
  }
}
