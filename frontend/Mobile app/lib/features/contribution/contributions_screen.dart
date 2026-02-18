import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/models/contribution_model.dart';
import '../../core/providers/contribution_provider.dart';

class ContributionsScreen extends StatefulWidget {
  const ContributionsScreen({super.key});

  @override
  State<ContributionsScreen> createState() => _ContributionsScreenState();
}

class _ContributionsScreenState extends State<ContributionsScreen> {
  final List<String> _filters = ['Historique complet', 'Dîmes', 'Offrandes'];
  int _selectedFilter = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ContributionProvider>().fetchContributions(refresh: true);
    });
  }

  List<ContributionModel> _getFilteredContributions(List<ContributionModel> contributions) {
    if (_selectedFilter == 0) return contributions;
    if (_selectedFilter == 1) {
      return contributions
          .where((c) => c.category == ContributionCategory.tithe)
          .toList();
    }
    return contributions
        .where((c) => c.category == ContributionCategory.offering)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final contributionProvider = context.watch<ContributionProvider>();
    final contributions = contributionProvider.contributions;
    final filteredContributions = _getFilteredContributions(contributions);

    if (contributionProvider.isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Row(
                children: [
                  const Text(
                    'Contributions',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () {
                      // TODO: Open filter
                    },
                    child: const Text(
                      'Filtre',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Divider(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Total contributions card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: AppColors.cardShadow,
                      ),
                      child: Column(
                        children: [
                          Text(
                            'TOTAL CONTRIBUTIONS',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textTertiary,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            "${NumberFormat('#,##0.00').format(contributionProvider.totalAmount)}",
                            style: const TextStyle(
                              fontSize: 36,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.successLight,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              '2023 - 2024',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: AppColors.success,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Filter chips
                    SizedBox(
                      height: 40,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _filters.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final isSelected = _selectedFilter == index;
                          return GestureDetector(
                            onTap: () => setState(() => _selectedFilter = index),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.primary : Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isSelected ? AppColors.primary : AppColors.border,
                                ),
                              ),
                              child: Text(
                                _filters[index],
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color: isSelected ? Colors.white : AppColors.textSecondary,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Transactions header
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'TRANSACTIONS RÉCENTES',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textTertiary,
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Transactions list
                    filteredContributions.isEmpty
                        ? Container(
                            padding: const EdgeInsets.all(32),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: AppColors.cardShadow,
                            ),
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.volunteer_activism,
                                    size: 64,
                                    color: AppColors.textTertiary,
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'Aucune contribution',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Vous n\'avez pas encore fait de contribution',
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppColors.textTertiary,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ],
                              ),
                            ),
                          )
                        : Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: AppColors.cardShadow,
                      ),
                      child: Column(
                        children: filteredContributions.asMap().entries.map((entry) {
                          final index = entry.key;
                          final contribution = entry.value;
                          return Column(
                            children: [
                              _TransactionTile(contribution: contribution),
                              if (index < filteredContributions.length - 1)
                                const Divider(height: 1, indent: 72),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 24),
                    // Tax note
                    Text(
                      'Toutes les contributions sont déductibles d\'impôts. Les reçus annuels seront envoyés en Janvier.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textTertiary,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: New contribution
        },
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  final ContributionModel contribution;

  const _TransactionTile({required this.contribution});

  IconData get _icon {
    switch (contribution.category) {
      case ContributionCategory.tithe:
        return Icons.account_balance_outlined;
      case ContributionCategory.project:
        return Icons.church_outlined;
      case ContributionCategory.offering:
        return Icons.volunteer_activism_outlined;
      case ContributionCategory.event:
        return Icons.event_outlined;
      case ContributionCategory.donation:
        return Icons.favorite_outline;
      case ContributionCategory.other:
        return Icons.attach_money;
    }
  }

  Color get _iconBgColor {
    switch (contribution.category) {
      case ContributionCategory.tithe:
        return AppColors.primarySurface;
      case ContributionCategory.project:
        return AppColors.warningLight;
      case ContributionCategory.offering:
        return AppColors.successLight;
      case ContributionCategory.event:
        return AppColors.errorLight;
      case ContributionCategory.donation:
        return AppColors.primarySurface;
      case ContributionCategory.other:
        return AppColors.surfaceVariant;
    }
  }

  Color get _iconColor {
    switch (contribution.category) {
      case ContributionCategory.tithe:
        return AppColors.primary;
      case ContributionCategory.project:
        return AppColors.warning;
      case ContributionCategory.offering:
        return AppColors.success;
      case ContributionCategory.event:
        return AppColors.error;
      case ContributionCategory.donation:
        return AppColors.primary;
      case ContributionCategory.other:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('d MMM. yyyy');

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: _iconBgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(_icon, color: _iconColor, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  contribution.title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Text(
                      dateFormat.format(contribution.date),
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textTertiary,
                      ),
                    ),
                    const SizedBox(width: 16),
                    GestureDetector(
                      onTap: () {
                        // TODO: Download receipt
                      },
                      child: Row(
                        children: [
                          Icon(Icons.download_outlined,
                              size: 14, color: AppColors.primary),
                          const SizedBox(width: 4),
                          const Text(
                            'Télécharger reçu',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
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
          Text(
            '\$${NumberFormat('#,##0.00').format(contribution.amount)}',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
