import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:upandout/providers/data_provider.dart';
import 'package:upandout/widgets/bottom_nav.dart';
import 'package:upandout/widgets/category_chip_list.dart';
import 'package:upandout/widgets/image_card.dart';
import 'package:upandout/widgets/search_bar.dart';
import 'package:upandout/screens/image_detail_screen.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() =>
        Provider.of<DataProvider>(context, listen: false).loadInitialData());
  }

  void _onSearch(String query) {
    if (query.isNotEmpty) {
      Provider.of<DataProvider>(context, listen: false).filterByTag(query);
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = Provider.of<DataProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text("Dallas • World view"),
        actions: [
          IconButton(
            icon: const Icon(Icons.map_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          SearchBarWidget(controller: _searchController, onSearch: _onSearch),
          CategoryChipList(
            categories: data.categories,
            onSelected: (tag) => data.filterByTag(tag),
          ),
          Expanded(
            child: data.loading
                ? const Center(child: CircularProgressIndicator())
                : MasonryGridView.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    padding: const EdgeInsets.all(12),
                    itemCount: data.posts.length,
                    itemBuilder: (context, index) {
                      final post = data.posts[index];
                      return GestureDetector(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ImageDetailScreen(post: post),
                          ),
                        ),
                        child: Hero(
                          tag: post.id,
                          child: ImageCard(post: post),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      bottomNavigationBar: const BottomNav(),
    );
  }
}
