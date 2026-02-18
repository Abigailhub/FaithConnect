enum ContributionCategory { tithe, offering, project, event, donation, other }

class ContributionModel {
  final String id;
  final String title;
  final double amount;
  final DateTime date;
  final ContributionCategory category;
  final String? receiptUrl;
  final bool isVerified;
  final String? paymentMethod;
  final String? description;

  const ContributionModel({
    required this.id,
    required this.title,
    required this.amount,
    required this.date,
    required this.category,
    this.receiptUrl,
    this.isVerified = false,
    this.paymentMethod,
    this.description,
  });

  factory ContributionModel.fromJson(Map<String, dynamic> json) {
    // Map backend type to frontend category
    final type = json['type'] as String? ?? 'other';
    ContributionCategory category;
    switch (type) {
      case 'tithe':
        category = ContributionCategory.tithe;
        break;
      case 'offering':
        category = ContributionCategory.offering;
        break;
      case 'donation':
        category = ContributionCategory.donation;
        break;
      case 'project':
        category = ContributionCategory.project;
        break;
      case 'event':
        category = ContributionCategory.event;
        break;
      default:
        category = ContributionCategory.other;
    }

    return ContributionModel(
      id: json['id']?.toString() ?? '',
      title: json['description'] as String? ?? 'Contribution',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      date: json['contribution_date'] != null
          ? DateTime.parse(json['contribution_date'] as String)
          : (json['date'] != null 
              ? DateTime.parse(json['date'] as String)
              : DateTime.now()),
      category: category,
      receiptUrl: json['receipt_url'] as String?,
      isVerified: json['is_verified'] as bool? ?? false,
      paymentMethod: json['payment_method'] as String?,
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'amount': amount,
      'date': date.toIso8601String(),
      'category': category.name,
      'receipt_url': receiptUrl,
      'is_verified': isVerified,
      'payment_method': paymentMethod,
      'description': description,
    };
  }

  /// Convert category to backend type
  String get categoryToBackend {
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

  static List<ContributionModel> get mockList => [
    ContributionModel(
      id: '1',
      title: 'Dîme mensuelle',
      amount: 500.00,
      date: DateTime(2023, 10, 15),
      category: ContributionCategory.tithe,
    ),
    ContributionModel(
      id: '2',
      title: 'Projet Construction',
      amount: 1200.00,
      date: DateTime(2023, 10, 10),
      category: ContributionCategory.project,
    ),
    ContributionModel(
      id: '3',
      title: 'Offrande Missions',
      amount: 150.00,
      date: DateTime(2023, 9, 28),
      category: ContributionCategory.offering,
    ),
    ContributionModel(
      id: '4',
      title: 'Événement Jeunesse',
      amount: 45.00,
      date: DateTime(2023, 9, 15),
      category: ContributionCategory.event,
    ),
    ContributionModel(
      id: '5',
      title: 'Dîme mensuelle',
      amount: 500.00,
      date: DateTime(2023, 9, 15),
      category: ContributionCategory.tithe,
    ),
  ];

  static double get mockTotal => 12450.80;
}
