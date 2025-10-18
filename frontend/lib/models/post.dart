class Post {
  final String id;
  final String imageUrl;
  final String caption;
  final String city;
  final List<String> tags;

  Post({
    required this.id,
    required this.imageUrl,
    required this.caption,
    required this.city,
    required this.tags,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['_id'] ?? '',
      imageUrl: json['imageUrl'] ?? '',
      caption: json['caption'] ?? '',
      city: json['city'] ?? '',
      tags: List<String>.from(json['tags'] ?? []),
    );
  }
}
