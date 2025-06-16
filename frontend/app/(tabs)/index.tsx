
// app/(tabs)/index.tsx
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
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import {
  initDb,
  insertTask,
  fetchTasks,
  fetchAllTags,
  markTaskDone,
  deleteTask,
} from '../../lib/db';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const router = useRouter();

export default function HomeScreen() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [tag, setTag] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'done' | 'todo'>('all');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      await initDb();
      const data = await fetchTasks(filter);
      setTasks(data);
      const tags = await fetchAllTags();
      setAvailableTags(tags);
    };
    load();
  }, [filter]);

  const refreshTasks = async () => {
    const data = await fetchTasks(filter);
    setTasks(data);
    const tags = await fetchAllTags();
    setAvailableTags(tags);
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;

    await insertTask(newTask, '', dueDate, 0, 0, tag, null);
    setNewTask('');
    setDueDate('');
    setTag('');
    await refreshTasks();
  };

  const handleToggleDone = async (id, done) => {
    await markTaskDone(id, done ? 0 : 1);
    await refreshTasks();
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    await refreshTasks();
  };

  const renderItem = ({ item }) => (
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
      <TouchableOpacity onPress={() => handleToggleDone(item.id, item.done)}>
        <View style={styles.taskItem}>
          <Text style={item.done ? styles.doneTask : styles.taskTitle}>
            {item.title}
          </Text>
          {item.tag ? <Text style={styles.taskTag}>#{item.tag}</Text> : null}
          {item.due_date ? (
            <Text style={styles.taskDue}>Due: {item.due_date}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.topBar}>
          <View style={styles.filterContainer}>
            {['all', 'todo', 'done'].map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.filterButton, filter === f && styles.activeFilter]}
                onPress={() => setFilter(f)}
              >
                <Text style={styles.filterText}>{f.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
            {availableTags.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.filterButton}
                onPress={async () => {
                  const data = await fetchTasks(filter, t);
                  setTasks(data);
                }}
              >
                <Text style={styles.filterText}>#{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.taskList}
          renderItem={renderItem}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newTask}
            onChangeText={setNewTask}
            placeholder="Task title"
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.input}
            value={tag}
            onChangeText={setTag}
            placeholder="Tag (optional)"
            placeholderTextColor="#666"
          />
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="Due date (YYYY-MM-DD)"
            placeholderTextColor="#666"
          />
          <Button title="Add Task" onPress={handleAddTask} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 8,
  },
  filterButton: {
    padding: 6,
    backgroundColor: '#eee',
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  activeFilter: {
    backgroundColor: '#cde',
  },
  filterText: {
    fontSize: 14,
  },
  settingsButton: {
    padding: 4,
  },
  taskList: {
    paddingBottom: 16,
  },
  taskItem: {
    paddingVertical: 8,
  },
  taskTitle: {
    fontSize: 18,
    color: '#000',
  },
  doneTask: {
    fontSize: 18,
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskTag: {
    fontSize: 14,
    color: '#555',
  },
  taskDue: {
    fontSize: 14,
    color: '#c00',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    color: '#000',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    borderRadius: 6,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

