import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:chat_app/services/theme_service.dart';
import 'chat.dart';
import 'package:chat_app/services/callSignup.dart';
import 'login.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  String? _passwordError;

  Future<void> _signUpUser() async {
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (firstName.isEmpty ||
        lastName.isEmpty ||
        email.isEmpty ||
        password.isEmpty ||
        confirmPassword.isEmpty) {
      _showSnackBar("All fields are required");
      return;
    }

    if (password != confirmPassword) {
      setState(() => _passwordError = "Passwords do not match");
      return;
    } else {
      setState(() => _passwordError = null);
    }

    setState(() => _isLoading = true);

    try {
      final data = await signupUser(
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      );

      setState(() => _isLoading = false);

      _showSnackBar(data["message"] ?? "Signup successful!");

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    } catch (e) {
      setState(() => _isLoading = false);
      _showSnackBar(e.toString().replaceFirst("Exception: ", ""));
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = ThemeService.currentTheme;
    final txtColor = ThemeService.getTextColor(theme);
    final inputColor = ThemeService.getInputColor(theme);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(gradient: ThemeService.getGradient(theme)),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SvgPicture.asset('assets/icons/logo.svg', height: 80),
                const SizedBox(height: 32),

                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Sign Up',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                      color: txtColor,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                TextField(
                  controller: _firstNameController,
                  style: TextStyle(
                    color: theme == AppTheme.light ||
                        theme == AppTheme.valentine ||
                        theme == AppTheme.aqua
                        ? Colors.black
                        : Colors.white,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Enter first name',
                    filled: true,
                    fillColor: inputColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(25),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  ),
                ),
                const SizedBox(height: 16),

                TextField(
                  controller: _lastNameController,
                  style: TextStyle(
                    color: theme == AppTheme.light ||
                        theme == AppTheme.valentine ||
                        theme == AppTheme.aqua
                        ? Colors.black
                        : Colors.white,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Enter last name',
                    filled: true,
                    fillColor: inputColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(25),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  ),
                ),
                const SizedBox(height: 16),

                TextField(
                  controller: _emailController,
                  style: TextStyle(
                    color: theme == AppTheme.light ||
                        theme == AppTheme.valentine ||
                        theme == AppTheme.aqua
                        ? Colors.black
                        : Colors.white,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Enter email',
                    filled: true,
                    fillColor: inputColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(25),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  ),
                ),
                const SizedBox(height: 16),

                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  style: TextStyle(
                    color: theme == AppTheme.light ||
                        theme == AppTheme.valentine ||
                        theme == AppTheme.aqua
                        ? Colors.black
                        : Colors.white,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Password',
                    filled: true,
                    fillColor: inputColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(25),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  ),
                ),
                const SizedBox(height: 16),

                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: _confirmPasswordController,
                      obscureText: true,
                      style: TextStyle(
                        color: theme == AppTheme.light ||
                            theme == AppTheme.valentine ||
                            theme == AppTheme.aqua
                            ? Colors.black
                            : Colors.white,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Confirm Password',
                        filled: true,
                        fillColor: inputColor,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(25),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 14),
                      ),
                    ),

                    if (_passwordError != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 6, left: 8),
                        child: Text(
                          _passwordError!,
                          style: const TextStyle(
                              color: Colors.redAccent, fontSize: 12),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _signUpUser,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ThemeService.getButtonColor(theme),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                        : Text(
                      'SIGN UP',
                      style: TextStyle(
                        color: theme == AppTheme.cyberpunk ||
                            theme == AppTheme.forest
                            ? Colors.black87
                            : Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 48),

                Text(
                  'T&C',
                  style: TextStyle(
                    color: txtColor.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
