import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:upandout/models/post.dart';

class ImageCard extends StatelessWidget {
  final Post post;

  const ImageCard({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Stack(
        alignment: Alignment.bottomLeft,
        children: [
          CachedNetworkImage(
            imageUrl: post.imageUrl,
            fit: BoxFit.cover,
            placeholder: (context, url) =>
                Container(color: Colors.grey[900], height: 180),
          ),
          Container(
            width: double.infinity,
            color: Colors.black54,
            padding: const EdgeInsets.all(8),
            child: Text(
              post.caption,
              style: const TextStyle(fontSize: 13, color: Colors.white),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
