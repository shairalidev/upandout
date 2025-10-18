import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:upandout/models/post.dart';
import 'package:upandout/models/category.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:4000/api';

  /*
  // === ORIGINAL BACKEND VERSION ===
  static Future<List<Post>> fetchPosts(String city, [String? tag]) async {
    final url = Uri.parse('$baseUrl/posts?city=$city${tag != null ? "&tag=$tag" : ""}');
    final res = await http.get(url);
    if (res.statusCode == 200) {
      List data = json.decode(res.body);
      return data.map((e) => Post.fromJson(e)).toList();
    } else {
      throw Exception('Failed to fetch posts');
    }
  }

  static Future<List<Category>> fetchCategories() async {
    final url = Uri.parse('$baseUrl/categories');
    final res = await http.get(url);
    if (res.statusCode == 200) {
      List data = json.decode(res.body);
      return data.map((e) => Category.fromJson(e)).toList();
    } else {
      throw Exception('Failed to fetch categories');
    }
  }
  */

  // === TEMPORARY MOCK VERSION USING UNSPLASH ===
  static Future<List<Post>> fetchPosts(String city, [String? tag]) async {
  await Future.delayed(const Duration(milliseconds: 500));

  final sampleImages = List.generate(
    10,
    (i) => Post(
      id: '$i',
      imageUrl:
          'https://picsum.photos/seed/${i + DateTime.now().millisecondsSinceEpoch}/600/800',
      caption: '${tag ?? city} vibe spot #$i',
      city: city,
      tags: [tag ?? 'vibes'],
    ),
  );

  return sampleImages;
}


  // === TEMPORARY MOCK CATEGORIES ===
  static Future<List<Category>> fetchCategories() async {
    await Future.delayed(const Duration(milliseconds: 300));
    final categories = [
      Category(name: 'Chill'),
      Category(name: 'Thrifting'),
      Category(name: 'Eats'),
      Category(name: 'Romance'),
      Category(name: 'More'),
    ];
    return categories;
  }
}
