
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
  markTaskDone,
  deleteTask,
} from '../../lib/db';

export default function HomeScreen() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [tag, setTag] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    const load = async () => {
      await initDb();
      const data = await fetchTasks();
      setTasks(data);
    };
    load();
  }, []);

  const refreshTasks = async () => {
    const data = await fetchTasks();
    setTasks(data);
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
        <Text style={styles.heading}>FreeToDo</Text>

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
          />
          <TextInput
            style={styles.input}
            value={tag}
            onChangeText={setTag}
            placeholder="Tag (optional)"
          />
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="Due date (YYYY-MM-DD)"
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
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 16,
    alignSelf: 'center',
  },
  taskList: {
    paddingBottom: 16,
  },
  taskItem: {
    paddingVertical: 8,
  },
  taskTitle: {
    fontSize: 18,
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

