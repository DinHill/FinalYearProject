import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';
import { api } from '../../services/api';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  icon: string;
}

const SupportScreen = () => {
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState('other');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // FAQ Data - Customizable
  const faqs: FAQ[] = [
    {
      id: 1,
      question: 'How do I check my grades?',
      answer: 'Go to the Academic tab, then select the Grades section. You can view all your course grades, GPA, and download grade reports.',
      category: 'Academic',
      icon: 'school'
    },
    {
      id: 2,
      question: 'How do I view my class schedule?',
      answer: 'Navigate to the Schedule tab to see your weekly or monthly class schedule. You can search for specific classes and view room locations.',
      category: 'Academic',
      icon: 'calendar'
    },
    {
      id: 3,
      question: 'How do I request a transcript?',
      answer: 'Go to More > Documents, then tap "Request New Document". Select "Transcript" from the document type and fill in the required information.',
      category: 'Documents',
      icon: 'file-document'
    },
    {
      id: 4,
      question: 'How do I pay my tuition fees?',
      answer: 'Go to More > Finance to view your invoices. Select an unpaid invoice and tap "Make Payment" to proceed with online payment.',
      category: 'Financial',
      icon: 'cash-multiple'
    },
    {
      id: 5,
      question: 'How do I check my attendance?',
      answer: 'Go to the Academic tab and select the Attendance section. You can view attendance records for all your enrolled courses.',
      category: 'Academic',
      icon: 'clipboard-check'
    },
    {
      id: 6,
      question: 'How do I update my profile information?',
      answer: 'Go to More > Profile, then tap the edit icon in the header. You can update your phone number, date of birth, and other personal information.',
      category: 'Profile',
      icon: 'account'
    },
    {
      id: 7,
      question: 'Where can I see campus announcements?',
      answer: 'Go to More > Announcements to view all official campus announcements, news, and updates from the university.',
      category: 'General',
      icon: 'bullhorn'
    },
    {
      id: 8,
      question: 'What should I do if I forgot my password?',
      answer: 'On the login screen, tap "Forgot Password". Enter your student ID and follow the instructions sent to your registered email.',
      category: 'Account',
      icon: 'lock-reset'
    }
  ];

  const filteredFAQs = searchQuery.trim() 
    ? faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqs;

  const handleSubmitTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      Alert.alert('Error', 'Please fill in both subject and message');
      return;
    }

    setSubmitting(true);
    try {
      await api.createSupportTicket({
        subject: ticketSubject,
        message: ticketMessage,
        category: ticketCategory
      });
      
      Alert.alert(
        'Success', 
        'Your support ticket has been submitted. Our team will respond within 24-48 hours.',
        [{ text: 'OK', onPress: () => {
          setShowTicketModal(false);
          setTicketSubject('');
          setTicketMessage('');
          setTicketCategory('other');
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="help-circle" size={24} color={COLORS.white} />
          </View>
          <Text style={styles.headerTitle}>Support</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={COLORS.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Create Support Ticket Button */}
        <TouchableOpacity 
          style={styles.ticketButton}
          onPress={() => setShowTicketModal(true)}
        >
          <MaterialCommunityIcons name="ticket-account" size={24} color={COLORS.white} />
          <Text style={styles.ticketButtonText}>Create Support Ticket</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.white} />
        </TouchableOpacity>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results (${filteredFAQs.length})` : 'Frequently Asked Questions'}
          </Text>
          
          {filteredFAQs.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="magnify" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>No FAQs found</Text>
              <Text style={styles.emptySubtext}>Try different keywords</Text>
            </Card>
          ) : (
            filteredFAQs.map((faq) => (
              <TouchableOpacity
                key={faq.id}
                onPress={() => setSelectedFAQ(faq)}
              >
                <Card style={styles.faqCard}>
                  <View style={styles.faqHeader}>
                    <View style={styles.faqIconContainer}>
                      <MaterialCommunityIcons name={faq.icon as any} size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.faqContent}>
                      <Text style={styles.faqCategory}>{faq.category}</Text>
                      <Text style={styles.faqQuestion}>{faq.question}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Card style={styles.contactCard}>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="email" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>support@gre.ac.uk</Text>
            </View>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="phone" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>+44 20 8331 8000</Text>
            </View>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="clock" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>Mon-Fri: 9:00 AM - 5:00 PM</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* FAQ Detail Modal */}
      <Modal
        visible={selectedFAQ !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedFAQ(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>FAQ</Text>
              <TouchableOpacity onPress={() => setSelectedFAQ(null)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            {selectedFAQ && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalIconContainer}>
                  <MaterialCommunityIcons name={selectedFAQ.icon as any} size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.modalCategory}>{selectedFAQ.category}</Text>
                <Text style={styles.modalQuestion}>{selectedFAQ.question}</Text>
                <Text style={styles.modalAnswer}>{selectedFAQ.answer}</Text>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setSelectedFAQ(null)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Support Ticket Modal */}
      <Modal
        visible={showTicketModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTicketModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Support Ticket</Text>
              <TouchableOpacity onPress={() => setShowTicketModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryContainer}>
                {['other', 'academic', 'financial', 'technical'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      ticketCategory === cat && styles.categoryChipActive
                    ]}
                    onPress={() => setTicketCategory(cat)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      ticketCategory === cat && styles.categoryChipTextActive
                    ]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief description of your issue"
                value={ticketSubject}
                onChangeText={setTicketSubject}
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your issue in detail..."
                value={ticketMessage}
                onChangeText={setTicketMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                placeholderTextColor={COLORS.textSecondary}
              />

              <Text style={styles.helperText}>
                Our support team will respond to your ticket within 24-48 hours via email.
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, submitting && styles.modalButtonDisabled]}
              onPress={handleSubmitTicket}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.modalButtonText}>Submit Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.header,
    paddingTop: SPACING['3xl'],
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.base,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold as any,
  },
  content: {
    flex: 1,
    padding: SPACING.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.base,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONTS.base,
    color: COLORS.text,
  },
  ticketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    marginBottom: SPACING.lg,
  },
  ticketButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    marginHorizontal: SPACING.sm,
    flex: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.base,
  },
  emptyCard: {
    padding: SPACING['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.text,
    marginTop: SPACING.base,
  },
  emptySubtext: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  faqCard: {
    marginBottom: SPACING.sm,
    padding: 0,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
  },
  faqIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.base,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.base,
  },
  faqContent: {
    flex: 1,
  },
  faqCategory: {
    fontSize: FONTS.xs,
    color: COLORS.primary,
    fontWeight: FONTS.semibold as any,
    marginBottom: SPACING.xs,
  },
  faqQuestion: {
    fontSize: FONTS.base,
    color: COLORS.text,
  },
  contactCard: {
    padding: SPACING.base,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  contactText: {
    fontSize: FONTS.base,
    color: COLORS.text,
    marginLeft: SPACING.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.base,
    maxHeight: 500,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: SPACING.base,
  },
  modalCategory: {
    fontSize: FONTS.sm,
    color: COLORS.primary,
    fontWeight: FONTS.semibold as any,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  modalQuestion: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.base,
  },
  modalAnswer: {
    fontSize: FONTS.base,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.base,
    margin: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
  },
  inputLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold as any,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.base,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  categoryChip: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: FONTS.sm,
    color: COLORS.text,
  },
  categoryChipTextActive: {
    color: COLORS.white,
    fontWeight: FONTS.semibold as any,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.base,
    padding: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: FONTS.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.base,
    fontStyle: 'italic',
  },
});

export default SupportScreen;
