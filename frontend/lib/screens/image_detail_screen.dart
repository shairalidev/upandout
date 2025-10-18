import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:upandout/models/post.dart';

class ImageDetailScreen extends StatelessWidget {
  final Post post;

  const ImageDetailScreen({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          post.caption,
          style: const TextStyle(color: Colors.white),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: Center(
        child: Hero(
          tag: post.id,
          child: CachedNetworkImage(
            imageUrl: post.imageUrl,
            fit: BoxFit.contain,
            placeholder: (context, url) =>
                const CircularProgressIndicator(color: Colors.white),
          ),
        ),
      ),
    );
  }
}
