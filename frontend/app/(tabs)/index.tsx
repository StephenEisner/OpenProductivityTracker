import { Swipeable } from 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Button,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { initDb, deleteTask, insertTask, fetchTasks, markTaskDone } from '../../lib/db';

export default function HomeScreen() {
  const [tasks, setTasks] = useState<{ id: number; title: string; done: number }[]>([]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    const load = async () => {
      await initDb();
      const data = await fetchTasks();
      setTasks(data);
    };
    load();
  }, []);

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    await insertTask(newTask);
    const data = await fetchTasks();
    setTasks(data);
    setNewTask('');
  };

  const handleToggleDone = async (id: number, done: number) => {
    await markTaskDone(id, done ? 0 : 1);
    const data = await fetchTasks();
    setTasks(data);
  };

  const handleDelete = async (id: number) => {
    await deleteTask(id);
    const refreshedTasks = await fetchTasks(); // re-fetch from DB
    setTasks(refreshedTasks);                 // update UI
  };

//  const handleDelete = async (id: number) => {
//    console.log('[handleDelete] Called with ID:', id);
//    try {
//      await deleteTask(id);
//      console.log('[handleDelete] Successfully deleted task');
//      const refreshedTasks = await fetchTasks();
//      setTasks(refreshedTasks);
//    } catch (err) {
//      console.error('[handleDelete] Error:', err);
//    }
//  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80} // adjust if needed
      >
        <Text style={styles.heading}>FreeToDo</Text>

        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.taskList}

          renderItem={({ item }) => (
            <Swipeable
              renderRightActions={() => (
                <TouchableOpacity
                  onPress={async () => {
                    await handleDelete(item.id)
                  }}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            >
              <TouchableOpacity onPress={() => handleToggleDone(item.id, item.done)}>
                <Text style={item.done ? styles.doneTask : styles.task}>
                  {item.title}
                </Text>
              </TouchableOpacity>
            </Swipeable>
          )}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newTask}
            onChangeText={setNewTask}
            placeholder="New task..."
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
  task: {
    fontSize: 18,
    paddingVertical: 8,
  },
  doneTask: {
    fontSize: 18,
    paddingVertical: 8,
    textDecorationLine: 'line-through',
    color: '#888',
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

