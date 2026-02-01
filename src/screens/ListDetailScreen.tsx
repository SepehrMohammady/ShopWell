/**
 * List Detail Screen
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, ShoppingItem} from '../types';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {Card, Checkbox, EmptyState, Button} from '../components/common';
import {Spacing, FontSize} from '../constants';
import {formatDate, getCurrentTimestamp} from '../utils';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'ListDetail'>;

const ListDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {state, updateList} = useApp();
  const {colors} = useTheme();

  const listId = route.params.listId;
  const list = state.shoppingLists.find(l => l.id === listId);

  React.useEffect(() => {
    if (list) {
      navigation.setOptions({
        title: list.name,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEditList', {listId})}
            style={styles.headerButton}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [list]);

  if (!list) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <EmptyState
          icon="❌"
          title="List Not Found"
          message="This shopping list no longer exists."
        />
      </View>
    );
  }

  const handleToggleItem = (itemId: string) => {
    const updatedItems = list.items.map(item =>
      item.id === itemId ? {...item, isCompleted: !item.isCompleted} : item,
    );

    updateList({
      ...list,
      items: updatedItems,
      isCompleted: updatedItems.every(i => i.isCompleted),
      updatedAt: getCurrentTimestamp(),
    });
  };

  const handleClearCompleted = () => {
    const completedCount = list.items.filter(i => i.isCompleted).length;
    if (completedCount === 0) return;

    Alert.alert(
      'Clear Completed Items',
      `Remove ${completedCount} completed item${completedCount > 1 ? 's' : ''}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          onPress: () => {
            updateList({
              ...list,
              items: list.items.filter(i => !i.isCompleted),
              updatedAt: getCurrentTimestamp(),
            });
          },
        },
      ],
    );
  };

  const completedItems = list.items.filter(i => i.isCompleted);
  const pendingItems = list.items.filter(i => !i.isCompleted);
  const progress =
    list.items.length > 0
      ? (completedItems.length / list.items.length) * 100
      : 0;

  const renderItem = (item: ShoppingItem) => (
    <Card key={item.id}>
      <Checkbox
        checked={item.isCompleted}
        onToggle={() => handleToggleItem(item.id)}
        label={`${item.name}${item.quantity > 1 ? ` (${item.quantity})` : ''}`}
      />
      {item.notes && <Text style={[styles.itemNotes, {color: colors.textSecondary}]}>{item.notes}</Text>}
    </Card>
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}>
        {/* Progress Card */}
        <Card elevated>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, {color: colors.text}]}>Progress</Text>
            <Text style={[styles.progressPercentage, {color: colors.primary}]}>{Math.round(progress)}%</Text>
          </View>
          <View style={[styles.progressBar, {backgroundColor: colors.border}]}>
            <View style={[styles.progressFill, {width: `${progress}%`, backgroundColor: colors.primary}]} />
          </View>
          <Text style={[styles.progressMeta, {color: colors.textSecondary}]}>
            {completedItems.length} of {list.items.length} items completed
          </Text>
          {list.scheduledDate && (
            <Text style={[styles.scheduledDate, {color: colors.primary}]}>
              📅 Scheduled: {formatDate(list.scheduledDate)}
            </Text>
          )}
        </Card>

        {/* Pending Items */}
        {pendingItems.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              To Buy ({pendingItems.length})
            </Text>
            {pendingItems.map(renderItem)}
          </>
        )}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                Completed ({completedItems.length})
              </Text>
              <TouchableOpacity onPress={handleClearCompleted}>
                <Text style={[styles.clearText, {color: colors.primary}]}>Clear</Text>
              </TouchableOpacity>
            </View>
            {completedItems.map(renderItem)}
          </>
        )}

        {/* Empty State */}
        {list.items.length === 0 && (
          <EmptyState
            icon="📝"
            title="No Items"
            message="Add some items to this shopping list."
            actionLabel="Add Items"
            onAction={() => navigation.navigate('AddEditList', {listId})}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
  },
  headerButton: {
    paddingHorizontal: Spacing.base,
  },
  editText: {
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: FontSize.xl,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMeta: {
    fontSize: FontSize.sm,
  },
  scheduledDate: {
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  clearText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    marginLeft: 36,
  },
});

export default ListDetailScreen;
