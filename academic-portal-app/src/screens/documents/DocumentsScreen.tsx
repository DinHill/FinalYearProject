import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';
import { SearchBar } from '../../components/common';
import { commonStyles } from '../../styles/commonStyles';
import { api } from '../../services/api';

interface DocumentRequest {
  id: number;
  document_type: string;
  purpose: string;
  status: string;
  notes?: string;
  delivery_method?: string;
  requested_date: string;
  processed_date?: string;
  created_at: string;
}

const DocumentsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('New Request');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const tabs = ['New Request', 'Track Requests'];

  useEffect(() => {
    if (activeTab === 'Track Requests') {
      loadDocumentRequests();
    }
  }, [activeTab]);

  const loadDocumentRequests = async () => {
    setLoading(true);
    try {
      // Use dedicated /me endpoint for document requests
      const response = await api.getMyDocuments();
      if (response.success && response.data) {
        setRequests(Array.isArray(response.data) ? response.data : response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to load document requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDocumentRequests();
    setRefreshing(false);
  };

  const handleDocumentTypePress = (docType: string) => {
    setSelectedDocType(docType);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = async () => {
    if (!purpose.trim()) {
      Alert.alert('Required', 'Please enter the purpose of your request');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.createDocumentRequest({
        document_type: selectedDocType,
        purpose: purpose.trim(),
        notes: notes.trim() || undefined,
      });

      if (response.success) {
        Alert.alert('Success', 'Document request submitted successfully');
        setShowRequestModal(false);
        setPurpose('');
        setNotes('');
        setSelectedDocType('');
        // Switch to Track Requests tab
        setActiveTab('Track Requests');
        loadDocumentRequests();
      } else {
        Alert.alert('Error', response.error || 'Failed to submit request');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return COLORS.warning;
      case 'processing':
        return COLORS.primary;
      case 'ready':
        return COLORS.success;
      case 'completed':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'clock-outline';
      case 'processing':
        return 'progress-clock';
      case 'ready':
        return 'check-circle';
      case 'completed':
        return 'check-all';
      case 'rejected':
        return 'close-circle';
      default:
        return 'information';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const requestSummary = {
    total: requests.length,
    processing: requests.filter(r => ['pending', 'processing'].includes(r.status.toLowerCase())).length,
    ready: requests.filter(r => ['ready', 'completed'].includes(r.status.toLowerCase())).length,
  };

  const documentTypes = [
    {
      name: 'Official Transcript',
      processingTime: 'Processing: 3-5 days',
      cost: '$25',
      perCopy: 'per copy',
    },
    {
      name: 'Enrollment Certificate',
      processingTime: 'Processing: 1-2 days',
      cost: '$10',
      perCopy: 'per copy',
    },
    {
      name: 'Degree Certificate',
      processingTime: 'Processing: 7-10 days',
      cost: '$50',
      perCopy: 'per copy',
    },
    {
      name: 'Letter of Recommendation',
      processingTime: 'Processing: 5-7 days',
      cost: '$15',
      perCopy: 'per copy',
    },
    {
      name: 'Bonafide Certificate',
      processingTime: 'Processing: 1-2 days',
      cost: '$5',
      perCopy: 'per copy',
    },
    {
      name: 'No Due Certificate',
      processingTime: 'Processing: 3-5 days',
      cost: '$10',
      perCopy: 'per copy',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={commonStyles.header}>
          <View style={styles.logoContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="file-document" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.headerText}>Documents & Requests</Text>
          </View>
        </View>

        {/* Request Summary */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.primary }]}>
            <Text style={styles.summaryNumber}>{requestSummary.total}</Text>
            <Text style={styles.summaryLabel}>Total Requests</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.warning }]}>
            <Text style={styles.summaryNumber}>{requestSummary.processing}</Text>
            <Text style={styles.summaryLabel}>Processing</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.success }]}>
            <Text style={styles.summaryNumber}>{requestSummary.ready}</Text>
            <Text style={styles.summaryLabel}>Ready</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content based on active tab */}
        {activeTab === 'New Request' && (
          <View style={styles.contentContainer}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search document types..."
              containerStyle={{ marginHorizontal: SPACING.base }}
            />
            
            <Text style={styles.sectionTitle}>Select Document Type</Text>
            
            {documentTypes
              .filter(doc => 
                searchQuery.trim() === '' ||
                doc.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((document, index) => (
              <TouchableOpacity key={index} onPress={() => handleDocumentTypePress(document.name)}>
                <Card style={styles.documentCard}>
                  <View style={styles.documentContent}>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{document.name}</Text>
                      <Text style={styles.processingTime}>{document.processingTime}</Text>
                    </View>
                    <View style={styles.documentCost}>
                      <Text style={styles.costText}>{document.cost}</Text>
                      <Text style={styles.perCopyText}>{document.perCopy}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'Track Requests' && (
          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : requests.length === 0 ? (
              <Card style={styles.placeholderCard}>
                <MaterialCommunityIcons name="file-document" size={48} color={COLORS.gray} />
                <Text style={styles.placeholderText}>No document requests yet</Text>
                <Text style={styles.placeholderSubtext}>Submit a new request to get started</Text>
              </Card>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              >
                {requests.map((request) => (
                  <Card key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestLeft}>
                        <View style={[styles.requestIconCircle, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                          <MaterialCommunityIcons
                            name={getStatusIcon(request.status)}
                            size={24}
                            color={getStatusColor(request.status)}
                          />
                        </View>
                        <View style={styles.requestInfo}>
                          <Text style={styles.requestType}>{request.document_type}</Text>
                          <Text style={styles.requestDate}>Requested {formatDate(request.requested_date || request.created_at)}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                        <Text style={styles.statusBadgeText}>{request.status.toUpperCase()}</Text>
                      </View>
                    </View>

                    <View style={styles.requestDivider} />

                    <View style={styles.requestDetails}>
                      <View style={styles.requestRow}>
                        <Text style={styles.requestLabel}>Purpose:</Text>
                        <Text style={styles.requestValue}>{request.purpose}</Text>
                      </View>
                      {request.notes && (
                        <View style={styles.requestRow}>
                          <Text style={styles.requestLabel}>Notes:</Text>
                          <Text style={styles.requestValue}>{request.notes}</Text>
                        </View>
                      )}
                      {request.processed_date && (
                        <View style={styles.requestRow}>
                          <Text style={styles.requestLabel}>Processed:</Text>
                          <Text style={styles.requestValue}>{formatDate(request.processed_date)}</Text>
                        </View>
                      )}
                    </View>

                    {request.status.toLowerCase() === 'ready' && (
                      <TouchableOpacity style={styles.downloadButton}>
                        <MaterialCommunityIcons name="download" size={20} color={COLORS.white} />
                        <Text style={styles.downloadButtonText}>Download Document</Text>
                      </TouchableOpacity>
                    )}
                  </Card>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </ScrollView>

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request: {selectedDocType}</Text>
              <TouchableOpacity onPress={() => setShowRequestModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Purpose *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Job application, Transfer to another institution"
                placeholderTextColor={COLORS.gray}
                value={purpose}
                onChangeText={setPurpose}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Any special requirements or notes"
                placeholderTextColor={COLORS.gray}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="information" size={20} color={COLORS.info} />
                <Text style={styles.infoText}>
                  You will be notified via email when your document is ready for pickup or download.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmitRequest}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  backButton: {
    padding: SPACING.xs,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerText: {
    color: COLORS.white,
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    marginTop: 2,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    gap: SPACING.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.bold as any,
    color: COLORS.white,
  },
  summaryLabel: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    opacity: 0.8,
    marginTop: SPACING.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.base,
  },
  tab: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.base,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.base,
    color: COLORS.grayDark,
    fontWeight: '500' as any,
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: '700' as any,
  },
  contentContainer: {
    paddingHorizontal: SPACING.base,
  },
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  documentCard: {
    marginBottom: SPACING.base,
  },
  documentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  processingTime: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  documentCost: {
    alignItems: 'flex-end',
  },
  costText: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold as any,
    color: COLORS.primary,
  },
  perCopyText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  placeholderCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  placeholderText: {
    fontSize: FONTS.lg,
    color: COLORS.gray,
    marginTop: SPACING.base,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONTS.base,
    color: COLORS.gray,
    marginTop: SPACING.base,
  },
  requestCard: {
    marginBottom: SPACING.base,
    padding: SPACING.lg,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requestIconCircle: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
  },
  requestDate: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusBadgeText: {
    fontSize: FONTS.xs,
    fontWeight: '700' as any,
    color: COLORS.white,
  },
  requestDivider: {
    height: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: SPACING.base,
  },
  requestDetails: {
    gap: SPACING.sm,
  },
  requestRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  requestLabel: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    fontWeight: '600' as any,
  },
  requestValue: {
    fontSize: FONTS.sm,
    color: COLORS.black,
    flex: 1,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.base,
    marginTop: SPACING.base,
    gap: SPACING.xs,
  },
  downloadButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: '600' as any,
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
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  modalTitle: {
    fontSize: FONTS.xl,
    fontWeight: '700' as any,
    color: COLORS.black,
  },
  modalBody: {
    padding: SPACING.lg,
  },
  inputLabel: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
    marginBottom: SPACING.xs,
    marginTop: SPACING.base,
  },
  textInput: {
    backgroundColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    padding: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.black,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.info + '15',
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.info,
  },
  infoText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.info,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: '700' as any,
  },
});

export default DocumentsScreen;
