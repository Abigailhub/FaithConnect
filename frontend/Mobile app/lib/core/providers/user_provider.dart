import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

/// User provider for managing user profile state
class UserProvider with ChangeNotifier {
  final ApiService _apiService;

  UserModel? _user;
  bool _isLoading = false;
  String? _error;
  String _selectedLanguage = 'Français';
  String _selectedAppearance = 'Système';
  bool _pushNotificationsEnabled = true;

  UserProvider({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedLanguage => _selectedLanguage;
  String get selectedAppearance => _selectedAppearance;
  bool get pushNotificationsEnabled => _pushNotificationsEnabled;

  /// Fetch user profile from API
  Future<void> fetchUserProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/users/me');

      // Backend returns: { success: true, data: { user } }
      final data = response['data'] as Map<String, dynamic>?;
      
      if (response['success'] == true && data != null && data['user'] != null) {
        _user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      } else {
        _error =
            response['message'] as String? ??
            'Erreur lors du chargement du profil';
      }
    } catch (e) {
      _error = e is ApiException ? e.message : 'Erreur de connexion';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Load mock user for offline/development mode
  void _loadMockUser() {
    _user = UserModel.mock;
    notifyListeners();
  }

  void setLanguage(String language) {
    _selectedLanguage = language;
    notifyListeners();
  }

  void setAppearance(String appearance) {
    _selectedAppearance = appearance;
    notifyListeners();
  }

  void setPushNotifications(bool enabled) {
    _pushNotificationsEnabled = enabled;
    notifyListeners();
  }

  /// Update user profile
  Future<bool> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? avatarUrl,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put(
        '/users/me',
        body: {
          if (firstName != null) 'firstName': firstName,
          if (lastName != null) 'lastName': lastName,
          if (phone != null) 'phone': phone,
          if (avatarUrl != null) 'avatarUrl': avatarUrl,
        },
      );

      // Backend returns: { success: true, data: { user } }
      final data = response['data'] as Map<String, dynamic>?;
      
      if (response['success'] == true && data != null && data['user'] != null) {
        _user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error =
            response['message'] as String? ??
            'Erreur lors de la mise à jour du profil';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e is ApiException ? e.message : 'Erreur de connexion';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Change password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post(
        '/users/change-password',
        body: {'currentPassword': currentPassword, 'newPassword': newPassword},
      );

      if (response['success'] == true) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error =
            response['message'] as String? ??
            'Erreur lors du changement de mot de passe';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e is ApiException ? e.message : 'Erreur de connexion';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Refresh user data
  Future<void> refreshUser() async {
    await fetchUserProfile();
  }
}
