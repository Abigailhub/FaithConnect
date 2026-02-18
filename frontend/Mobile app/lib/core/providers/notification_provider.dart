import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';

/// Notification provider for managing notification state
class NotificationProvider with ChangeNotifier {
  final ApiService _apiService;

  List<NotificationModel> _notifications = [];
  List<NotificationModel> _filteredNotifications = [];
  bool _isLoading = false;
  String? _error;
  String _selectedFilter = 'All';
  int _unreadCount = 0;
  int _currentPage = 1;
  int _totalPages = 1;
  bool _hasMore = true;

  NotificationProvider({ApiService? apiService})
    : _apiService = apiService ?? ApiService();

  List<NotificationModel> get notifications => _notifications;
  List<NotificationModel> get filteredNotifications => _filteredNotifications;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedFilter => _selectedFilter;
  int get unreadCount => _unreadCount;
  bool get hasMore => _hasMore;

  /// Fetch notifications from API (if endpoint exists)
  Future<void> fetchNotifications({int page = 1, bool refresh = false}) async {
    if (_isLoading) return;

    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
    }

    if (!_hasMore && !refresh) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Try to fetch from API
      print('Fetching notifications from API...');
      final response = await _apiService.get(
        '/notifications?page=$page&limit=20',
      );

      print('Notifications API response: $response');

      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>?;
        if (data != null) {
          final notificationsList = data['notifications'] as List<dynamic>?;
          print('Notifications list: $notificationsList');
          if (notificationsList != null && notificationsList.isNotEmpty) {
            final newNotifications = notificationsList
                .map(
                  (n) => NotificationModel.fromJson(n as Map<String, dynamic>),
                )
                .toList();

            if (refresh || page == 1) {
              _notifications = newNotifications;
            } else {
              _notifications.addAll(newNotifications);
            }

            final pagination = data['pagination'] as Map<String, dynamic>?;
            if (pagination != null) {
              _currentPage = pagination['page'] as int? ?? 1;
              _totalPages = pagination['totalPages'] as int? ?? 1;
              _hasMore = _currentPage < _totalPages;
            }
          } else {
            print('No notifications found');
            _notifications = [];
          }
        }
        _updateUnreadCount();
        _applyFilters();
      } else {
        // API error - show empty list
        print('API returned error: ${response}');
        _notifications = [];
      }
    } catch (e) {
      // API error - show empty list
      print('Error fetching notifications: $e');
      _notifications = [];
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Load mock notifications for offline/development mode
  void _loadMockNotifications() {
    _notifications = NotificationModel.mockList;
    _updateUnreadCount();
    _applyFilters();
    notifyListeners();
  }

  void _updateUnreadCount() {
    _unreadCount = _notifications.where((n) => !n.isRead).length;
  }

  void setFilter(String filter) {
    _selectedFilter = filter;
    _applyFilters();
    notifyListeners();
  }

  void _applyFilters() {
    final filterTypes = {
      'All': null,
      'Urgent': NotificationType.urgent,
      'Événement': NotificationType.event,
      'Info': NotificationType.info,
    };
    final targetType = filterTypes[_selectedFilter];

    if (targetType == null) {
      _filteredNotifications = List.from(_notifications);
    } else {
      _filteredNotifications = _notifications
          .where((n) => n.type == targetType)
          .toList();
    }
  }

  /// Mark notification as read
  Future<void> markAsRead(String id) async {
    try {
      // Try to call API if endpoint exists
      await _apiService.put('/notifications/$id/read');
    } catch (e) {
      // API might not exist, continue with local update
    }

    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      _updateUnreadCount();
      _applyFilters();
      notifyListeners();
    }
  }

  /// Mark all notifications as read
  Future<void> markAllAsRead() async {
    try {
      // Try to call API if endpoint exists
      await _apiService.put('/notifications/read-all');
    } catch (e) {
      // API might not exist, continue with local update
    }

    _notifications = _notifications
        .map((n) => n.copyWith(isRead: true))
        .toList();
    _updateUnreadCount();
    _applyFilters();
    notifyListeners();
  }

  Map<String, List<NotificationModel>> get groupByDate {
    final grouped = <String, List<NotificationModel>>{};
    for (final notification in _filteredNotifications) {
      final now = DateTime.now();
      final diff = now.difference(notification.createdAt);
      String key;
      if (diff.inDays == 0) {
        key = 'TODAY — ${_formatDate(now)}';
      } else if (diff.inDays == 1) {
        final yesterday = now.subtract(const Duration(days: 1));
        key = 'YESTERDAY — ${_formatDate(yesterday)}';
      } else {
        key = '${diff.inDays} DAYS AGO';
      }
      grouped.putIfAbsent(key, () => []).add(notification);
    }
    return grouped;
  }

  String _formatDate(DateTime date) {
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  Future<void> refreshNotifications() async {
    await fetchNotifications(refresh: true);
  }

  Future<void> loadMoreNotifications() async {
    if (_hasMore && !_isLoading) {
      await fetchNotifications(page: _currentPage + 1);
    }
  }
}
