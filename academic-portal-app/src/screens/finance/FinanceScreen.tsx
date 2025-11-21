import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/common/Card';
import { api } from '../../services/api';
import { commonStyles } from '../../styles/commonStyles';
import { StudentFinancialSummary, Invoice } from '../../services/finance';
import { useResponsive } from '../../hooks/useResponsive';
import { adaptiveFontSize, adaptiveSpacing } from '../../utils/responsive';

const FinanceScreen = () => {
  const navigation = useNavigation();
  const responsive = useResponsive();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<StudentFinancialSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'invoices'>('overview');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    loadFinanceData();
  }, []);

  const loadFinanceData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load financial summary
      const summaryResponse = await api.getStudentFinancialSummary();
      if (!summaryResponse.success) {
        throw new Error(summaryResponse.error || 'Failed to load financial data');
      }
      setSummary(summaryResponse.data!);

      // Load invoices using dedicated /me endpoint
      const invoicesResponse = await api.getMyInvoices();
      if (invoicesResponse.success && invoicesResponse.data) {
        setInvoices(Array.isArray(invoicesResponse.data) ? invoicesResponse.data : invoicesResponse.data.items || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFinanceData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return COLORS.success;
      case 'partial':
        return COLORS.warning;
      case 'overdue':
        return COLORS.error;
      case 'pending':
        return COLORS.primary;
      case 'cancelled':
        return COLORS.gray;
      default:
        return COLORS.grayDark;
    }
  };

  const handleInvoicePress = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleMakePayment = () => {
    Alert.alert(
      'Payment',
      'This feature will redirect you to the payment gateway.',
      [{ text: 'OK' }]
    );
  };

  const handleDownloadReceipt = () => {
    Alert.alert(
      'Download',
      'Receipt download functionality will be implemented.',
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'You can reach our finance department at:\n\nEmail: finance@greenwich.edu.vn\nPhone: +84 123 456 789',
      [{ text: 'OK' }]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'check-circle';
      case 'partial':
        return 'clock-alert';
      case 'overdue':
        return 'alert-circle';
      case 'pending':
        return 'clock-outline';
      case 'cancelled':
        return 'cancel';
      default:
        return 'information';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={commonStyles.loadingText}>Loading financial data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={COLORS.error} />
          <Text style={commonStyles.errorText}>{error}</Text>
          <TouchableOpacity style={commonStyles.primaryButton} onPress={loadFinanceData}>
            <Text style={commonStyles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = ['Overview', 'Invoices'];

  return (
    <SafeAreaView style={commonStyles.container} edges={['bottom']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={commonStyles.header}>
          <View style={styles.logoContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.logo}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.headerText}>Finance Overview</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                selectedTab === tab.toLowerCase() && styles.activeTab,
              ]}
              onPress={() => setSelectedTab(tab.toLowerCase() as 'overview' | 'invoices')}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab.toLowerCase() && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTab === 'overview' && summary && (
          <View style={styles.content}>
            {/* Financial Summary Grid */}
            <View style={styles.summaryGrid}>
              {/* Total Invoiced */}
              <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                <View style={styles.statIconContainer}>
                  <MaterialCommunityIcons name="receipt-text" size={28} color={COLORS.white} />
                </View>
                <Text style={styles.statValue}>{formatCurrency(summary.total_invoiced)}</Text>
                <Text style={styles.statLabel}>Total Invoiced</Text>
              </View>

              {/* Total Paid */}
              <View style={[styles.statCard, { backgroundColor: COLORS.success }]}>
                <View style={styles.statIconContainer}>
                  <MaterialCommunityIcons name="cash-check" size={28} color={COLORS.white} />
                </View>
                <Text style={styles.statValue}>{formatCurrency(summary.total_paid)}</Text>
                <Text style={styles.statLabel}>Total Paid</Text>
              </View>

              {/* Outstanding Balance */}
              <View style={[styles.statCard, { backgroundColor: COLORS.error }]}>
                <View style={styles.statIconContainer}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={28} color={COLORS.white} />
                </View>
                <Text style={styles.statValue}>{formatCurrency(summary.outstanding_balance)}</Text>
                <Text style={styles.statLabel}>Outstanding</Text>
              </View>

              {/* Invoice Count */}
              <View style={[styles.statCard, { backgroundColor: COLORS.secondary }]}>
                <View style={styles.statIconContainer}>
                  <MaterialCommunityIcons name="file-document-multiple" size={28} color={COLORS.white} />
                </View>
                <Text style={styles.statValue}>{summary.invoice_count}</Text>
                <Text style={styles.statLabel}>Total Invoices</Text>
              </View>
            </View>

            {/* Status Breakdown */}
            {summary.status_breakdown && Object.keys(summary.status_breakdown).length > 0 && (
              <Card style={styles.breakdownCard}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="chart-pie" size={24} color={COLORS.primary} />
                  <Text style={styles.cardTitle}>Invoice Status</Text>
                </View>
                <View style={styles.statusGrid}>
                  {Object.entries(summary.status_breakdown).map(([status, count]) => (
                    <View key={status} style={styles.statusItem}>
                      <View style={[styles.statusIconCircle, { backgroundColor: getStatusColor(status) + '20' }]}>
                        <MaterialCommunityIcons
                          name={getStatusIcon(status)}
                          size={20}
                          color={getStatusColor(status)}
                        />
                      </View>
                      <Text style={styles.statusCount}>{count}</Text>
                      <Text style={styles.statusName}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

            {/* Payment Reminder */}
            <Card style={styles.reminderCard}>
              <View style={styles.reminderIcon}>
                <MaterialCommunityIcons name="information" size={24} color={COLORS.info} />
              </View>
              <View style={styles.reminderContent}>
                <Text style={styles.reminderTitle}>Payment Reminder</Text>
                <Text style={styles.reminderText}>
                  Please ensure all payments are made before the due date to avoid late fees.
                  Contact the finance office for any payment inquiries.
                </Text>
              </View>
            </Card>

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <TouchableOpacity style={styles.actionButton} onPress={handleMakePayment}>
                  <MaterialCommunityIcons name="credit-card" size={24} color={COLORS.primary} />
                  <Text style={styles.actionText}>Make Payment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleDownloadReceipt}>
                  <MaterialCommunityIcons name="file-download" size={24} color={COLORS.secondary} />
                  <Text style={styles.actionText}>Download Receipt</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialCommunityIcons name="history" size={24} color={COLORS.accent} />
                  <Text style={styles.actionText}>Payment History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleContactSupport}>
                  <MaterialCommunityIcons name="headset" size={24} color={COLORS.info} />
                  <Text style={styles.actionText}>Contact Support</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {selectedTab === 'invoices' && (
          <View style={styles.content}>
            {invoices.length === 0 ? (
              <Card style={styles.emptyCard}>
                <MaterialCommunityIcons name="inbox" size={80} color={COLORS.grayLight} />
                <Text style={styles.emptyTitle}>No Invoices</Text>
                <Text style={styles.emptySubtitle}>
                  Your invoices will appear here when they are generated
                </Text>
              </Card>
            ) : (
              invoices.map((invoice) => (
                <TouchableOpacity key={invoice.id} onPress={() => handleInvoicePress(invoice)}>
                  <Card style={styles.invoiceCard}>
                  <View style={styles.invoiceHeader}>
                    <View style={styles.invoiceLeft}>
                      <View style={[styles.invoiceIconCircle, { backgroundColor: getStatusColor(invoice.status) + '15' }]}>
                        <MaterialCommunityIcons
                          name={getStatusIcon(invoice.status)}
                          size={24}
                          color={getStatusColor(invoice.status)}
                        />
                      </View>
                      <View style={styles.invoiceInfo}>
                        <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
                        <Text style={styles.invoiceDate}>Issued {formatDate(invoice.issued_date)}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
                      <Text style={styles.statusBadgeText}>
                        {invoice.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.invoiceDivider} />

                  <View style={styles.invoiceDetails}>
                    <View style={styles.invoiceRow}>
                      <Text style={styles.invoiceLabel}>Total Amount</Text>
                      <Text style={styles.invoiceAmount}>{formatCurrency(invoice.total_amount)}</Text>
                    </View>
                    <View style={styles.invoiceRow}>
                      <Text style={styles.invoiceLabel}>Paid Amount</Text>
                      <Text style={[styles.invoiceAmount, { color: COLORS.success }]}>
                        {formatCurrency(invoice.paid_amount)}
                      </Text>
                    </View>
                    <View style={[styles.invoiceRow, styles.balanceRow]}>
                      <Text style={styles.balanceLabel}>Balance Due</Text>
                      <Text style={styles.balanceAmount}>{formatCurrency(invoice.balance)}</Text>
                    </View>
                    <View style={styles.invoiceRow}>
                      <Text style={styles.invoiceLabel}>Due Date</Text>
                      <Text style={[
                        styles.invoiceAmount,
                        new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && { color: COLORS.error }
                      ]}>
                        {formatDate(invoice.due_date)}
                        {new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && ' (Overdue)'}
                      </Text>
                    </View>
                  </View>

                  {invoice.notes && (
                    <View style={styles.notesContainer}>
                      <MaterialCommunityIcons name="note-text-outline" size={16} color={COLORS.gray} />
                      <Text style={styles.notesText}>{invoice.notes}</Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.viewDetailsButton}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </Card>
              </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Invoice Detail Modal */}
      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invoice Details</Text>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.black} />
              </TouchableOpacity>
            </View>

            {selectedInvoice && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalInvoiceHeader}>
                  <Text style={styles.modalInvoiceNumber}>{selectedInvoice.invoice_number}</Text>
                  <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedInvoice.status) }]}>
                    <Text style={styles.statusBadgeText}>{selectedInvoice.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Invoice Information</Text>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Issued Date:</Text>
                    <Text style={styles.modalInfoValue}>{formatDate(selectedInvoice.issued_date)}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Due Date:</Text>
                    <Text style={[
                      styles.modalInfoValue,
                      new Date(selectedInvoice.due_date) < new Date() && selectedInvoice.status !== 'paid' && { color: COLORS.error }
                    ]}>
                      {formatDate(selectedInvoice.due_date)}
                      {new Date(selectedInvoice.due_date) < new Date() && selectedInvoice.status !== 'paid' && ' (Overdue)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Amount Summary</Text>
                  <View style={styles.amountCard}>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Total Amount</Text>
                      <Text style={styles.amountValue}>{formatCurrency(selectedInvoice.total_amount)}</Text>
                    </View>
                    <View style={styles.amountRow}>
                      <Text style={styles.amountLabel}>Paid Amount</Text>
                      <Text style={[styles.amountValue, { color: COLORS.success }]}>
                        {formatCurrency(selectedInvoice.paid_amount)}
                      </Text>
                    </View>
                    <View style={styles.amountDivider} />
                    <View style={styles.amountRow}>
                      <Text style={styles.balanceLabel}>Balance Due</Text>
                      <Text style={styles.balanceValue}>{formatCurrency(selectedInvoice.balance)}</Text>
                    </View>
                  </View>
                </View>

                {selectedInvoice.notes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Notes</Text>
                    <View style={styles.notesCard}>
                      <MaterialCommunityIcons name="note-text-outline" size={20} color={COLORS.gray} />
                      <Text style={styles.modalNotesText}>{selectedInvoice.notes}</Text>
                    </View>
                  </View>
                )}

                {selectedInvoice.balance > 0 && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.modalPrimaryButton}
                      onPress={handleMakePayment}
                    >
                      <MaterialCommunityIcons name="credit-card" size={20} color={COLORS.white} />
                      <Text style={styles.modalPrimaryButtonText}>Make Payment</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.modalSecondaryButton}
                      onPress={handleDownloadReceipt}
                    >
                      <MaterialCommunityIcons name="download" size={20} color={COLORS.primary} />
                      <Text style={styles.modalSecondaryButtonText}>Download Invoice</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.base,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: '600' as any,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: FONTS['2xl'],
    fontWeight: '700' as any,
    color: COLORS.black,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
    marginBottom: SPACING.base,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.base,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONTS.base,
    color: COLORS.gray,
    fontWeight: '500' as any,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '700' as any,
  },
  content: {
    padding: SPACING.base,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.base,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '48%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.base,
    ...SHADOWS.base,
  },
  statIconContainer: {
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONTS.xl,
    fontWeight: '700' as any,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  breakdownCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  cardTitle: {
    fontSize: FONTS.lg,
    fontWeight: '700' as any,
    color: COLORS.black,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.base,
  },
  statusItem: {
    width: '30%',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  statusIconCircle: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statusCount: {
    fontSize: FONTS.xl,
    fontWeight: '700' as any,
    color: COLORS.black,
    marginBottom: SPACING.xs / 2,
  },
  statusName: {
    fontSize: FONTS.xs,
    color: COLORS.gray,
    textAlign: 'center',
  },
  reminderCard: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.info + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
    marginBottom: SPACING.lg,
  },
  reminderIcon: {
    marginRight: SPACING.base,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  reminderText: {
    fontSize: FONTS.sm,
    color: COLORS.grayDark,
    lineHeight: 20,
  },
  actionsContainer: {
    marginBottom: SPACING.lg,
  },
  actionsTitle: {
    fontSize: FONTS.lg,
    fontWeight: '700' as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.base,
  },
  actionButton: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  actionText: {
    fontSize: FONTS.sm,
    color: COLORS.black,
    marginTop: SPACING.xs,
    textAlign: 'center',
    fontWeight: '500' as any,
  },
  emptyCard: {
    padding: SPACING['3xl'],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONTS.xl,
    fontWeight: '600' as any,
    color: COLORS.black,
    marginTop: SPACING.base,
  },
  emptySubtitle: {
    fontSize: FONTS.base,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  invoiceCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.base,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  invoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  invoiceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
  },
  invoiceDate: {
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
  invoiceDivider: {
    height: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: SPACING.base,
  },
  invoiceDetails: {
    gap: SPACING.sm,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLabel: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  invoiceAmount: {
    fontSize: FONTS.sm,
    fontWeight: '600' as any,
    color: COLORS.black,
  },
  balanceRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  balanceLabel: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
  },
  balanceAmount: {
    fontSize: FONTS.lg,
    fontWeight: '700' as any,
    color: COLORS.error,
  },
  notesContainer: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.base,
    padding: SPACING.sm,
    backgroundColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  notesText: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.grayDark,
    fontStyle: 'italic',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.base,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  viewDetailsText: {
    fontSize: FONTS.sm,
    fontWeight: '600' as any,
    color: COLORS.primary,
    marginRight: SPACING.xs / 2,
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
    maxHeight: '85%',
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
  modalInvoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalInvoiceNumber: {
    fontSize: FONTS['2xl'],
    fontWeight: '700' as any,
    color: COLORS.black,
  },
  modalStatusBadge: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.base,
  },
  modalSection: {
    marginBottom: SPACING.xl,
  },
  modalSectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: '700' as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  modalInfoLabel: {
    fontSize: FONTS.base,
    color: COLORS.gray,
  },
  modalInfoValue: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
  },
  amountCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.base,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  amountLabel: {
    fontSize: FONTS.base,
    color: COLORS.gray,
  },
  amountValue: {
    fontSize: FONTS.base,
    fontWeight: '600' as any,
    color: COLORS.black,
  },
  amountDivider: {
    height: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: SPACING.base,
  },
  balanceLabel: {
    fontSize: FONTS.lg,
    fontWeight: '700' as any,
    color: COLORS.black,
  },
  balanceValue: {
    fontSize: FONTS.xl,
    fontWeight: '700' as any,
    color: COLORS.error,
  },
  notesCard: {
    flexDirection: 'row',
    gap: SPACING.sm,
    backgroundColor: COLORS.grayLight,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
  },
  modalNotesText: {
    flex: 1,
    fontSize: FONTS.base,
    color: COLORS.grayDark,
    lineHeight: 22,
  },
  modalActions: {
    gap: SPACING.base,
    marginBottom: SPACING.xl,
  },
  modalPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    gap: SPACING.sm,
  },
  modalPrimaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: '700' as any,
  },
  modalSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    gap: SPACING.sm,
  },
  modalSecondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.base,
    fontWeight: '700' as any,
  },
});

export default FinanceScreen;
