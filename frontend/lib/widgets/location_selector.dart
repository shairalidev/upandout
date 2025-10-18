import 'package:flutter/material.dart';
import 'dart:math';

class LocationSelector extends StatefulWidget {
  final Function(String country, String state, String city) onLocationChanged;

  const LocationSelector({super.key, required this.onLocationChanged});

  @override
  State<LocationSelector> createState() => _LocationSelectorState();
}

class _LocationSelectorState extends State<LocationSelector> {
  String? selectedCountry;
  String? selectedState;
  String? selectedCity;

  // Demo location data
  final Map<String, Map<String, List<String>>> locations = {
    "USA": {
      "Texas": ["Dallas", "Austin", "Houston"],
      "California": ["Los Angeles", "San Francisco", "San Diego"],
    },
    "UK": {
      "England": ["London", "Manchester", "Liverpool"],
      "Scotland": ["Edinburgh", "Glasgow"],
    },
    "Italy": {
      "Sicily": ["Palermo", "Catania"],
      "Lombardy": ["Milan", "Bergamo"],
    }
  };

  void _setRandomDefault() {
    final random = Random();
    final countries = locations.keys.toList();
    final country = countries[random.nextInt(countries.length)];
    final states = locations[country]!.keys.toList();
    final state = states[random.nextInt(states.length)];
    final cities = locations[country]![state]!;
    final city = cities[random.nextInt(cities.length)];

    selectedCountry = country;
    selectedState = state;
    selectedCity = city;

    widget.onLocationChanged(country, state, city);
  }

  @override
  void initState() {
    super.initState();
    _setRandomDefault();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        DropdownButton<String>(
          dropdownColor: Colors.black,
          value: selectedCountry,
          hint: const Text("Country", style: TextStyle(color: Colors.white70)),
          style: const TextStyle(color: Colors.white),
          items: locations.keys
              .map((c) => DropdownMenuItem(value: c, child: Text(c)))
              .toList(),
          onChanged: (val) {
            setState(() {
              selectedCountry = val;
              selectedState = null;
              selectedCity = null;
            });
          },
        ),
        const SizedBox(width: 8),
        if (selectedCountry != null)
          DropdownButton<String>(
            dropdownColor: Colors.black,
            value: selectedState,
            hint: const Text("State", style: TextStyle(color: Colors.white70)),
            style: const TextStyle(color: Colors.white),
            items: locations[selectedCountry]!.keys
                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                .toList(),
            onChanged: (val) {
              setState(() {
                selectedState = val;
                selectedCity = null;
              });
            },
          ),
        const SizedBox(width: 8),
        if (selectedState != null)
          DropdownButton<String>(
            dropdownColor: Colors.black,
            value: selectedCity,
            hint: const Text("City", style: TextStyle(color: Colors.white70)),
            style: const TextStyle(color: Colors.white),
            items: locations[selectedCountry]![selectedState]!
                .map((city) => DropdownMenuItem(value: city, child: Text(city)))
                .toList(),
            onChanged: (val) {
              setState(() {
                selectedCity = val;
              });
              if (val != null) {
                widget.onLocationChanged(
                  selectedCountry!,
                  selectedState!,
                  val,
                );
              }
            },
          ),
      ],
    );
  }
}
