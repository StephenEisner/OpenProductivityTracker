// frontend/app/(tabs)/settings.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  Alert, 
  SafeAreaView,
  TouchableOpacity,
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { freelistAPI } from '../../lib/FreelistRust';

const router = useRouter();

export default function SettingsScreen() {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    Alert.alert(
      'Confirm Clear Data',
      'Are you sure you want to delete all tasks? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete all',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              await freelistAPI.clearAllTasks();
              Alert.alert(
                'Data Cleared', 
                'All tasks have been deleted successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/'),
                  }
                ]
              );
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    // Placeholder for future export functionality
    Alert.alert(
      'Export Data',
      'Export functionality will be implemented in a future version.',
      [{ text: 'OK' }]
    );
  };

  const handleImportData = () => {
    // Placeholder for future import functionality
    Alert.alert(
      'Import Data',
      'Import functionality will be implemented in a future version.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About FreeList',
      'FreeList is a simple task management app built with React Native and Rust.\n\nVersion: 1.0.0\nBuilt with ❤️ for productivity.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleExportData}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="download-outline" size={20} color="#007bff" />
              <Text style={styles.settingItemText}>Export Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleImportData}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="cloud-upload-outline" size={20} color="#007bff" />
              <Text style={styles.settingItemText}>Import Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleClearData}
            disabled={isClearing}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="trash-outline" size={20} color="#dc3545" />
              <Text style={[styles.settingItemText, styles.dangerText]}>
                {isClearing ? 'Clearing...' : 'Clear All Data'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#dc3545" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleAbout}
          >
            <View style={styles.settingItemContent}>
              <Ionicons name="information-circle-outline" size={20} color="#007bff" />
              <Text style={styles.settingItemText}>About FreeList</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            FreeList uses a Rust backend for fast, reliable task management.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#f8f9fa',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#dc3545',
  },
  footer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
