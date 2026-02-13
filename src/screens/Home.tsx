import React, { useEffect, useState } from 'react';
import { View, Pressable, Text, FlatList, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTodos } from '../hooks/useTodos';
import TodoItem from '../components/TodoItem';
import CreateTodoModal from '../components/CreateTodoModal';
import { stylesHome } from '../styles/Home.styles';


export default function Home() {
  const { todos, add, toggle, remove } = useTodos();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates?.height || 0)
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const margin = 16;
  const fabBottom = margin + Math.max(insets.bottom, keyboardHeight);


  return (
    <View style={stylesHome.geral}>
      <FlatList
        data={todos}
        keyExtractor={t => t.id}
        renderItem={({ item }) => (
          <TodoItem todo={item} onToggle={toggle} onRemove={remove} />
        )}
      />
      <View style={[stylesHome.fabContainer, { bottom: fabBottom }]}>
        <Pressable
          style={stylesHome.fab}
          onPress={() => setModalVisible(true)}
          android_ripple={{ color: 'rgba(255,255,255,0.18)', borderless: false }}
          accessibilityRole="button"
        >
          <Text style={stylesHome.fabText}>+</Text>
        </Pressable>
      </View>

      <CreateTodoModal visible={modalVisible} onClose={() => { setModalVisible(false); }} onAdd={(title) => { add(title); }} />
    </View>
  );
}