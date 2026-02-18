import 'package:flutter/material.dart';
import '../models/contribution_model.dart';
import '../services/api_service.dart';

/// Contribution provider for managing contribution/giving state
class ContributionProvider with ChangeNotifier {
  final ApiService _apiService;
  
  List<ContributionModel> _contributions = [];
  List<ContributionModel> _filteredContributions = [];
  bool _isLoading = false;
  String? _error;
  String _selectedFilter = 'Historique complet';
  final double _monthlyGoal = 600.0;
  double _monthlyTotal = 0.0;
  int _currentPage = 1;
  int _totalPages = 1;
  bool _hasMore = true;
  double _totalAmount = 0.0;

  ContributionProvider({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  List<ContributionModel> get contributions => _contributions;
  List<ContributionModel> get filteredContributions => _filteredContributions;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedFilter => _selectedFilter;
  double get monthlyGoal => _monthlyGoal;
  double get monthlyTotal => _monthlyTotal;
  double get monthlyProgress => (_monthlyTotal / _monthlyGoal).clamp(0.0, 1.0);
  double get totalAmount => _totalAmount;
  bool get hasMore => _hasMore;

  /// Convert category to backend type string
  String _getCategoryType(ContributionCategory category) {
    switch (category) {
      case ContributionCategory.tithe:
        return 'tithe';
      case ContributionCategory.offering:
        return 'offering';
      case ContributionCategory.donation:
        return 'donation';
      case ContributionCategory.project:
        return 'project';
      case ContributionCategory.event:
        return 'event';
      case ContributionCategory.other:
        return 'other';
    }
  }

  /// Fetch contributions from API
  Future<void> fetchContributions({
    int page = 1,
    bool refresh = false,
    String? type,
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
      };

      if (type != null && type != 'Historique complet') {
        // Map filter to backend type
        if (type == 'Dîmes') {
          queryParams['type'] = 'tithe';
        } else if (type == 'Offrandes') {
          queryParams['type'] = 'offering';
        }
      }

      final queryString = queryParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');

      final response = await _apiService.get('/contributions?$queryString');

      if (response['success'] == true) {
        final data = response['data'] as Map<String, dynamic>?;
        if (data != null) {
          final contributionsList = data['contributions'] as List<dynamic>?;
          if (contributionsList != null) {
            final newContributions = contributionsList
                .map((c) => ContributionModel.fromJson(c as Map<String, dynamic>))
                .toList();

            if (refresh || page == 1) {
              _contributions = newContributions;
            } else {
              _contributions.addAll(newContributions);
            }

            final pagination = data['pagination'] as Map<String, dynamic>?;
            if (pagination != null) {
              _currentPage = pagination['page'] as int? ?? 1;
              _totalPages = pagination['totalPages'] as int? ?? 1;
              _totalAmount = (pagination['total'] as num?)?.toDouble() ?? 0.0;
              _hasMore = _currentPage < _totalPages;
            }
          }
        }
        _calculateMonthlyTotal();
        _applyFilters();
      } else {
        _error = response['message'] as String? ?? 'Erreur lors du chargement des contributions';
      }
    } catch (e) {
      _error = e is ApiException ? e.message : 'Erreur de connexion';
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Load mock contributions for offline/development mode
  void _loadMockContributions() {
    _contributions = ContributionModel.mockList;
    _calculateMonthlyTotal();
    _applyFilters();
    _totalAmount = ContributionModel.mockTotal;
    notifyListeners();
  }

  void _calculateMonthlyTotal() {
    final now = DateTime.now();
    _monthlyTotal = _contributions
        .where((c) => c.date.month == now.month && c.date.year == now.year)
        .fold(0.0, (sum, c) => sum + c.amount);
  }

  void setFilter(String filter) {
    _selectedFilter = filter;
    _applyFilters();
    notifyListeners();
  }

  void _applyFilters() {
    if (_selectedFilter == 'Historique complet') {
      _filteredContributions = List.from(_contributions);
    } else if (_selectedFilter == 'Dîmes') {
      _filteredContributions = _contributions
          .where((c) => c.category == ContributionCategory.tithe)
          .toList();
    } else if (_selectedFilter == 'Offrandes') {
      _filteredContributions = _contributions
          .where((c) => c.category == ContributionCategory.offering)
          .toList();
    } else {
      _filteredContributions = List.from(_contributions);
    }
  }

  /// Create a new contribution
  Future<bool> createContribution({
    required double amount,
    required ContributionCategory category,
    required String title,
    String? paymentMethod,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/contributions', body: {
        'amount': amount,
        'type': _getCategoryType(category),
        'paymentMethod': paymentMethod ?? 'cash',
        'contributionDate': DateTime.now().toIso8601String().split('T')[0],
        'description': title,
      });

      if (response['success'] == true) {
        // Add new contribution to list
        final newContribution = ContributionModel(
          id: (response['data']?['id'] ?? DateTime.now().millisecondsSinceEpoch).toString(),
          title: title,
          amount: amount,
          date: DateTime.now(),
          category: category,
        );

        _contributions.insert(0, newContribution);
        _calculateMonthlyTotal();
        _applyFilters();
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response['message'] as String? ?? 'Erreur lors de la création de la contribution';
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

  /// Get contribution statistics
  Future<Map<String, dynamic>> getStatistics({String period = 'month'}) async {
    try {
      final response = await _apiService.get('/contributions/statistics?period=$period');
      if (response['success'] == true) {
        return response['data'] as Map<String, dynamic>? ?? {};
      }
    } catch (e) {
      // Return empty stats on error
    }
    return {};
  }

  void downloadReceipt(String contributionId) {
    // TODO: Implement receipt download from API
    // Could call /contributions/:id/receipt endpoint
    // print('Downloading receipt for $contributionId');
  }

  Future<void> refreshContributions() async {
    await fetchContributions(refresh: true);
  }

  Future<void> loadMoreContributions() async {
    if (_hasMore && !_isLoading) {
      await fetchContributions(page: _currentPage + 1);
    }
  }
}
