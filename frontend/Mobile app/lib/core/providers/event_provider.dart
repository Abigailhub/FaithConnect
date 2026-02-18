import 'package:flutter/material.dart';
import '../models/event_model.dart';
import '../services/api_service.dart';

/// Event provider for managing event state
class EventProvider with ChangeNotifier {
  final ApiService _apiService;
  
  List<EventModel> _events = [];
  List<EventModel> _filteredEvents = [];
  bool _isLoading = false;
  String? _error;
  String _selectedCategory = 'Tout';
  String _searchQuery = '';
  int _currentPage = 1;
  int _totalPages = 1;
  bool _hasMore = true;

  EventProvider({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  List<EventModel> get events => _events;
  List<EventModel> get filteredEvents => _filteredEvents;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;
  bool get hasMore => _hasMore;

  /// Fetch events from API
  Future<void> fetchEvents({
    String status = 'upcoming',
    int page = 1,
    bool refresh = false,
  }) async {
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
      final queryParams = {
        'page': page.toString(),
        'limit': '10',
        'status': status,
      };

      if (_searchQuery.isNotEmpty) {
        queryParams['search'] = _searchQuery;
      }

      final queryString = queryParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');

      final response = await _apiService.get('/events?$queryString');

      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>?;
        if (data != null) {
          final eventsList = data['events'] as List<dynamic>?;
          if (eventsList != null) {
            final newEvents = eventsList
                .map((e) => EventModel.fromBackendJson(e as Map<String, dynamic>))
                .toList();

            if (refresh || page == 1) {
              _events = newEvents;
            } else {
              _events.addAll(newEvents);
            }

            final pagination = data['pagination'] as Map<String, dynamic>?;
            if (pagination != null) {
              _currentPage = pagination['page'] as int? ?? 1;
              _totalPages = pagination['totalPages'] as int? ?? 1;
              _hasMore = _currentPage < _totalPages;
            }
          }
        }
        _applyFilters();
      } else {
        _error = response['message'] as String? ?? 'Erreur lors du chargement des événements';
      }
    } catch (e) {
      _error = e is ApiException ? e.message : 'Erreur de connexion';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Load mock events for offline/development mode
  void _loadMockEvents() {
    _events = EventModel.mockList;
    _applyFilters();
  }

  void setCategory(String category) {
    _selectedCategory = category;
    _applyFilters();
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    _applyFilters();
    notifyListeners();
  }

  void _applyFilters() {
    _filteredEvents = _events.where((event) {
      final matchesCategory =
          _selectedCategory == 'Tout' ||
          event.category.toLowerCase().contains(_selectedCategory.toLowerCase());
      final matchesSearch = _searchQuery.isEmpty ||
          event.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          event.location.toLowerCase().contains(_searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }).toList();
  }

  EventModel? getEventById(String id) {
    try {
      return _events.firstWhere((e) => e.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Get event details from API
  Future<EventModel?> getEventDetails(String eventId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/events/$eventId');

      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>?;
        if (data != null && data['event'] != null) {
          final event = EventModel.fromBackendJson(data['event'] as Map<String, dynamic>);
          _isLoading = false;
          notifyListeners();
          return event;
        }
      }
      _error = response['message'] as String? ?? 'Erreur lors du chargement de l\'événement';
    } catch (e) {
      _error = e is ApiException ? e.message : 'Erreur de connexion';
    }

    _isLoading = false;
    notifyListeners();
    return getEventById(eventId);
  }

  /// Register for an event
  Future<bool> registerForEvent(String eventId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/events/$eventId/register');

      if (response['success'] == true) {
        // Update local event state
        final index = _events.indexWhere((e) => e.id == eventId);
        if (index != -1) {
          final event = _events[index];
          _events[index] = EventModel(
            id: event.id,
            title: event.title,
            description: event.description,
            category: event.category,
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            address: event.address,
            imageUrl: event.imageUrl,
            attendeesCount: (event.attendeesCount ?? 0) + 1,
            groups: event.groups,
            maxParticipants: event.maxParticipants,
            isUserRegistered: true,
          );
          _applyFilters();
        }
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'] as String? ?? 'Erreur lors de l\'inscription';
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

  /// Cancel registration for an event
  Future<bool> cancelRegistration(String eventId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.delete('/events/$eventId/register');

      if (response['success'] == true) {
        // Update local event state
        final index = _events.indexWhere((e) => e.id == eventId);
        if (index != -1) {
          final event = _events[index];
          _events[index] = EventModel(
            id: event.id,
            title: event.title,
            description: event.description,
            category: event.category,
            date: event.date,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            address: event.address,
            imageUrl: event.imageUrl,
            attendeesCount: (event.attendeesCount ?? 1) - 1,
            groups: event.groups,
            maxParticipants: event.maxParticipants,
            isUserRegistered: false,
          );
          _applyFilters();
        }
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'] as String? ?? 'Erreur lors de la désinscription';
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

  /// Refresh events
  Future<void> refreshEvents() async {
    await fetchEvents(refresh: true);
  }

  /// Load more events (pagination)
  Future<void> loadMoreEvents() async {
    if (_hasMore && !_isLoading) {
      await fetchEvents(page: _currentPage + 1);
    }
  }
}
