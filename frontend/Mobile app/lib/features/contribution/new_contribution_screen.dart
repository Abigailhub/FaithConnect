import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/models/contribution_model.dart';
import '../../core/providers/contribution_provider.dart';

class NewContributionScreen extends StatefulWidget {
  const NewContributionScreen({super.key});

  @override
  State<NewContributionScreen> createState() => _NewContributionScreenState();
}

class _NewContributionScreenState extends State<NewContributionScreen> {
  final _amountController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  ContributionCategory _selectedCategory = ContributionCategory.tithe;
  bool _isLoading = false;

  final List<ContributionCategory> _categories = [
    ContributionCategory.tithe,
    ContributionCategory.offering,
    ContributionCategory.project,
  ];

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final amount = double.parse(_amountController.text.replaceAll(',', '.'));

    final contributionProvider = context.read<ContributionProvider>();
    await contributionProvider.createContribution(
      amount: amount,
      category: _selectedCategory,
      title: _getTitleForCategory(_selectedCategory),
    );

    setState(() => _isLoading = false);

    if (mounted) {
      Navigator.pop(context);
    }
  }

  String _getTitleForCategory(ContributionCategory category) {
    switch (category) {
      case ContributionCategory.tithe:
        return 'Dîme';
      case ContributionCategory.offering:
        return 'Offrande';
      case ContributionCategory.project:
        return 'Projet';
      case ContributionCategory.event:
        return 'Événement';
      case ContributionCategory.donation:
        return 'Don';
      case ContributionCategory.other:
        return 'Autre';
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Nouvelle contribution',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Category selection
                Text(
                  'TYPE DE CONTRIBUTION',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _categories.map((category) {
                    final isSelected = _selectedCategory == category;
                    return ChoiceChip(
                      label: Text(_getTitleForCategory(category)),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() => _selectedCategory = category);
                      },
                      selectedColor: AppColors.primary,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : AppColors.textPrimary,
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 32),
                // Amount
                Text(
                  'MONTANT',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    prefixText: '€ ',
                    hintText: '0,00',
                  ),
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Entrez un montant';
                    }
                    final amount = double.tryParse(value.replaceAll(',', '.'));
                    if (amount == null || amount <= 0) {
                      return 'Montant invalide';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                // Quick amount buttons
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [10, 20, 50, 100].map((amount) {
                    return GestureDetector(
                      onTap: () {
                        _amountController.text = amount.toString();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceVariant,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '€$amount',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 48),
                // Submit button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSubmit,
                    child: _isLoading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2.5,
                            ),
                          )
                        : const Text('Confirmer le don'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
