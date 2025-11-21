import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING } from '../constants/theme';

interface PDFViewerProps {
  visible: boolean;
  fileUrl: string;
  fileName: string;
  onClose: () => void;
  onDownload?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  visible,
  fileUrl,
  fileName,
  onClose,
  onDownload,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  // Encode URL for Google Docs viewer
  const getViewerUrl = () => {
    const encodedUrl = encodeURIComponent(fileUrl);
    return `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;
  };

  const handleError = () => {
    console.error('PDF Error: Failed to load');
    setError(true);
    setLoading(false);
    Alert.alert(
      'Error Loading PDF',
      'Unable to load the PDF file. The file might be too large or the format is not supported.',
      [
        { text: 'Close', onPress: onClose },
        ...(onDownload ? [{ text: 'Download', onPress: onDownload }] : []),
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Text style={styles.fileName} numberOfLines={1}>
              {fileName}
            </Text>
          </View>

          {onDownload && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={onDownload}
            >
              <MaterialCommunityIcons name="download" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* PDF Viewer using WebView */}
        <View style={styles.pdfContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          
          {!error && (
            <WebView
              source={{ uri: getViewerUrl() }}
              style={styles.pdf}
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={handleError}
              startInLoadingState={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scalesPageToFit={true}
            />
          )}

          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons 
                name="file-alert-outline" 
                size={64} 
                color={COLORS.gray} 
              />
              <Text style={styles.errorText}>Unable to load PDF</Text>
              {onDownload && (
                <TouchableOpacity 
                  style={styles.downloadButton}
                  onPress={onDownload}
                >
                  <MaterialCommunityIcons name="download" size={20} color="#fff" />
                  <Text style={styles.downloadButtonText}>Download Instead</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Footer with info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Scroll to navigate • Pinch to zoom
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: SPACING.base,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  fileName: {
    fontSize: FONTS.base,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  pageInfo: {
    fontSize: FONTS.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  pdfContainer: {
    flex: 1,
    position: 'relative',
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: COLORS.grayLight,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    zIndex: 10,
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
    padding: SPACING.lg,
  },
  errorText: {
    marginTop: SPACING.base,
    fontSize: FONTS.base,
    color: COLORS.gray,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.base,
    borderRadius: 8,
    marginTop: SPACING.lg,
  },
  downloadButtonText: {
    marginLeft: SPACING.xs,
    fontSize: FONTS.base,
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.sm,
    color: COLORS.gray,
  },
});

export default PDFViewer;
