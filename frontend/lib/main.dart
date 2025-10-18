import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:upandout/providers/data_provider.dart';
import 'package:upandout/screens/home_screen.dart';
import 'package:upandout/theme.dart';

void main() {
  runApp(const UpAndOutApp());
}

class UpAndOutApp extends StatelessWidget {
  const UpAndOutApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => DataProvider()),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'UP&OUT',
        theme: AppTheme.darkTheme,
        home: const HomeScreen(),
      ),
    );
  }
}
