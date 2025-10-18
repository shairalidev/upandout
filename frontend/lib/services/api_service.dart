import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:upandout/models/post.dart';
import 'package:upandout/models/category.dart';
import 'package:upandout/config.dart'; // import your key

class ApiService {
  static const String unsplashBase = 'https://api.unsplash.com';

  static Future<List<Post>> fetchPosts(String city, [String? tag]) async {
    final query = Uri.encodeComponent('${tag ?? "explore"} $city');
    final url = Uri.parse(
        '$unsplashBase/search/photos?query=$query&per_page=20&orientation=portrait&client_id=$UNSPLASH_ACCESS_KEY');

    try {
      final res = await http.get(url);
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final results = data['results'] as List;
        return results
            .map(
              (e) => Post(
                id: e['id'],
                imageUrl: e['urls']['regular'],
                caption: e['description'] ??
                    e['alt_description'] ??
                    '${tag ?? city} vibes',
                city: city,
                tags: [tag ?? 'explore'],
              ),
            )
            .toList();
      } else {
        print('Unsplash API error: ${res.statusCode}');
      }
    } catch (e) {
      print('Error fetching Unsplash data: $e');
    }

    // fallback placeholder images
    return List.generate(
      8,
      (i) => Post(
        id: '$i',
        imageUrl: 'https://picsum.photos/seed/${tag ?? city}$i/600/800',
        caption: '${tag ?? city} vibes #$i',
        city: city,
        tags: [tag ?? 'fallback'],
      ),
    );
  }

  static Future<List<Category>> fetchCategories() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return [
      Category(name: 'Chill'),
      Category(name: 'Eats'),
      Category(name: 'Romance'),
      Category(name: 'Nightlife'),
      Category(name: 'Thrifting'),
      Category(name: 'Adventure'),
    ];
  }
}
