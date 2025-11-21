import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
}

export async function downloadFile(
  url: string,
  filename: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string | null> {
  try {
    const fileUri = FileSystem.documentDirectory + filename;

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      (downloadProgress) => {
        const progress = {
          totalBytesWritten: downloadProgress.totalBytesWritten,
          totalBytesExpectedToWrite: downloadProgress.totalBytesExpectedToWrite,
          progress: downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite,
        };
        onProgress?.(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();
    
    if (result) {
      Alert.alert('Success', `File downloaded to: ${result.uri}`);
      return result.uri;
    }
    
    return null;
  } catch (error) {
    console.error('Download error:', error);
    Alert.alert('Error', 'Failed to download file');
    return null;
  }
}

export async function getFileInfo(fileUri: string) {
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    return info;
  } catch (error) {
    console.error('Get file info error:', error);
    return null;
  }
}

export async function deleteFile(fileUri: string) {
  try {
    await FileSystem.deleteAsync(fileUri);
    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
}

export async function readFile(fileUri: string) {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    return content;
  } catch (error) {
    console.error('Read file error:', error);
    return null;
  }
}

export async function writeFile(fileUri: string, content: string) {
  try {
    await FileSystem.writeAsStringAsync(fileUri, content);
    return true;
  } catch (error) {
    console.error('Write file error:', error);
    return false;
  }
}
