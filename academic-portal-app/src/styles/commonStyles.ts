import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';

/**
 * Common reusable styles for the entire application
 * Import and use these instead of creating duplicate styles in each screen
 */

export const commonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  
  paddedContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.base,
  },

  // Loading states
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

  // Error states
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  
  errorText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.error,
    textAlign: 'center',
  },

  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secondaryButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  outlineButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.base,
    borderRadius: BORDER_RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonText: {
    color: COLORS.white,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
  },
  
  outlineButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
  },

  // Text styles
  heading1: {
    fontSize: FONTS['3xl'],
    fontWeight: FONTS.bold as any,
    color: COLORS.black,
  },
  
  heading2: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold as any,
    color: COLORS.black,
  },
  
  heading3: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
  },
  
  bodyText: {
    fontSize: FONTS.base,
    color: COLORS.black,
  },
  
  smallText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
  
  linkText: {
    fontSize: FONTS.base,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  // Card styles
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    ...SHADOWS.base,
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  
  cardTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
  },

  // Header styles
  header: {
    backgroundColor: COLORS.header,
    paddingTop: SPACING['3xl'],
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold as any,
    color: COLORS.white,
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Form styles
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.base,
    color: COLORS.black,
  },
  
  inputFocused: {
    borderColor: COLORS.primary,
  },
  
  inputError: {
    borderColor: COLORS.error,
  },
  
  label: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.medium as any,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  
  errorMessage: {
    fontSize: FONTS.sm,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },

  // List styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.base,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  
  listItemContent: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  
  listItemTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
  },
  
  listItemSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: SPACING.xs,
  },

  // Badge/Tag styles
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  
  badgePrimary: {
    backgroundColor: COLORS.primary,
  },
  
  badgeSuccess: {
    backgroundColor: COLORS.success,
  },
  
  badgeWarning: {
    backgroundColor: COLORS.warning,
  },
  
  badgeError: {
    backgroundColor: COLORS.error,
  },
  
  badgeText: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.medium as any,
    color: COLORS.white,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: COLORS.grayLight,
    marginVertical: SPACING.base,
  },

  // Section Title
  sectionTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginBottom: SPACING.base,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '48%',
    backgroundColor: COLORS.grayLight,
    borderRadius: BORDER_RADIUS.base,
    padding: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  quickActionTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: FONTS.xs,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },

  // Overview/Stat Cards
  overviewContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },
  overviewCard: {
    flex: 1,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    padding: SPACING.base,
  },
  statCard: {
    borderRadius: BORDER_RADIUS.base,
    padding: SPACING.base,
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  statValue: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold as any,
    color: COLORS.white,
    marginTop: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    marginTop: SPACING.xs,
    opacity: 0.9,
  },

  // List Items with Icon/Line
  listItemWithLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  itemLine: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: SPACING.base,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONTS.base,
    fontWeight: FONTS.semibold as any,
    color: COLORS.black,
  },
  itemSubtitle: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyStateText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.gray,
    textAlign: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.sm,
  },

  // Greeting/Welcome
  greeting: {
    fontSize: FONTS['2xl'],
    fontWeight: FONTS.bold as any,
    color: COLORS.white,
    backgroundColor: COLORS.header,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.base,
    alignSelf: 'flex-start',
  },

  // Spacing utilities
  mt_xs: { marginTop: SPACING.xs },
  mt_sm: { marginTop: SPACING.sm },
  mt_base: { marginTop: SPACING.base },
  mt_lg: { marginTop: SPACING.lg },
  mt_xl: { marginTop: SPACING.xl },
  
  mb_xs: { marginBottom: SPACING.xs },
  mb_sm: { marginBottom: SPACING.sm },
  mb_base: { marginBottom: SPACING.base },
  mb_lg: { marginBottom: SPACING.lg },
  mb_xl: { marginBottom: SPACING.xl },
  
  mx_base: { marginHorizontal: SPACING.base },
  my_base: { marginVertical: SPACING.base },
  
  p_base: { padding: SPACING.base },
  px_base: { paddingHorizontal: SPACING.base },
  py_base: { paddingVertical: SPACING.base },

  // Flexbox utilities
  row: {
    flexDirection: 'row',
  },
  
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  flex1: {
    flex: 1,
  },

  // Shadow utilities
  shadow_sm: SHADOWS.sm,
  shadow_base: SHADOWS.base,
  shadow_lg: SHADOWS.lg,
});
