/**
 * Add/Edit Schedule Screen
 * Redesigned: custom app-themed pickers, product assignment
 */

import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList, Schedule, ProductCategoryInfo, ProductCategory} from '../types';
import {useApp} from '../context/AppContext';
import {scheduleReminderNotification, cancelScheduleNotification} from '../services/NotificationService';
import {useTheme} from '../context/ThemeContext';
import {Button, Input, Card, useAlert} from '../components/common';
import {DatePickerModal} from '../components/common/DatePickerModal';
import {TimePickerModal} from '../components/common/TimePickerModal';
import {Spacing, FontSize} from '../constants';
import {generateId, getCurrentTimestamp, formatDate} from '../utils';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'AddEditSchedule'>;

const recurringOptions = [
  {id: 'none', label: 'No Repeat'},
  {id: 'daily', label: 'Daily'},
  {id: 'weekly', label: 'Weekly'},
  {id: 'monthly', label: 'Monthly'},
];



const AddEditScheduleScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const {state, addSchedule, updateSchedule, deleteSchedule} = useApp();
  const {colors} = useTheme();
  const {showAlert} = useAlert();

  const scheduleId = route.params?.scheduleId;
  const existingSchedule = scheduleId
    ? state.schedules.find(s => s.id === scheduleId)
    : undefined;

  const [title, setTitle] = useState(existingSchedule?.title || '');
  const [date, setDate] = useState(
    existingSchedule?.date || new Date().toISOString(),
  );
  const [timeEnabled, setTimeEnabled] = useState(!!existingSchedule?.time);
  const [timeDate, setTimeDate] = useState<Date>(() => {
    if (existingSchedule?.time) {
      const match = existingSchedule.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (match) {
        const d = new Date();
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const period = match[3];
        if (period?.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;
        d.setHours(hours, minutes, 0, 0);
        return d;
      }
    }
    const d = new Date();
    d.setHours(9, 0, 0, 0);
    return d;
  });
  const [selectedShopId, setSelectedShopId] = useState(
    existingSchedule?.shopId || '',
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    existingSchedule?.productIds || [],
  );
  const [recurring, setRecurring] = useState<string>(
    existingSchedule?.recurringPattern || 'none',
  );
  const [reminderEnabled, setReminderEnabled] = useState(
    existingSchedule?.reminder || false,
  );
  const [notes, setNotes] = useState(existingSchedule?.notes || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showShopPicker, setShowShopPicker] = useState(false);

  const toggleGroup = (key: string) =>
    setExpandedGroups(prev => ({...prev, [key]: !prev[key]}));

  const handleDateChange = (selectedDate: Date) => {
    setShowDatePicker(false);
    setDate(selectedDate.toISOString());
  };

  const handleTimeChange = (selectedTime: Date) => {
    setShowTimePicker(false);
    setTimeDate(selectedTime);
  };

  const formatTime = (d: Date): string => {
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 || 12;
    return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId],
    );
  };

  const selectAllProducts = () => {
    const allIds = state.products.map(p => p.id);
    setSelectedProductIds(allIds);
  };

  const deselectAllProducts = () => {
    setSelectedProductIds([]);
  };

  // Group & filter products
  const groupedProducts = useMemo(() => {
    const searchLower = productSearch.toLowerCase();
    const filtered = state.products.filter(
      p => !productSearch || p.name.toLowerCase().includes(searchLower),
    );
    // Shopping list items first, then group by category
    const shoppingList = filtered.filter(p => !p.isAvailable);
    const available = filtered.filter(p => p.isAvailable);

    const groups: {title: string; key: string; items: typeof filtered}[] = [];
    if (shoppingList.length > 0) {
      groups.push({title: 'Shopping List', key: 'shopping', items: shoppingList});
    }
    // Group available by category
    const byCategory = new Map<ProductCategory, typeof filtered>();
    available.forEach(p => {
      const list = byCategory.get(p.category) || [];
      list.push(p);
      byCategory.set(p.category, list);
    });
    byCategory.forEach((items, cat) => {
      const info = ProductCategoryInfo[cat];
      groups.push({title: info?.label || cat, key: cat, items});
    });
    return groups;
  }, [state.products, productSearch]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        existingSchedule ? (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [existingSchedule]);

  const handleSave = () => {
    if (!title.trim()) {
      showAlert({title: 'Error', message: 'Please enter a title'});
      return;
    }

    const now = getCurrentTimestamp();
    const schedule: Schedule = {
      id: existingSchedule?.id || generateId(),
      title: title.trim(),
      date,
      time: timeEnabled ? formatTime(timeDate) : undefined,
      shopId: selectedShopId || undefined,
      productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
      isRecurring: recurring !== 'none',
      recurringPattern:
        recurring !== 'none'
          ? (recurring as 'daily' | 'weekly' | 'monthly')
          : undefined,
      reminder: reminderEnabled,
      reminderMinutes: reminderEnabled ? 0 : undefined,
      notes: notes.trim() || undefined,
      isCompleted: existingSchedule?.isCompleted || false,
      createdAt: existingSchedule?.createdAt || now,
      updatedAt: now,
    };

    if (existingSchedule) {
      updateSchedule(schedule);
    } else {
      addSchedule(schedule);
    }

    // Register or cancel the reminder notification
    if (schedule.reminder) {
      const shopName = schedule.shopId
        ? state.shops.find(s => s.id === schedule.shopId)?.name
        : undefined;
      scheduleReminderNotification(schedule, shopName);
    } else {
      cancelScheduleNotification(schedule.id);
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    showAlert({
      title: 'Delete Schedule',
      message: 'Are you sure you want to delete this schedule?',
      buttons: [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSchedule(scheduleId!);
            navigation.goBack();
          },
        },
      ],
    });
  };

  const handleToggleComplete = () => {
    if (existingSchedule) {
      updateSchedule({
        ...existingSchedule,
        isCompleted: !existingSchedule.isCompleted,
        updatedAt: getCurrentTimestamp(),
      });
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <Input
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Weekly grocery shopping"
        />

        <Text style={[styles.label, {color: colors.text}]}>Date</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <Card>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.dateText, {color: colors.text}]}>{formatDate(date)}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </TouchableOpacity>
        <DatePickerModal
          visible={showDatePicker}
          value={new Date(date)}
          minimumDate={new Date()}
          onConfirm={handleDateChange}
          onCancel={() => setShowDatePicker(false)}
        />

        <Text style={[styles.label, {color: colors.text}]}>Time</Text>
        <TouchableOpacity
          onPress={() => {
            if (!timeEnabled) {
              setTimeEnabled(true);
              setShowTimePicker(true);
            } else {
              setShowTimePicker(true);
            }
          }}>
          <Card>
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} />
              <Text style={[styles.dateText, {color: timeEnabled ? colors.text : colors.textSecondary}]}>
                {timeEnabled ? formatTime(timeDate) : 'No time set — tap to add'}
              </Text>
              {timeEnabled && (
                <TouchableOpacity
                  onPress={() => {
                    setTimeEnabled(false);
                    setShowTimePicker(false);
                  }}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </Card>
        </TouchableOpacity>
        <TimePickerModal
          visible={showTimePicker}
          value={timeDate}
          onConfirm={handleTimeChange}
          onCancel={() => setShowTimePicker(false)}
        />

        <Text style={[styles.label, {color: colors.text}]}>Repeat</Text>
        <View style={styles.optionRow}>
          {recurringOptions.map(option => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                {backgroundColor: colors.surface, borderColor: colors.border},
                recurring === option.id && {backgroundColor: colors.primary, borderColor: colors.primary},
              ]}
              onPress={() => setRecurring(option.id)}>
              <Text
                style={[
                  styles.optionText,
                  {color: colors.text},
                  recurring === option.id && {color: colors.textInverse},
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, {color: colors.text}]}>Reminder</Text>
        <TouchableOpacity
          style={[
            styles.reminderToggle,
            {backgroundColor: colors.surface, borderColor: reminderEnabled ? colors.primary : colors.border},
            reminderEnabled && {backgroundColor: colors.primary + '10'},
          ]}
          onPress={() => setReminderEnabled(!reminderEnabled)}
          activeOpacity={0.7}>
          <MaterialCommunityIcons
            name={reminderEnabled ? 'bell-ring' : 'bell-off-outline'}
            size={20}
            color={reminderEnabled ? colors.primary : colors.textSecondary}
          />
          <View style={styles.reminderToggleInfo}>
            <Text style={[styles.reminderToggleText, {color: reminderEnabled ? colors.primary : colors.text}]}>
              {reminderEnabled ? 'Reminder On' : 'No Reminder'}
            </Text>
            {reminderEnabled && (
              <Text style={[styles.reminderToggleHint, {color: colors.textSecondary}]}>
                Notifies at the scheduled time
              </Text>
            )}
          </View>
          <View style={[styles.toggleSwitch, {backgroundColor: reminderEnabled ? colors.primary : colors.border}]}>
            <View style={[styles.toggleKnob, reminderEnabled && styles.toggleKnobActive]} />
          </View>
        </TouchableOpacity>

        {state.shops.length > 0 && (
          <>
            <Text style={[styles.label, {color: colors.text}]}>Assign to Shop (optional)</Text>
            <TouchableOpacity
              style={[styles.shopDropdown, {backgroundColor: colors.surface, borderColor: selectedShopId ? colors.primary : colors.border}]}
              onPress={() => setShowShopPicker(true)}>
              <MaterialCommunityIcons name="store" size={18} color={selectedShopId ? colors.primary : colors.textSecondary} />
              <Text style={[styles.shopDropdownText, {color: selectedShopId ? colors.text : colors.textSecondary}]}>
                {selectedShopId ? state.shops.find(s => s.id === selectedShopId)?.name || 'Select Shop' : 'No shop assigned'}
              </Text>
              {selectedShopId ? (
                <TouchableOpacity
                  onPress={() => setSelectedShopId('')}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : (
                <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
            <Modal
              visible={showShopPicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowShopPicker(false)}>
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: colors.surface}]}>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: colors.text}]}>Select Shop</Text>
                    <TouchableOpacity onPress={() => setShowShopPicker(false)}>
                      <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  <FlatList
                    data={[{id: '', name: 'None', isFavorite: false}, ...state.shops]}
                    keyExtractor={s => s.id || '_none'}
                    renderItem={({item: s}) => {
                      const isSelected = selectedShopId === s.id;
                      return (
                        <TouchableOpacity
                          style={[styles.modalItem, isSelected && {backgroundColor: colors.primary + '15'}]}
                          onPress={() => {
                            setSelectedShopId(s.id);
                            setShowShopPicker(false);
                          }}>
                          <MaterialCommunityIcons
                            name={s.id ? 'store' : 'close-circle-outline'}
                            size={20}
                            color={isSelected ? colors.primary : colors.textSecondary}
                          />
                          <Text style={[styles.modalItemText, {color: isSelected ? colors.primary : colors.text}, isSelected && {fontWeight: '600'}]}>
                            {s.name}
                          </Text>
                          {s.isFavorite && <MaterialCommunityIcons name="star" size={14} color="#FFD700" />}
                          {isSelected && <MaterialCommunityIcons name="check" size={20} color={colors.primary} />}
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </View>
            </Modal>
          </>
        )}

        {state.products.length > 0 && (
          <>
            <Text style={[styles.label, {color: colors.text}]}>
              Products ({selectedProductIds.length > 0 ? `${selectedProductIds.length} selected` : 'optional'})
            </Text>
            {/* Search + quick actions */}
            <View style={styles.productActions}>
              <View style={[styles.searchBox, {backgroundColor: colors.surface, borderColor: colors.border}]}>
                <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
                <TextInput
                  style={[styles.searchInput, {color: colors.text}]}
                  placeholder="Search products..."
                  placeholderTextColor={colors.textSecondary}
                  value={productSearch}
                  onChangeText={setProductSearch}
                />
                {productSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setProductSearch('')}>
                    <MaterialCommunityIcons name="close-circle" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.quickActions}>
                <TouchableOpacity onPress={selectAllProducts}>
                  <Text style={[styles.quickActionText, {color: colors.primary}]}>Select All</Text>
                </TouchableOpacity>
                <Text style={{color: colors.textSecondary}}>•</Text>
                <TouchableOpacity onPress={deselectAllProducts}>
                  <Text style={[styles.quickActionText, {color: colors.textSecondary}]}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Per-category collapsible groups */}
            {groupedProducts.map(group => {
              const isGroupExpanded = !!expandedGroups[group.key];
              const selectedInGroup = group.items.filter(p =>
                selectedProductIds.includes(p.id),
              ).length;
              return (
                <View key={group.key} style={styles.productGroup}>
                  <TouchableOpacity
                    onPress={() => toggleGroup(group.key)}
                    style={[styles.groupHeader, styles.groupHeaderTouchable]}
                    activeOpacity={0.7}>
                    <Text style={[styles.groupTitle, {color: colors.textSecondary}]}>{group.title}</Text>
                    {selectedInGroup > 0 && (
                      <View style={[styles.groupBadge, {backgroundColor: colors.primary}]}>
                        <Text style={styles.groupBadgeText}>{selectedInGroup}</Text>
                      </View>
                    )}
                    <View style={[styles.groupLine, {backgroundColor: colors.border}]} />
                    <MaterialCommunityIcons
                      name={isGroupExpanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  {isGroupExpanded && group.items.map(product => {
                    const isSelected = selectedProductIds.includes(product.id);
                    return (
                      <TouchableOpacity
                        key={product.id}
                        style={[
                          styles.productItem,
                          {backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border},
                          isSelected && {backgroundColor: colors.primary + '10'},
                        ]}
                        onPress={() => toggleProduct(product.id)}
                        activeOpacity={0.7}>
                        <View style={styles.productCheckbox}>
                          <MaterialCommunityIcons
                            name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                            size={22}
                            color={isSelected ? colors.primary : colors.textSecondary}
                          />
                        </View>
                        {product.imageUri ? (
                          <Image source={{uri: product.imageUri}} style={styles.productThumb} />
                        ) : (
                          <View style={[styles.productThumbPlaceholder, {backgroundColor: colors.border}]}>
                            <MaterialCommunityIcons name="package-variant" size={16} color={colors.textSecondary} />
                          </View>
                        )}
                        <View style={styles.productInfo}>
                          <Text style={[styles.productName, {color: colors.text}]} numberOfLines={1}>
                            {product.name}
                          </Text>
                          <Text style={[styles.productCategory, {color: colors.textSecondary}]}>
                            {ProductCategoryInfo[product.category]?.label || product.category}
                          </Text>
                        </View>
                        {!product.isAvailable && (
                          <View style={[styles.needTag, {backgroundColor: colors.warning + '20'}]}>
                            <Text style={[styles.needTagText, {color: colors.warning}]}>Need</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
            {groupedProducts.length === 0 && productSearch.length > 0 && (
              <Text style={[styles.emptySearch, {color: colors.textSecondary}]}>
                No products match "{productSearch}"
              </Text>
            )}
          </>
        )}

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any notes..."
          multiline
          numberOfLines={3}
        />

        {existingSchedule && (
          <Button
            title={
              existingSchedule.isCompleted
                ? 'Mark as Incomplete'
                : 'Mark as Complete'
            }
            onPress={handleToggleComplete}
            variant="outline"
            fullWidth
            style={styles.completeButton}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, {backgroundColor: colors.surface, borderTopColor: colors.border}]}>
        <Button
          title={existingSchedule ? 'Save Changes' : 'Create Schedule'}
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
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: FontSize.base,
    flex: 1,
  },
  horizontalScroll: {
    marginBottom: Spacing.md,
  },
  selectItem: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    marginRight: Spacing.sm,
    borderWidth: 1,
  },
  selectItemText: {
    fontSize: FontSize.sm,
  },
  shopDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  shopDropdownText: {
    flex: 1,
    fontSize: FontSize.base,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  modalItemText: {
    flex: 1,
    fontSize: FontSize.base,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  optionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  optionText: {
    fontSize: FontSize.sm,
  },
  optionColumn: {
    marginBottom: Spacing.md,
  },
  reminderItem: {
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  reminderText: {
    fontSize: FontSize.sm,
  },
  reminderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  reminderToggleInfo: {
    flex: 1,
  },
  reminderToggleText: {
    fontSize: FontSize.base,
    fontWeight: '500',
  },
  reminderToggleHint: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  completeButton: {
    marginTop: Spacing.lg,
  },
  productActions: {
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    paddingVertical: Spacing.xs,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  quickActionText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  productGroup: {
    marginBottom: Spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  groupHeaderTouchable: {
    paddingVertical: Spacing.xs,
  },
  groupBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  groupTitle: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupLine: {
    flex: 1,
    height: 1,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: 10,
    marginBottom: 4,
    borderWidth: 1,
  },
  productCheckbox: {
    marginRight: Spacing.xs,
  },
  productThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  productThumbPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  productCategory: {
    fontSize: FontSize.xs,
  },
  needTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: Spacing.xs,
  },
  needTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptySearch: {
    textAlign: 'center',
    paddingVertical: Spacing.lg,
    fontSize: FontSize.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    borderTopWidth: 1,
  },
});

export default AddEditScheduleScreen;
