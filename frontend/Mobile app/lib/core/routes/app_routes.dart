import 'package:flutter/material.dart';

import '../../features/splash/splash_screen.dart';
import '../../features/onboarding/onboarding_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/register_screen.dart';
import '../../features/auth/forgot_password_screen.dart';
import '../../features/home/home_screen.dart';
import '../../features/events/events_list_screen.dart';
import '../../features/events/event_details_screen.dart';
import '../../features/contribution/contributions_screen.dart';
import '../../features/contribution/new_contribution_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/profile/edit_profile_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/settings/language_screen.dart';
import '../../features/settings/change_password_screen.dart';
import '../../features/settings/privacy_screen.dart';
import '../../features/search/search_screen.dart';
import '../../widgets/app_bottom_nav.dart';

class AppRoutes {
  static const splash = '/splash';
  static const onboarding = '/';
  static const login = '/login';
  static const register = '/register';
  static const forgotPassword = '/forgot-password';
  static const main = '/main';
  static const home = '/home';
  static const events = '/events';
  static const eventDetails = '/event-details';
  static const contributions = '/contributions';
  static const newContribution = '/new-contribution';
  static const notifications = '/notifications';
  static const profile = '/profile';
  static const editProfile = '/edit-profile';
  static const settings = '/settings';
  static const language = '/language';
  static const changePassword = '/change-password';
  static const privacy = '/privacy';
  static const search = '/search';

  static final routes = <String, WidgetBuilder>{
    splash: (_) => const SplashScreen(),
    onboarding: (_) => const OnboardingScreen(),
    login: (_) => const LoginScreen(),
    register: (_) => const RegisterScreen(),
    forgotPassword: (_) => const ForgotPasswordScreen(),
    main: (_) => const MainShell(),
    home: (_) => const HomeScreen(),
    events: (_) => const EventsListScreen(),
    eventDetails: (_) => const EventDetailsScreen(),
    contributions: (_) => const ContributionsScreen(),
    newContribution: (_) => const NewContributionScreen(),
    notifications: (_) => const NotificationsScreen(),
    profile: (_) => const ProfileScreen(),
    editProfile: (_) => const EditProfileScreen(),
    settings: (_) => const SettingsScreen(),
    language: (_) => const LanguageScreen(),
    changePassword: (_) => const ChangePasswordScreen(),
    privacy: (_) => const PrivacyScreen(),
    search: (_) => const SearchScreen(),
  };
}
