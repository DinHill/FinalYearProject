import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';
import Card from '../../components/common/Card';
import { api } from '../../services/api';
import { commonStyles } from '../../styles/commonStyles';

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_id: number;
  target_audience: string;
  is_published: boolean;
  publish_date: string | null;
  expire_date: string | null;
  created_at: string;
  updated_at: string | null;
}

const AnnouncementsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getAnnouncements(1, 50);
      if (!response.success) {
        throw new Error(response.error || 'Failed to load announcements');
      }
      setAnnouncements(response.data?.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnnouncements();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience.toLowerCase()) {
      case 'all':
        return COLORS.primary;
      case 'students':
        return COLORS.secondary;
      case 'teachers':
        return COLORS.success;
      case 'staff':
        return COLORS.warning;
      default:
        return COLORS.gray;
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience.toLowerCase()) {
      case 'all':
        return 'account-group';
      case 'students':
        return 'school';
      case 'teachers':
        return 'human-male-board';
      case 'staff':
        return 'briefcase';
      default:
        return 'account';
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <View style={commonStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={commonStyles.loadingText}>Loading announcements...</Text>
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
          <TouchableOpacity style={commonStyles.primaryButton} onPress={loadAnnouncements}>
            <Text style={commonStyles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (selectedAnnouncement) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedAnnouncement(null)} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Announcement</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.detailScrollView}>
          <View style={styles.detailContent}>
            <Text style={styles.detailTitle}>{selectedAnnouncement.title}</Text>
            
            <View style={styles.detailMeta}>
              <View style={[styles.audienceBadge, { backgroundColor: getAudienceColor(selectedAnnouncement.target_audience) + '20' }]}>
                <MaterialCommunityIcons
                  name={getAudienceIcon(selectedAnnouncement.target_audience)}
                  size={14}
                  color={getAudienceColor(selectedAnnouncement.target_audience)}
                />
                <Text style={[styles.audienceBadgeText, { color: getAudienceColor(selectedAnnouncement.target_audience) }]}>
                  {selectedAnnouncement.target_audience.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.detailDate}>
                {formatDate(selectedAnnouncement.publish_date || selectedAnnouncement.created_at)}
              </Text>
            </View>

            <View style={styles.detailDivider} />

            <Text style={styles.detailBody}>{stripHtml(selectedAnnouncement.content)}</Text>

            {selectedAnnouncement.expire_date && (
              <View style={styles.expiryNotice}>
                <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.warning} />
                <Text style={styles.expiryText}>
                  Expires on {new Date(selectedAnnouncement.expire_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={commonStyles.header}>
        <View style={styles.logoContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.logo}>
            <MaterialCommunityIcons name="bullhorn" size={24} color={COLORS.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerText}>Announcements</Text>
            <Text style={styles.headerSubtitle}>Stay updated with campus news</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          {announcements.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="bullhorn-outline" size={64} color={COLORS.gray} />
              <Text style={styles.emptyText}>No announcements</Text>
              <Text style={styles.emptySubtext}>
                New announcements will appear here when posted
              </Text>
            </Card>
          ) : (
            announcements.map((announcement) => (
              <TouchableOpacity
                key={announcement.id}
                onPress={() => setSelectedAnnouncement(announcement)}
              >
                <Card style={styles.announcementCard}>
                  <View style={styles.announcementHeader}>
                    <View style={styles.announcementIcon}>
                      <MaterialCommunityIcons name="bullhorn" size={20} color={COLORS.primary} />
                    </View>
                    <View style={styles.announcementHeaderContent}>
                      <Text style={styles.announcementTitle} numberOfLines={2}>
                        {announcement.title}
                      </Text>
                      <View style={styles.announcementMeta}>
                        <View style={[styles.audienceBadge, { backgroundColor: getAudienceColor(announcement.target_audience) + '20' }]}>
                          <MaterialCommunityIcons
                            name={getAudienceIcon(announcement.target_audience)}
                            size={12}
                            color={getAudienceColor(announcement.target_audience)}
                          />
                          <Text style={[styles.audienceBadgeText, { fontSize: FONTS.xs, color: getAudienceColor(announcement.target_audience) }]}>
                            {announcement.target_audience.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.announcementDate}>
                          {formatDate(announcement.publish_date || announcement.created_at)}
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
                  </View>

                  <Text style={styles.announcementPreview} numberOfLines={2}>
                    {stripHtml(announcement.content)}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
    marginRight: SPACING.sm,
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
    fontWeight: '600',
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
  headerSubtitle: {
    color: COLORS.white,
    opacity: 0.8,
    fontSize: FONTS.sm,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  announcementCard: {
    marginBottom: SPACING.base,
    padding: SPACING.lg,
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.base,
  },
  announcementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.base,
  },
  announcementHeaderContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: FONTS.lg,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  announcementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  audienceBadgeText: {
    fontSize: FONTS.xs - 1,
    fontWeight: '700',
  },
  announcementDate: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  announcementPreview: {
    fontSize: FONTS.base,
    color: COLORS.gray,
    lineHeight: 20,
  },
  emptyCard: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.lg,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    fontSize: FONTS.base,
    color: COLORS.gray,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  // Detail view styles
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  backButton: {
    padding: SPACING.xs,
  },
  detailHeaderTitle: {
    fontSize: FONTS.lg,
    fontWeight: '700',
    color: COLORS.black,
  },
  detailScrollView: {
    flex: 1,
  },
  detailContent: {
    padding: SPACING.lg,
  },
  detailTitle: {
    fontSize: FONTS['2xl'],
    fontWeight: '700',
    color: COLORS.black,
    lineHeight: 32,
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.base,
  },
  detailDate: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: SPACING.lg,
  },
  detailBody: {
    fontSize: FONTS.base,
    color: COLORS.black,
    lineHeight: 24,
  },
  expiryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
    padding: SPACING.base,
    backgroundColor: COLORS.warning + '15',
    borderRadius: BORDER_RADIUS.base,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  expiryText: {
    fontSize: FONTS.sm,
    color: COLORS.warning,
    fontWeight: '600',
  },
});

export default AnnouncementsScreen;
