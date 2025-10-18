import 'package:flutter/material.dart';
import 'package:upandout/models/post.dart';
import 'package:upandout/models/category.dart';
import 'package:upandout/services/api_service.dart';

class DataProvider extends ChangeNotifier {
  List<Post> posts = [];
  List<Category> categories = [];
  String selectedCity = "Dallas";
  String? selectedTag;
  bool loading = false;

  Future<void> loadInitialData() async {
    loading = true;
    notifyListeners();

    categories = await ApiService.fetchCategories();
    posts = await ApiService.fetchPosts(selectedCity);
    
    loading = false;
    notifyListeners();
  }

  Future<void> filterByTag(String tag) async {
    selectedTag = tag;
    loading = true;
    notifyListeners();
    posts = await ApiService.fetchPosts(selectedCity, tag);
    loading = false;
    notifyListeners();
  }
}
