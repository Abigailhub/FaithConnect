class UserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String? avatarUrl;
  final String? role;
  final String? group;
  final bool isActive;
  final String? organizationId;
  final String? organizationName;

  const UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    this.avatarUrl,
    this.role,
    this.group,
    this.isActive = true,
    this.organizationId,
    this.organizationName,
  });

  String get fullName => '$firstName $lastName';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['id'] ?? json['id']?.toString() ?? '').toString(),
      firstName: json['firstName'] as String? ?? json['first_name'] as String? ?? '',
      lastName: json['lastName'] as String? ?? json['last_name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String?,
      avatarUrl: json['avatarUrl'] as String? ?? json['avatar_url'] as String?,
      role: json['role'] as String?,
      group: json['group'] as String?,
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? true,
      organizationId: json['organizationId']?.toString() ?? json['organization_id']?.toString(),
      organizationName: json['organizationName'] as String? ?? json['organization_name'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
      'avatarUrl': avatarUrl,
      'role': role,
      'group': group,
      'isActive': isActive,
      'organizationId': organizationId,
      'organizationName': organizationName,
    };
  }

  /// Mock user for UI development
  static UserModel get mock => const UserModel(
    id: '1',
    firstName: 'Mohamed',
    lastName: 'Richardson',
    email: 'samuel@faithconnect.com',
    phone: '+33 6 12 34 56 78',
    avatarUrl: null,
    role: 'member',
    group: 'Leadership Council',
    isActive: true,
  );
}
