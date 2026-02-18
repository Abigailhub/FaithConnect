import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/models/event_model.dart';
import '../../core/models/notification_model.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/contribution_provider.dart';
import '../../core/providers/event_provider.dart';
import '../../core/providers/notification_provider.dart';
import '../../core/routes/app_routes.dart';
import '../../widgets/section_card.dart';
import '../../widgets/app_bottom_nav.dart';
import '../notifications/notifications_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch data from API
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EventProvider>().fetchEvents(refresh: true);
      context.read<NotificationProvider>().fetchNotifications(refresh: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final eventProvider = context.watch<EventProvider>();
    final notificationProvider = context.watch<NotificationProvider>();
    final contributionProvider = context.watch<ContributionProvider>();
    final events = eventProvider.events;
    final notifications = notificationProvider.notifications;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // App bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Row(
                  children: [
                    // Church icon
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primarySurface,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.church,
                        color: AppColors.primary,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text(
                      'FaithConnect',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () {
                        Navigator.pushNamed(context, AppRoutes.search);
                      },
                      icon: const Icon(Icons.search, color: AppColors.textSecondary),
                    ),
                    // Avatar
                    GestureDetector(
                      onTap: () {
                        Navigator.pushNamed(context, AppRoutes.profile);
                      },
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor: AppColors.primarySurface,
                        child: Text(
                          user?.firstName.substring(0, 1) ?? 'U',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Greeting
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hello, ${user?.firstName ?? 'Membre'}',
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Heureux de vous revoir aujourd\'hui.',
                      style: TextStyle(
                        fontSize: 15,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Quick actions
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _QuickAction(
                      icon: Icons.menu_book_outlined,
                      label: 'Lectures',
                      color: AppColors.primary,
                      onTap: () {
                        // TODO: Navigate to readings (future feature)
                      },
                    ),
                    _QuickAction(
                      icon: Icons.groups_outlined,
                      label: 'Groupes',
                      color: AppColors.primary,
                      onTap: () {
                        // TODO: Navigate to groups (future feature)
                      },
                    ),
                    _QuickAction(
                      icon: Icons.volunteer_activism_outlined,
                      label: 'Donner',
                      color: AppColors.primary,
                      onTap: () {
                        // Navigate to contributions with bottom nav
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MainShell(initialIndex: 2),
                          ),
                        );
                      },
                    ),
                    _QuickAction(
                      icon: Icons.play_circle_outline,
                      label: 'Direct',
                      color: AppColors.primary,
                      onTap: () {
                        // TODO: Navigate to live stream (future feature)
                      },
                    ),
                  ],
                ),
              ),
            ),
            // Next event section
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 28),
                child: Column(
                  children: [
                    SectionHeader(
                      title: 'Prochain événement',
                      actionText: 'Tout voir',
                      onAction: () {
                        // TODO: Navigate to events
                      },
                    ),
                    if (events.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _NextEventCard(event: events.last),
                    ],
                  ],
                ),
              ),
            ),
            // Contributions summary
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SectionHeader(title: 'Résumé des contributions'),
                    const SizedBox(height: 12),
                    _ContributionSummaryCard(
                      monthlyTotal: contributionProvider.monthlyTotal,
                      monthlyGoal: contributionProvider.monthlyGoal,
                    ),
                  ],
                ),
              ),
            ),
            // Latest notifications
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.only(top: 28),
                child: Column(
                  children: [
                    SectionHeader(
                      title: 'Dernières notifications',
                      trailing: notificationProvider.unreadCount > 0
                          ? Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.errorLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${notificationProvider.unreadCount} NOUVELLES',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.error,
                                ),
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(height: 12),
                    ...notifications.take(2).map(
                          (n) => _NotificationTile(notification: n),
                        ),
                    const SizedBox(height: 8),
                    // View all link
                    Center(
                      child: TextButton(
                        onPressed: () {
                          // Navigate to notifications with bottom nav
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const MainShell(initialIndex: 3),
                            ),
                          );
                        },
                        child: Text(
                          'Voir l\'historique complet',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.textTertiary,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.primarySurface,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: color, size: 26),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _NextEventCard extends StatelessWidget {
  final EventModel event;

  const _NextEventCard({required this.event});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: AppColors.cardShadow,
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Event image placeholder
            Stack(
              children: [
                Container(
                  height: 180,
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF1a237e), Color(0xFF283593)],
                    ),
                  ),
                  child: const Center(
                    child: Icon(Icons.event, color: Colors.white38, size: 48),
                  ),
                ),
                // Date badge
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Column(
                      children: [
                        Text(
                          'OCT',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                        Text(
                          '${event.date.day}',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.primarySurface,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          event.category,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${event.startTime} • ${event.location}',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    event.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Attendees avatars
                      SizedBox(
                        width: 70,
                        height: 28,
                        child: Stack(
                          children: List.generate(
                            3,
                            (i) => Positioned(
                              left: i * 18.0,
                              child: CircleAvatar(
                                radius: 14,
                                backgroundColor: [
                                  AppColors.primary,
                                  AppColors.success,
                                  AppColors.warning,
                                ][i],
                                child: Text(
                                  ['M', 'A', 'S'][i],
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Text(
                        '+${event.attendeesCount ?? 0}',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const Spacer(),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.pushNamed(
                            context,
                            AppRoutes.eventDetails,
                            arguments: event,
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          minimumSize: const Size(0, 36),
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          backgroundColor: (event.isUserRegistered ?? false) ? AppColors.textSecondary : AppColors.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: Text(
                          (event.isUserRegistered ?? false) ? 'Inscrit' : 'S\'inscrire',
                          style: const TextStyle(fontSize: 13, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContributionSummaryCard extends StatelessWidget {
  final double monthlyTotal;
  final double monthlyGoal;

  const _ContributionSummaryCard({
    super.key,
    required this.monthlyTotal,
    required this.monthlyGoal,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.primarySurface,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.account_balance_wallet_outlined,
                    color: AppColors.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'Dons ce mois-ci',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${monthlyTotal.toStringAsFixed(2)}€',
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationModel notification;

  const _NotificationTile({required this.notification});

  IconData get _icon {
    switch (notification.type) {
      case NotificationType.urgent:
        return Icons.priority_high;
      case NotificationType.event:
        return Icons.event_available;
      case NotificationType.info:
        return Icons.info_outline;
    }
  }

  Color get _iconBgColor {
    switch (notification.type) {
      case NotificationType.urgent:
        return AppColors.errorLight;
      case NotificationType.event:
        return AppColors.successLight;
      case NotificationType.info:
        return AppColors.primarySurface;
    }
  }

  Color get _iconColor {
    switch (notification.type) {
      case NotificationType.urgent:
        return AppColors.error;
      case NotificationType.event:
        return AppColors.success;
      case NotificationType.info:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: GestureDetector(
        onTap: () {
          // Mark as read when opened
          context.read<NotificationProvider>().markAsRead(notification.id);
          // Show notification detail
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (context) => NotificationDetailSheet(notification: notification),
          );
        },
        child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: AppColors.cardShadow,
        ),
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
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        _formatTime(notification.createdAt),
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.textTertiary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.body,
                    style: TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      height: 1.3,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 60) return 'Il y a ${diff.inMinutes}m';
    if (diff.inHours < 24) return 'Il y a ${diff.inHours}h';
    return 'Hier';
  }
}
