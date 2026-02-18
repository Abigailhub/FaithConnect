import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/secure_storage_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _apiService;
  final SecureStorageService _storageService;

  UserModel? _user;
  bool _isLoading = false;
  String? _error;
  bool _isAuthenticated = false;

  AuthProvider({ApiService? apiService, SecureStorageService? storageService})
    : _apiService = apiService ?? ApiService(),
      _storageService = storageService ?? SecureStorageService();

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _isAuthenticated;

  /// Login with email and password
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/auth/login',
        body: {'email': email, 'password': password},
      );

      // Backend returns: { success: true, message: "...", data: { token, user } }
      final data = response['data'] as Map<String, dynamic>?;

      if (response['success'] == true &&
          data != null &&
          data['token'] != null) {
        final token = data['token'] as String;
        _apiService.setAuthToken(token);

        // Save token securely
        await _storageService.saveAuthToken(token);

        // Parse user data from response
        if (data['user'] != null) {
          _user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
        }

        _isAuthenticated = true;

        // Save auth state
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('is_authenticated', true);

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'] as String? ?? 'Connection error.';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e is ApiException ? e.message : 'Connection error.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Register a new user
  Future<bool> register({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    String? organizationId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/auth/register',
        body: {
          'firstName': firstName,
          'lastName': lastName,
          'email': email,
          'password': password,
          'role': 'member',
          if (organizationId != null)
            'organizationId': int.parse(organizationId),
        },
      );

      // Backend returns: { success: true, message: "...", data: { id, email, ... } }
      if (response['success'] == true) {
        // Registration successful but no token returned
        // User needs to login manually
        _isLoading = false;
        notifyListeners();

        // Return true but set message to prompt login
        _error = 'Account created. Please login.';
        return true;
      } else {
        _error = response['message'] as String? ?? 'Registration error.';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e is ApiException
          ? e.message
          : 'Registration failed. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Verify token and fetch current user
  Future<bool> verifyToken() async {
    try {
      final token = await _storageService.getAuthToken();
      if (token == null) {
        return false;
      }

      _apiService.setAuthToken(token);
      final response = await _apiService.get('/auth/verify');

      // Backend returns: { success: true, message: "...", data: { user } }
      final data = response['data'] as Map<String, dynamic>?;

      if (response['success'] == true && data != null && data['user'] != null) {
        _user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
        _isAuthenticated = true;
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      await logout();
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    _user = null;
    _isAuthenticated = false;
    _apiService.clearAuthToken();
    await _storageService.clearAll();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('is_authenticated');

    notifyListeners();
  }

  /// Check if user is already authenticated
  Future<void> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _isAuthenticated = prefs.getBool('is_authenticated') ?? false;

    if (_isAuthenticated) {
      await verifyToken();
    }
    notifyListeners();
  }
}
