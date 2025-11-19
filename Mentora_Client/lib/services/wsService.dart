import 'dart:convert';
import 'package:web_socket_channel/io.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketService {
  WebSocketChannel? _channel;

  Function(Map<String, dynamic>)? onMessage;
  Function()? onConnected;
  Function()? onDisconnected;

  bool _manuallyClosed = false;

  /// Connect to WebSocket server
  void connect(String url) {
    _manuallyClosed = false;

    _channel = IOWebSocketChannel.connect(Uri.parse(url));

    _channel!.stream.listen(
          (data) {
        Map<String, dynamic> message;

        try {
          message = jsonDecode(data);
        } catch (_) {
          message = {"type": "raw", "data": data.toString()};
        }

        // Fire connected callback only on server's connected message
        if (message["type"] == "connected") {
          if (onConnected != null) onConnected!();
        }

        // General message handler
        if (onMessage != null) onMessage!(message);
      },
      onDone: () {
        if (!_manuallyClosed) {
          // Server or OS killed the connection
          if (onDisconnected != null) onDisconnected!();
        } else {
          // App intentionally disconnected (exit)
          if (onDisconnected != null) onDisconnected!();
        }
      },
      onError: (err) {
        print("WebSocket Error: $err");
      },
      cancelOnError: true,
    );
  }

  /// Send plain text message
  void sendMessage(String text) {
    if (_channel != null) {
      _channel!.sink.add(text);
    }
  }

  /// Called only when app is closing (WillPopScope)
  void disconnect() {
    _manuallyClosed = true;
    _channel?.sink.close();
  }
}
