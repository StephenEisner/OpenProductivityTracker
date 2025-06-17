// frontend/app/(tabs)/index.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { freelistAPI, Task } from '../../lib/FreelistRust';

const router = useRouter();

export default function HomeScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [tag, setTag] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      loadTasks();
    }
  }, [filter, isInitialized]);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      // Initialize with a file-based database
      // On mobile, you might want to use a path in the app's documents directory
      await freelistAPI.initialize('freelist.db');
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the database. The app may not work correctly.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!isInitialized) return;

    try {
      setIsLoading(true);
      const [tasksData, tagsData] = await Promise.all([
        freelistAPI.getTasks(filter),
        freelistAPI.getAllTags(),
      ]);
      
      setTasks(tasksData);
      setAvailableTags(tagsData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      Alert.alert('Error', 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || !isInitialized) return;

    try {
      setIsLoading(true);
      
      // Convert due date to ISO string if provided
      let isoDate = '';
      if (dueDate.trim()) {
        try {
          const date = new Date(dueDate);
          if (!isNaN(date.getTime())) {
            isoDate = date.toISOString();
          }
        } catch (e) {
          // Invalid date, ignore
        }
      }

      await freelistAPI.addTask(newTask, tag || undefined, isoDate || undefined);
      setNewTask('');
      setTag('');
      setDueDate('');
      await loadTasks();
    } catch (error) {
      console.error('Failed to add task:', error);
      Alert.alert('Error', 'Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDone = async (task: Task) => {
    try {
      await freelistAPI.markTaskDone(task.id, !task.done);
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await freelistAPI.deleteTask(id);
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  const filterTasksByTag = async (tagName: string) => {
    try {
      setIsLoading(true);
      const filteredTasks = await freelistAPI.getTasksByTag(tagName);
      setTasks(filteredTasks);
    } catch (error) {
      console.error('Failed to filter tasks:', error);
      Alert.alert('Error', 'Failed to filter tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const renderItem = ({ item }: { item: Task }) => (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    >
      <TouchableOpacity onPress={() => handleToggleDone(item)}>
        <View style={styles.taskItem}>
          <View style={styles.taskHeader}>
            <Text style={item.done ? styles.doneTask : styles.taskTitle}>
              {item.title}
            </Text>
            {item.done && <Text style={styles.checkmark}>✓</Text>}
          </View>
          
          {item.details && (
            <Text style={styles.taskDetails}>{item.details}</Text>
          )}
          
          <View style={styles.taskMeta}>
            {item.tag && <Text style={styles.taskTag}>#{item.tag}</Text>}
            {item.due_date && (
              <Text style={styles.taskDue}>Due: {formatDate(item.due_date)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Initializing FreeList...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FreeList</Text>
          <View style={styles.headerRight}>
            <Text style={styles.implementationIndicator}>
              {freelistAPI.isUsingNative() ? '🦀' : '💾'}
            </Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterContainer}>
          {(['all', 'todo', 'done'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.activeFilter]}
              onPress={() => setFilter(f)}
              disabled={isLoading}
            >
              <Text style={[styles.filterText, filter === f && styles.activeFilterText]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {availableTags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Tags:</Text>
            <View style={styles.tagsWrapper}>
              {availableTags.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.tagButton}
                  onPress={() => filterTasksByTag(t)}
                  disabled={isLoading}
                >
                  <Text style={styles.tagText}>#{t}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={loadTasks}
                disabled={isLoading}
              >
                <Text style={styles.clearFilterText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.taskList}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={loadTasks}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isLoading ? 'Loading tasks...' : 'No tasks found. Add one below!'}
              </Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newTask}
            onChangeText={setNewTask}
            placeholder="Task title"
            placeholderTextColor="#666"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            value={tag}
            onChangeText={setTag}
            placeholder="Tag (optional)"
            placeholderTextColor="#666"
            editable={!isLoading}
          />
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="Due date (YYYY-MM-DD)"
            placeholderTextColor="#666"
            editable={!isLoading}
          />
          <Button 
            title={isLoading ? "Adding..." : "Add Task"} 
            onPress={handleAddTask}
            disabled={isLoading || !newTask.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  implementationIndicator: {
    fontSize: 20,
    marginRight: 8,
  },
  settingsButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 20,
  },
  activeFilter: {
    backgroundColor: '#007bff',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activeFilterText: {
    color: '#fff',
  },
  tagsContainer: {
    paddingVertical: 8,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f3f4',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  tagText: {
    fontSize: 12,
    color: '#495057',
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#6c757d',
    borderRadius: 16,
  },
  clearFilterText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  taskList: {
    paddingBottom: 16,
    flexGrow: 1,
  },
  taskItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  doneTask: {
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'line-through',
    color: '#6c757d',
    flex: 1,
  },
  checkmark: {
    fontSize: 18,
    color: '#28a745',
    fontWeight: 'bold',
  },
  taskDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTag: {
    fontSize: 12,
    color: '#007bff',
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  taskDue: {
    fontSize: 12,
    color: '#dc3545',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    borderRadius: 12,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    borderRadius: 12,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: '#333',
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
