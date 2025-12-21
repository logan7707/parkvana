import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';

export default function HelpSupportScreen({ navigation }) {
  const openWebsite = () => {
    Linking.openURL('https://parkvanahq.com');
  };

  const sendEmail = () => {
    Linking.openURL('mailto:support@parkvanahq.com');
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://parkvanahq.com/privacy-policy.html');
  };

  const faqs = [
    {
      question: 'How do I list my parking space?',
      answer: 'Tap "List Your Space" on the main screen, fill in your space details including address, hourly rate, and space type. Your space will be visible to drivers immediately after submission.',
    },
    {
      question: 'How do I get paid?',
      answer: 'Earnings are automatically transferred to your linked payment method. You can track your earnings in the Profile section under "My Listed Spaces".',
    },
    {
      question: 'How does the veteran donation work?',
      answer: 'We donate $1 from every booking to support Austin veterans through our partnership with local veteran organizations. You can see the total impact on the main screen.',
    },
    {
      question: 'Can I cancel a booking?',
      answer: 'Yes, you can cancel bookings from the "My Bookings" section. Cancellation policies depend on how far in advance you cancel.',
    },
    {
      question: 'Is my parking space insured?',
      answer: 'All bookings are covered by Parkvana\'s insurance policy. Both space owners and renters are protected during active bookings.',
    },
    {
      question: 'How do I change my availability?',
      answer: 'Go to Profile > My Listed Spaces, then toggle the activation status of any space. You can activate or deactivate spaces anytime.',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>We're here to help you</Text>
      </View>

      <View style={styles.content}>
        {/* Contact Options */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          
          <TouchableOpacity
            style={styles.contactCard}
            onPress={openWebsite}
            activeOpacity={0.7}
          >
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>🌐</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Visit Website</Text>
              <Text style={styles.contactSubtitle}>parkvanahq.com</Text>
            </View>
            <Text style={styles.contactArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={sendEmail}
            activeOpacity={0.7}
          >
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>📧</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactSubtitle}>support@parkvanahq.com</Text>
            </View>
            <Text style={styles.contactArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={openPrivacyPolicy}
            activeOpacity={0.7}
          >
            <View style={styles.contactIcon}>
              <Text style={styles.contactIconText}>🔒</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>Privacy Policy</Text>
              <Text style={styles.contactSubtitle}>View our privacy policy</Text>
            </View>
            <Text style={styles.contactArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {faqs.map((faq, index) => (
            <View key={index} style={styles.faqCard}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        {/* Mission Info */}
        <View style={styles.missionCard}>
          <Text style={styles.missionTitle}>🇺🇸 Our Mission</Text>
          <Text style={styles.missionText}>
            Every booking on Parkvana helps feed a veteran in need. We're committed to supporting those who served our country while making parking easier for everyone.
          </Text>
          <Text style={styles.missionText}>
            Thank you for being part of our community and making a difference!
          </Text>
        </View>

        <Text style={styles.version}>Parkvana v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginBottom: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0ba360',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 15,
  },
  contactSection: {
    marginBottom: 30,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  contactIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#e8f8f5',
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  contactIconText: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  contactArrow: {
    fontSize: 20,
    color: '#0ba360',
    fontWeight: '600',
  },
  faqSection: {
    marginBottom: 30,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0ba360',
    marginBottom: 10,
  },
  faqAnswer: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  missionCard: {
    backgroundColor: '#e8f8f5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0ba360',
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0ba360',
    marginBottom: 12,
  },
  missionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    marginBottom: 10,
  },
  version: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginBottom: 30,
  },
});
