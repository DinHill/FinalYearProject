import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../constants/theme';
import Card from '../../components/common/Card';

const DocumentsScreen = () => {
  const [activeTab, setActiveTab] = useState('New Request');

  const tabs = ['New Request', 'Track Requests'];

  const requestSummary = {
    total: 3,
    processing: 1,
    ready: 1,
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
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Documents & Requests</Text>
        </View>

        {/* Request Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{requestSummary.total}</Text>
            <Text style={styles.summaryLabel}>Total Requests</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{requestSummary.processing}</Text>
            <Text style={styles.summaryLabel}>Processing</Text>
          </View>
          <View style={styles.summaryCard}>
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
            <Text style={styles.sectionTitle}>Select Document Type</Text>
            
            {documentTypes.map((document, index) => (
              <Card key={index} style={styles.documentCard}>
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
            ))}
          </View>
        )}

        {activeTab === 'Track Requests' && (
          <View style={styles.contentContainer}>
            <Card style={styles.placeholderCard}>
              <MaterialCommunityIcons name="file-document" size={48} color={COLORS.gray} />
              <Text style={styles.placeholderText}>Track your document requests here</Text>
              <Text style={styles.placeholderSubtext}>View status, download completed documents, and manage your requests</Text>
            </Card>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold as any,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.header,
    marginHorizontal: SPACING.xs,
    paddingVertical: SPACING.base,
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
    backgroundColor: COLORS.grayLight,
    paddingVertical: SPACING.base,
    marginHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: COLORS.white,
  },
  tabText: {
    fontSize: FONTS.base,
    color: COLORS.grayDark,
    fontWeight: FONTS.medium as any,
  },
  activeTabText: {
    color: COLORS.black,
    fontWeight: FONTS.semibold as any,
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
});

export default DocumentsScreen;
