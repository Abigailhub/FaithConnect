class EventModel {
  final String id;
  final String title;
  final String? description;
  final String category;
  final DateTime date;
  final String startTime;
  final String? endTime;
  final String location;
  final String? address;
  final String? imageUrl;
  final int? attendeesCount;
  final List<String>? groups;
  final int? maxParticipants;
  final bool? isUserRegistered;

  const EventModel({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    required this.date,
    required this.startTime,
    this.endTime,
    required this.location,
    this.address,
    this.imageUrl,
    this.attendeesCount,
    this.groups,
    this.maxParticipants,
    this.isUserRegistered,
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    // Parse event_date - could be a DateTime string or separate date/time fields
    DateTime eventDate;
    if (json['event_date'] is String) {
      eventDate = DateTime.parse(json['event_date'] as String);
    } else {
      eventDate = DateTime.now();
    }

    // Extract start time from event_date
    String startTime = '';
    if (json['event_date'] != null) {
      final dateTime = json['event_date'] is String
          ? DateTime.parse(json['event_date'] as String)
          : json['event_date'] as DateTime;
      startTime =
          '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
    }

    return EventModel(
      id: (json['id'] ?? json['id']?.toString()) as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      category: json['category'] as String? ?? 'EVENT',
      date: eventDate,
      startTime: startTime,
      endTime: json['end_time'] as String?,
      location: json['location'] as String,
      address: json['address'] as String?,
      imageUrl: json['image_url'] as String?,
      attendeesCount:
          json['participant_count'] as int? ?? json['attendees_count'] as int?,
      maxParticipants: json['max_participants'] as int?,
      groups: (json['groups'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      isUserRegistered: (json['is_registered'] as int?) == 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'category': category,
      'event_date': date.toIso8601String(),
      'start_time': startTime,
      'end_time': endTime,
      'location': location,
      'address': address,
      'image_url': imageUrl,
      'attendees_count': attendeesCount,
      'max_participants': maxParticipants,
      'groups': groups,
      'is_registered': isUserRegistered,
    };
  }

  /// Create from backend API response
  factory EventModel.fromBackendJson(Map<String, dynamic> json) {
    DateTime eventDate;
    if (json['event_date'] != null) {
      eventDate = DateTime.parse(json['event_date'] as String);
    } else {
      eventDate = DateTime.now();
    }

    String startTime = '';
    if (json['event_date'] != null) {
      final dt = DateTime.parse(json['event_date'] as String);
      startTime =
          '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    }

    return EventModel(
      id: json['id'].toString(),
      title: json['title'] ?? '',
      description: json['description'],
      category: 'EVENT',
      date: eventDate,
      startTime: startTime,
      location: json['location'] ?? '',
      attendeesCount: json['participant_count'] as int?,
      maxParticipants: json['max_participants'] as int?,
    );
  }

  static List<EventModel> get mockList => [
    EventModel(
      id: '1',
      title: 'Service communautaire du dimanche',
      category: 'WORSHIP',
      date: DateTime(2023, 10, 22),
      startTime: '09:00',
      location: 'Sanctuaire Principal, Paris',
      attendeesCount: 120,
      description:
          'Rejoignez-nous pour un service de louange et d\'adoration communautaire.',
      groups: ['Jeunes Adultes', 'Bénévoles', 'Familles'],
    ),
    EventModel(
      id: '2',
      title: 'Rencontre des jeunes adultes',
      category: 'YOUTH',
      date: DateTime(2023, 10, 24),
      startTime: '18:30',
      location: 'Salle Polyvalente B',
      attendeesCount: 45,
      description:
          'Un moment de partage et de communion pour les jeunes adultes.',
      groups: ['Jeunes Adultes'],
    ),
    EventModel(
      id: '3',
      title: 'Distribution alimentaire',
      category: 'BÉNÉVOLAT',
      date: DateTime(2023, 10, 28),
      startTime: '10:00',
      location: 'Centre de Tri Social',
      attendeesCount: 30,
      description:
          'Participez à la distribution alimentaire pour les familles dans le besoin.',
      groups: ['Bénévoles'],
    ),
    EventModel(
      id: '4',
      title: 'Soirée de Louange & Impact Communautaire',
      category: 'COMMUNAUTÉ',
      date: DateTime(2023, 12, 14),
      startTime: '18:30',
      endTime: '21:00',
      location: 'Jardins Communautaires Nord',
      address: '882 West Valley Rd, Springfield',
      attendeesCount: 85,
      description:
          'Rejoignez-nous pour une soirée exceptionnelle de rassemblement communautaire et de louange sous les étoiles. Cet événement est l\'occasion idéale de se connecter avec d\'autres membres et de découvrir nos projets pour la saison hivernale.\n\nNous partagerons un repas convivial et discuterons de nos prochains programmes d\'entraide. Tout le monde est le bienvenu pour apprendre comment FaithConnect sert notre quartier local.',
      groups: ['Jeunes Adultes', 'Bénévoles', 'Familles'],
    ),
  ];
}
