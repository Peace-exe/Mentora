import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:chat_app/models/chatmsg.dart';
import 'package:chat_app/services/theme_service.dart';
import 'package:chat_app/widgets/msg_bubble.dart';
import 'package:chat_app/services/wsService.dart';
import 'login.dart';
import 'package:chat_app/constants/apiEndpoints.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  final ws = WebSocketService();

  List<ChatModel> messages = [];
  bool _showDrawer = false;
  bool connected = false;

  @override
  void initState() {
    super.initState();

    messages.add(ChatModel(text: 'How can I help you?', isUser: false));
    ThemeService.addListener(_onThemeChanged);

    ws.connect(apiEndpoints.wsURL);

    ws.onConnected = () {
      setState(() => connected = true);
    };

    ws.onDisconnected = () {
      setState(() => connected = false);
    };

    ws.onMessage = (msg) {
      if (msg["type"] == "ragResponse") {
        setState(() {
          messages.add(ChatModel(text: msg["data"].toString(), isUser: false));
        });
        _scrollToBottom();
      }
    };
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    final userMsg = _messageController.text.trim();

    setState(() {
      messages.add(ChatModel(text: userMsg, isUser: true));
    });

    ws.sendMessage(userMsg);
    _messageController.clear();
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    final theme = ThemeService.currentTheme;
    final txtColor = ThemeService.getTextColor(theme);
    final inputColor = ThemeService.getInputColor(theme);

    return WillPopScope(
      onWillPop: () async {
        ws.disconnect();
        return true;
      },
      child: Scaffold(
        body: Container(
          decoration: BoxDecoration(gradient: ThemeService.getGradient(theme)),
          child: Stack(
            children: [
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.only(top: 48, left: 16, right: 16, bottom: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        IconButton(
                          icon: SvgPicture.asset(
                            'assets/icons/Menu.svg',
                            width: 28,
                            height: 28,
                            colorFilter: ColorFilter.mode(txtColor, BlendMode.srcIn),
                          ),
                          onPressed: () => setState(() => _showDrawer = !_showDrawer),
                        ),
                        Icon(
                          connected ? Icons.wifi : Icons.wifi_off,
                          color: connected ? Colors.greenAccent : Colors.redAccent,
                          size: 28,
                        ),
                      ],
                    ),
                  ),

                  Expanded(
                    child: ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.all(16),
                      itemCount: messages.length,
                      itemBuilder: (context, index) {
                        return MessageBubble(
                          message: messages[index],
                          onRegenerate: null,
                        );
                      },
                    ),
                  ),

                  Container(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _messageController,
                            style: TextStyle(color: txtColor),
                            decoration: InputDecoration(
                              hintText: 'Enter query here...',
                              filled: true,
                              fillColor: inputColor,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(25),
                                borderSide: BorderSide.none,
                              ),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            ),
                            onSubmitted: (_) => _sendMessage(),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Container(
                          decoration: BoxDecoration(
                            color: ThemeService.getButtonColor(theme),
                            borderRadius: BorderRadius.circular(25),
                          ),
                          child: IconButton(
                            icon: const Icon(Icons.send),
                            onPressed: _sendMessage,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    ThemeService.removeListener(_onThemeChanged);
    super.dispose();
  }

  void _onThemeChanged() => setState(() {});
}