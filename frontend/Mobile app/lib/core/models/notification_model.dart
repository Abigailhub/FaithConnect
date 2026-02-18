enum NotificationType { urgent, event, info }

class NotificationModel {
  final String id;
  final String title;
  final String body;
  final NotificationType type;
  final DateTime createdAt;
  final bool isRead;

  const NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.isRead = false,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    // Handle both camelCase and snake_case from different API responses
    final isReadValue = json['isRead'] ?? json['is_read'];
    
    return NotificationModel(
      id: (json['id'] as num?)?.toString() ?? '',
      title: json['title'] as String? ?? '',
      body: json['message'] as String? ?? json['body'] as String? ?? '',
      type: NotificationType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => NotificationType.info,
      ),
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'] as String)
          : json['created_at'] != null 
              ? DateTime.parse(json['created_at'] as String)
              : DateTime.now(),
      isRead: isReadValue is bool ? isReadValue : false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': body,
      'type': type.name,
      'created_at': createdAt.toIso8601String(),
      'isRead': isRead,
    };
  }

  NotificationModel copyWith({bool? isRead}) {
    return NotificationModel(
      id: id,
      title: title,
      body: body,
      type: type,
      createdAt: createdAt,
      isRead: isRead ?? this.isRead,
    );
  }

  static List<NotificationModel> get mockList => [
        NotificationModel(
          id: '1',
          title: 'Urgent: Venue Change',
          body:
              'The Prayer Meeting tonight has been moved to the Main Sanctuary due to AC...',
          type: NotificationType.urgent,
          createdAt: DateTime.now().subtract(const Duration(minutes: 2)),
          isRead: false,
        ),
        NotificationModel(
          id: '2',
          title: 'Événement: Family BBQ',
          body:
              'Join us this Sunday at 1:00 PM for food and fellowship. Don\'t forget to RSVP by...',
          type: NotificationType.event,
          createdAt: DateTime.now().subtract(const Duration(hours: 1)),
          isRead: false,
        ),
        NotificationModel(
          id: '3',
          title: 'Info: Weekly Newsletter',
          body:
              'The latest newsletter for the week of October 23rd is now available for...',
          type: NotificationType.info,
          createdAt: DateTime.now().subtract(const Duration(hours: 5)),
          isRead: true,
        ),
        NotificationModel(
          id: '4',
          title: 'Info: Volunteer Needs',
          body:
              'We are looking for three more volunteers to help with the Sunday School check-in desk.',
          type: NotificationType.info,
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
          isRead: true,
        ),
        NotificationModel(
          id: '5',
          title: 'Événement: Youth Retreat',
          body:
              'Registration for the Winter Retreat is now open. Early bird discount ends this...',
          type: NotificationType.event,
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
          isRead: true,
        ),
      ];
}
