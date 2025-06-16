
// app/(tabs)/settings.tsx
import React from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  clearDatabase,
  fetchTasks
} from '../../lib/db';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('freelist.db');
const router = useRouter();

export default function SettingsScreen() {
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
                        await clearDatabase();
                        Alert.alert('Data Cleared', 'All tasks have been deleted.');
                        router.replace('/'); // navigate back to task list
                    } catch (error) {
                      Alert.alert('Error', 'Failed to clear data.');
                    }
              },
            },
          ]
        );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Button title="Clear All Data" onPress={handleClearData} />
      <View style={styles.spacer} />
      <Button title="Go Back" onPress={() => router.push('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  spacer: {
    height: 16,
  },
});

