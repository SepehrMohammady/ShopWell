/**
 * Add/Edit Shopping List Screen
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, ShoppingList, ShoppingItem} from '../types';
import {useApp} from '../context/AppContext';
import {Button, Input, Card, Checkbox} from '../components/common';
import {Colors, Spacing, FontSize} from '../constants';
import {generateId, getCurrentTimestamp} from '../utils';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'AddEditList'>;

const AddEditListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {state, addList, updateList, deleteList} = useApp();

  const listId = route.params?.listId;
  const existingList = listId
    ? state.shoppingLists.find(l => l.id === listId)
    : undefined;

  const [name, setName] = useState(existingList?.name || '');
  const [items, setItems] = useState<ShoppingItem[]>(existingList?.items || []);
  const [newItemName, setNewItemName] = useState('');

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        existingList ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [existingList]);

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: generateId(),
      name: newItemName.trim(),
      quantity: 1,
      isCompleted: false,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    setItems([...items, newItem]);
    setNewItemName('');
  };

  const handleToggleItem = (itemId: string) => {
    setItems(
      items.map(item =>
        item.id === itemId
          ? {...item, isCompleted: !item.isCompleted}
          : item,
      ),
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    const now = getCurrentTimestamp();
    const list: ShoppingList = {
      id: existingList?.id || generateId(),
      name: name.trim(),
      items,
      isCompleted: items.length > 0 && items.every(i => i.isCompleted),
      createdAt: existingList?.createdAt || now,
      updatedAt: now,
    };

    if (existingList) {
      updateList(list);
    } else {
      addList(list);
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete List',
      'Are you sure you want to delete this shopping list?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteList(listId!);
            navigation.goBack();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Input
          label="List Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Weekly Groceries"
        />

        <Text style={styles.sectionTitle}>Items ({items.length})</Text>

        <View style={styles.addItemRow}>
          <Input
            value={newItemName}
            onChangeText={setNewItemName}
            placeholder="Add new item..."
            containerStyle={styles.addItemInput}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
          />
          <Button
            title="Add"
            onPress={handleAddItem}
            size="small"
            style={styles.addButton}
          />
        </View>

        {items.map(item => (
          <Card key={item.id}>
            <View style={styles.itemRow}>
              <Checkbox
                checked={item.isCompleted}
                onToggle={() => handleToggleItem(item.id)}
                label={item.name}
              />
              <TouchableOpacity
                onPress={() => handleRemoveItem(item.id)}
                style={styles.removeButton}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={existingList ? 'Save Changes' : 'Create List'}
          onPress={handleSave}
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
    paddingBottom: 120,
  },
  headerButton: {
    paddingHorizontal: Spacing.base,
  },
  deleteText: {
    color: Colors.error,
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  addItemInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: Spacing.sm,
  },
  addButton: {
    marginBottom: 0,
    height: 48,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  removeButton: {
    padding: Spacing.sm,
  },
  removeText: {
    color: Colors.error,
    fontSize: FontSize.lg,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

export default AddEditListScreen;
