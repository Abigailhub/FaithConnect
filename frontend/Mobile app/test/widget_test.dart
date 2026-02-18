import 'package:flutter_test/flutter_test.dart';
import 'package:faithconnect/main.dart';

void main() {
  testWidgets('App launches successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const FaithConnectApp());
    expect(find.text('FaithConnect'), findsOneWidget);
  });
}
