import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UserStore extends StateNotifier<Map<String, dynamic>?> {
  UserStore() : super(null) {
    _load();
  }

  // Load persisted user on app startup
  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('user_data');

    if (raw != null) {
      state = jsonDecode(raw);
      _logState("Loaded user from storage");
    }
  }

  // =====================================================
  //                     ADD USER
  // =====================================================
  Future<void> addUser(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    state = user;
    await prefs.setString('user_data', jsonEncode(user));

    _logState("User added");
  }

  // =====================================================
  //                   REMOVE USER ONLY
  // =====================================================
  Future<void> removeUser() async {
    final prefs = await SharedPreferences.getInstance();
    state = null;
    await prefs.remove('user_data');

    _logState("User removed");
  }

  // =====================================================
  //                     CLEAR ALL
  // =====================================================
  Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    state = null;
    await prefs.clear();  // deletes everything in SharedPreferences

    _logState("All data cleared");
  }

  // =====================================================
  //                PRETTY JSON PRINTER
  // =====================================================
  String _prettyJson(Map<String, dynamic>? data) {
    const encoder = JsonEncoder.withIndent('  ');
    return encoder.convert(data);
  }

  // =====================================================
  //                DEBUG LOGGING METHOD
  // =====================================================
  void _logState(String label) {
    print("\n===== USER STORE UPDATE: $label =====");

    if (state == null) {
      print("null");
    } else {
      print(_prettyJson(state));
    }

    print("=====================================\n");
  }
}

final userProvider =
StateNotifierProvider<UserStore, Map<String, dynamic>?>(
      (ref) => UserStore(),
);
