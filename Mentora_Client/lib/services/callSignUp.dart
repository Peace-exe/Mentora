import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:chat_app/constants/apiEndpoints.dart';

Future<Map<String, dynamic>> signupUser({
  required String firstName,
  required String lastName,
  required String email,
  required String password,
}) async {
  final url = Uri.parse("${apiEndpoints.baseURL}/signup");

  final response = await http.post(
    url,
    headers: {"Content-Type": "application/json"},
    body: jsonEncode({
      "firstName": firstName,
      "lastName": lastName,
      "email": email,
      "password": password,
    }),
  );

  final data = jsonDecode(response.body);

  if (response.statusCode < 200 || response.statusCode > 299) {
    throw Exception(data["message"] ?? "Signup failed");
  }


  return data;
}
