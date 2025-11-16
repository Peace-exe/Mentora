import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:chat_app/services/theme_service.dart';
import 'package:chat_app/services/callLogin.dart';
import 'package:chat_app/providers/token_provider.dart';
import 'signup.dart';
import 'chat.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:chat_app/providers/user_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  bool _keepMeSignedIn = false;

  final storage = const FlutterSecureStorage();

  // =====================================================
  //                 LOGIN FUNCTION
  // =====================================================
  Future<void> _loginUser() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      _showSnackBar("Please enter both email and password.");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final data = await loginUser(
        email: email,
        password: password,
        keepMeSignedIn: _keepMeSignedIn,
      );

      print("LOGIN RESPONSE → $data");

      if (!mounted) return;
      setState(() => _isLoading = false);

      // SUCCESS
      if (data.containsKey("data") && data.containsKey("tokens")) {
        final access = data["tokens"]["accessToken"];
        final refresh = data["tokens"]["refreshToken"];


        await storage.write(key: "accessToken", value: access);
        await storage.write(key: "refreshToken", value: refresh);

        final userData = data['data'];
        ref.read(userProvider.notifier).addUser(userData);

        _showSnackBar("Login Successful!");

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const ChatScreen()),
        );
        return;
      }

      // FAILURE FROM BACKEND
      _showSnackBar(data["message"] ?? "Invalid credentials");

    } catch (e) {
      if (!mounted) return;

      setState(() => _isLoading = false);

      print("LOGIN ERROR → $e");
      _showSnackBar("Error: $e");
    }
  }

  // =====================================================
  //                      SNACKBAR
  // =====================================================
  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.redAccent,
      ),
    );
  }

  // =====================================================
  //                      UI
  // =====================================================
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
                    'Log In',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                      color: txtColor,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // EMAIL FIELD
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
                    hintText: 'Email',
                    filled: true,
                    fillColor: inputColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(25),
                      borderSide: BorderSide.none,
                    ),
                    hintStyle: const TextStyle(color: Color(0xFF888888)),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // PASSWORD FIELD
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
                    hintStyle: const TextStyle(color: Color(0xFF888888)),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // LOGIN BUTTON
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _loginUser,
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
                      'LOG IN',
                      style: TextStyle(
                        color: theme == AppTheme.cyberpunk ||
                            theme == AppTheme.forest
                            ? Colors.black
                            : Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                Text(
                  'OR',
                  style: TextStyle(
                    color: txtColor.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 24),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const SignUpScreen(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF555555),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    child: const Text(
                      'SIGN UP',
                      style: TextStyle(
                        color: Colors.white,
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

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
