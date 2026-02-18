import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/app_colors.dart';
import '../../core/models/event_model.dart';
import '../../core/providers/event_provider.dart';

class EventDetailsScreen extends StatelessWidget {
  const EventDetailsScreen({super.key});

  String getEventStatus(EventModel event) {
    final now = DateTime.now();
    final eventDate = event.date;
    final startTimeParts = event.startTime.split(':');
    
    // Default end time is 1 hour after start
    final endTimeStr = event.endTime ?? (int.parse(startTimeParts[0]) + 1).toString().padLeft(2, '0') + ':' + (startTimeParts.length > 1 ? startTimeParts[1] : '00');
    final endTimeParts = endTimeStr.split(':');
    
    final eventStart = DateTime(
      eventDate.year, 
      eventDate.month, 
      eventDate.day,
      int.parse(startTimeParts[0]),
      startTimeParts.length > 1 ? int.parse(startTimeParts[1]) : 0,
    );
    
    final eventEnd = DateTime(
      eventDate.year, 
      eventDate.month, 
      eventDate.day,
      int.parse(endTimeParts[0]),
      endTimeParts.length > 1 ? int.parse(endTimeParts[1]) : 0,
    );
    
    if (now.isBefore(eventStart)) {
      return 'À venir';
    } else if (now.isAfter(eventStart) && now.isBefore(eventEnd)) {
      return 'En cours';
    } else {
      return 'Terminé';
    }
  }

  Color getEventStatusColor(String status) {
    if (status == 'À venir') {
      return AppColors.info;
    } else if (status == 'En cours') {
      return AppColors.success;
    } else {
      return AppColors.textTertiary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final event = ModalRoute.of(context)?.settings.arguments as EventModel?;

    if (event == null) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Text('Event not found'),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          CustomScrollView(
            slivers: [
              // App bar with image
              SliverAppBar(
                expandedHeight: 240,
                pinned: true,
                backgroundColor: Colors.white,
                leading: IconButton(
                  icon: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.chevron_left, color: AppColors.textPrimary),
                  ),
                  onPressed: () => Navigator.pop(context),
                ),
                actions: [
                  IconButton(
                    icon: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.share_outlined, color: AppColors.textPrimary, size: 20),
                    ),
                    onPressed: () {
                      // Share event functionality
                      final eventUrl = 'https://faithconnect.app/events/${event.id}';
                      showModalBottomSheet(
                        context: context,
                        builder: (context) => Container(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Text(
                                'Partager l\'événement',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 20),
                              ListTile(
                                leading: const Icon(Icons.link),
                                title: const Text('Copier le lien'),
                                onTap: () async {
                                  await Clipboard.setData(ClipboardData(text: eventUrl));
                                  if (context.mounted) {
                                    Navigator.pop(context);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Lien copié dans le presse-papiers!'),
                                        backgroundColor: AppColors.success,
                                      ),
                                    );
                                  }
                                },
                              ),
                              ListTile(
                                leading: const Icon(Icons.share),
                                title: const Text('Partager via...'),
                                onTap: () async {
                                  try {
                                    Navigator.pop(context);
                                    await Share.share(
                                      'Venez participer à l\'événement: ${event.title}\n\n${event.description ?? ""}\n\nLien: $eventUrl',
                                      subject: 'Invitation à l\'événement: ${event.title}',
                                    );
                                  } catch (e) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(
                                          content: Text('Fonction de partage non disponible sur cette plateforme'),
                                          backgroundColor: AppColors.warning,
                                        ),
                                      );
                                    }
                                  }
                                },
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ],
                title: const Text(
                  'Détails de l\'événement',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0xFF1a237e), Color(0xFF283593)],
                      ),
                    ),
                    child: const Center(
                      child: Icon(Icons.event, color: Colors.white24, size: 64),
                    ),
                  ),
                ),
              ),
              // Content
              SliverToBoxAdapter(
                child: Transform.translate(
                  offset: const Offset(0, -24),
                  child: Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Status badge
                          Builder(builder: (context) {
                            final status = getEventStatus(event);
                            final statusColor = getEventStatusColor(status);
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                status.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: statusColor,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            );
                          }),
                          const SizedBox(height: 12),
                          // Title
                          Text(
                            event.title,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 24),
                          // Date & Time
                          Text(
                            'DATE & HEURE',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.primarySurface,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.calendar_month,
                                  color: AppColors.primary,
                                  size: 22,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _formatDate(event.date),
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    event.endTime != null
                                        ? '${event.startTime} — ${event.endTime}'
                                        : event.startTime,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),
                          const Divider(),
                          const SizedBox(height: 20),
                          // Location
                          Text(
                            'LIEU',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: AppColors.primary,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: AppColors.primarySurface,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(
                                  Icons.location_on,
                                  color: AppColors.primary,
                                  size: 22,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      event.location,
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                    if (event.address != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        event.address!,
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: AppColors.textSecondary,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          // Map placeholder
                          Container(
                            height: 160,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceVariant,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Stack(
                              children: [
                                const Center(
                                  child: Icon(
                                    Icons.map_outlined,
                                    color: AppColors.textTertiary,
                                    size: 48,
                                  ),
                                ),
                                Positioned(
                                  bottom: 12,
                                  right: 12,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(8),
                                      boxShadow: AppColors.cardShadow,
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        const Icon(Icons.diamond_outlined,
                                            size: 14, color: AppColors.primary),
                                        const SizedBox(width: 4),
                                        const Text(
                                          'Itinéraire',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 28),
                          // Description
                          const Text(
                            'Description',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            event.description ?? 'Aucune description disponible.',
                            style: TextStyle(
                              fontSize: 15,
                              color: AppColors.textSecondary,
                              height: 1.6,
                            ),
                          ),
                          // Groups
                          if (event.groups != null && event.groups!.isNotEmpty) ...[
                            const SizedBox(height: 28),
                            const Text(
                              'Groupes concernés',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: event.groups!.map((group) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: AppColors.surfaceVariant,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.groups_outlined,
                                          size: 16, color: AppColors.primary),
                                      const SizedBox(width: 6),
                                      Text(
                                        group,
                                        style: const TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                          color: AppColors.textPrimary,
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
          // Bottom CTA
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton.icon(
                  onPressed: (event.isUserRegistered ?? false)
                      ? () async {
                          // Cancel registration
                          final eventProvider = context.read<EventProvider>();
                          final success = await eventProvider.cancelRegistration(event.id);
                          
                          if (success && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Inscription annulée avec succès!'),
                                backgroundColor: AppColors.success,
                              ),
                            );
                          } else if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(eventProvider.error ?? 'Erreur lors de l\'annulation'),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                        }
                      : () async {
                          // Call API to register for event
                          final eventProvider = context.read<EventProvider>();
                          final success = await eventProvider.registerForEvent(event.id);
                          
                          if (success && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Inscription enregistrée avec succès!'),
                                backgroundColor: AppColors.success,
                              ),
                            );
                          } else if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(eventProvider.error ?? 'Erreur lors de l\'inscription'),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: (event.isUserRegistered ?? false) ? AppColors.error : AppColors.primary,
                  ),
                  icon: Icon(
                    (event.isUserRegistered ?? false) ? Icons.close : Icons.calendar_month, 
                    size: 20,
                    color: Colors.white,
                  ),
                  label: Text(
                    (event.isUserRegistered ?? false) ? 'Annuler l\'inscription' : 'S\'inscrire',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    final months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return '${days[date.weekday - 1]} ${date.day} ${months[date.month - 1]}';
  }
}
