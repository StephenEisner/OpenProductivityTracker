// frontend/components/NativeModuleTest.tsx
// Temporary component to test native module loading

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeModules } from 'react-native';

export default function NativeModuleTest() {
  const [moduleStatus, setModuleStatus] = useState<string>('Checking...');
  const [availableModules, setAvailableModules] = useState<string[]>([]);

  useEffect(() => {
    checkNativeModule();
  }, []);

  const checkNativeModule = () => {
    console.log('🔍 Available Native Modules:', Object.keys(NativeModules));
    
    const modules = Object.keys(NativeModules);
    setAvailableModules(modules);

    if (NativeModules.FreelistRust) {
      setModuleStatus('✅ FreelistRust module found!');
      console.log('✅ FreelistRust module:', NativeModules.FreelistRust);
      
      // Test a simple method
      NativeModules.FreelistRust.initializeDatabase()
        .then(() => {
          setModuleStatus('✅ FreelistRust module working!');
          console.log('✅ Native module initialized successfully');
        })
        .catch((error: any) => {
          setModuleStatus(`⚠️ Module found but error: ${error.message}`);
          console.error('❌ Native module error:', error);
        });
    } else {
      setModuleStatus('❌ FreelistRust module NOT found');
      console.log('❌ FreelistRust not in available modules');
    }
  };

  const testBasicFunctionality = async () => {
    if (!NativeModules.FreelistRust) {
      setModuleStatus('❌ No module to test');
      return;
    }

    try {
      setModuleStatus('🧪 Testing...');
      
      // Test initialization
      await NativeModules.FreelistRust.initializeDatabase();
      console.log('✅ Initialize OK');
      
      // Test adding a task
      const taskId = await NativeModules.FreelistRust.addTask('Test Task', 'test', '');
      console.log('✅ Add task OK, ID:', taskId);
      
      // Test getting tasks
      const tasks = await NativeModules.FreelistRust.getTasks('all');
      console.log('✅ Get tasks OK, count:', tasks.length);
      
      setModuleStatus(`✅ All tests passed! Task ID: ${taskId}`);
    } catch (error: any) {
      setModuleStatus(`❌ Test failed: ${error.message}`);
      console.error('❌ Test error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Native Module Debug</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.status}>{moduleStatus}</Text>
      </View>
      
      <View style={styles.modulesContainer}>
        <Text style={styles.modulesLabel}>Available Modules ({availableModules.length}):</Text>
        {availableModules.slice(0, 10).map((module, index) => (
          <Text key={index} style={styles.moduleItem}>
            {module === 'FreelistRust' ? '🦀 ' : '• '}{module}
          </Text>
        ))}
        {availableModules.length > 10 && (
          <Text style={styles.moduleItem}>... and {availableModules.length - 10} more</Text>
        )}
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="Recheck Module" onPress={checkNativeModule} />
        {NativeModules.FreelistRust && (
          <Button title="Test Functionality" onPress={testBasicFunctionality} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  status: {
    fontSize: 14,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  modulesContainer: {
    marginBottom: 15,
  },
  modulesLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  moduleItem: {
    fontSize: 12,
    marginLeft: 10,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    gap: 10,
  },
});
