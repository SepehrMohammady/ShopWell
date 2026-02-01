/**
 * Shopping Lists Screen
 */

import React from 'react';
import {View, FlatList, StyleSheet, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, ShoppingList} from '../types';
import {useApp} from '../context/AppContext';
import {useTheme} from '../context/ThemeContext';
import {Card, EmptyState, FAB} from '../components/common';
import {Spacing, FontSize} from '../constants';
import {formatDate} from '../utils';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ShoppingListsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {state} = useApp();
  const {colors} = useTheme();

  const handleAddList = () => {
    navigation.navigate('AddEditList', {});
  };

  const handleListPress = (listId: string) => {
    navigation.navigate('ListDetail', {listId});
  };

  const renderListItem = ({item}: {item: ShoppingList}) => {
    const completedItems = item.items.filter(i => i.isCompleted).length;
    const totalItems = item.items.length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return (
      <Card onPress={() => handleListPress(item.id)} elevated>
        <View style={styles.listHeader}>
          <Text style={[styles.listName, {color: colors.text}]}>{item.name}</Text>
          {item.isCompleted && <Text style={[styles.completedBadge, {color: colors.success}]}>✓</Text>}
        </View>
        <Text style={[styles.listMeta, {color: colors.textSecondary}]}>
          {totalItems} items • {completedItems} completed
        </Text>
        {item.scheduledDate && (
          <Text style={[styles.scheduledDate, {color: colors.primary}]}>
            📅 {formatDate(item.scheduledDate)}
          </Text>
        )}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, {backgroundColor: colors.border}]}>
            <View style={[styles.progressFill, {width: `${progress}%`, backgroundColor: colors.primary}]} />
          </View>
          <Text style={[styles.progressText, {color: colors.textSecondary}]}>{Math.round(progress)}%</Text>
        </View>
      </Card>
    );
  };

  if (state.shoppingLists.length === 0) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <EmptyState
          icon="📝"
          title="No Shopping Lists"
          message="Create your first shopping list to get started with smarter shopping."
          actionLabel="Create List"
          onAction={handleAddList}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={state.shoppingLists}
        renderItem={renderListItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <FAB onPress={handleAddList} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.base,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  listName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  completedBadge: {
    fontSize: FontSize.lg,
  },
  listMeta: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  scheduledDate: {
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FontSize.xs,
    marginLeft: Spacing.sm,
    width: 35,
    textAlign: 'right',
  },
});

export default ShoppingListsScreen;
