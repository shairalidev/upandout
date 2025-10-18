import 'package:flutter/material.dart';
import 'package:upandout/models/category.dart';

class CategoryChipList extends StatelessWidget {
  final List<Category> categories;
  final Function(String) onSelected;

  const CategoryChipList({
    super.key,
    required this.categories,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 50,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final cat = categories[index];
          return ChoiceChip(
            label: Text(cat.name),
            selected: false,
            onSelected: (_) => onSelected(cat.name),
          );
        },
      ),
    );
  }
}
