import React, { useState } from 'react';
import { Text, View, TextInput, Button, FlatList } from 'react-native';

export default function App() {
  const [tasks, setTasks] = useState<string[]>([]);
  const [input, setInput] = useState('');

  const addTask = () => {
    if (input.trim() !== '') {
      setTasks([...tasks, input]);
      setInput('');
    }
  };

  return (
    <View style={{ padding: 40 }}>
      <TextInput
        placeholder="Add task"
        value={input}
        onChangeText={setInput}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Button title="Add" onPress={addTask} />
      <FlatList
        data={tasks}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <Text style={{ fontSize: 18, marginVertical: 5 }}>• {item}</Text>}
      />
    </View>
  );
}   
