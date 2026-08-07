import 'package:equatable/equatable.dart';

class CategoryEntity extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String slug;
  final String? imageUrl;

  const CategoryEntity({
    required this.id,
    required this.name,
    this.description,
    required this.slug,
    this.imageUrl,
  });

  @override
  List<Object?> get props => [id, name, description, slug, imageUrl];
}
