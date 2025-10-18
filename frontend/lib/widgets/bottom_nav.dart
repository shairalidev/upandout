import 'package:flutter/material.dart';

class BottomNav extends StatelessWidget {
  const BottomNav({super.key});

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      backgroundColor: Colors.black,
      selectedItemColor: Colors.white,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
      items: const [
        BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: "Home"),
        BottomNavigationBarItem(icon: Icon(Icons.explore_rounded), label: "Explore"),
        BottomNavigationBarItem(icon: Icon(Icons.add_circle_outline), label: "Add"),
        BottomNavigationBarItem(icon: Icon(Icons.favorite_outline), label: "Likes"),
        BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: "Profile"),
      ],
    );
  }
}
