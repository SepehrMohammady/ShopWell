/**
 * AppAlert - Custom themed modal dialog replacing native Alert.alert()
 * Supports: info, confirm, destructive, action menu, and text input dialogs
 */

import React, {useState, useEffect, createContext, useContext, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {Spacing, FontSize} from '../../constants';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  input?: {
    placeholder?: string;
    defaultValue?: string;
    maxLength?: number;
    onSubmit: (value: string) => void;
  };
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {colors} = useTheme();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [inputValue, setInputValue] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const showAlert = useCallback((cfg: AlertConfig) => {
    setConfig(cfg);
    setInputValue(cfg.input?.defaultValue || '');
    setVisible(true);
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {toValue: 1, duration: 200, useNativeDriver: true}),
        Animated.spring(scaleAnim, {toValue: 1, tension: 120, friction: 10, useNativeDriver: true}),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible]);

  const handleClose = (button?: AlertButton) => {
    Animated.timing(fadeAnim, {toValue: 0, duration: 150, useNativeDriver: true}).start(() => {
      setVisible(false);
      if (button?.onPress) button.onPress();
    });
  };

  const handleInputSubmit = () => {
    Animated.timing(fadeAnim, {toValue: 0, duration: 150, useNativeDriver: true}).start(() => {
      setVisible(false);
      if (config?.input?.onSubmit) config.input.onSubmit(inputValue);
    });
  };

  const buttons = config?.buttons || [{text: 'OK', style: 'default'}];
  const cancelButton = buttons.find(b => b.style === 'cancel');
  const actionButtons = buttons.filter(b => b.style !== 'cancel');

  const getButtonColor = (style?: 'default' | 'cancel' | 'destructive') => {
    switch (style) {
      case 'destructive': return colors.error;
      case 'cancel': return colors.textSecondary;
      default: return colors.primary;
    }
  };

  return (
    <AlertContext.Provider value={{showAlert}}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => handleClose(cancelButton || buttons[0])}
        statusBarTranslucent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
            <TouchableOpacity
              style={styles.overlayTouch}
              activeOpacity={1}
              onPress={() => handleClose(cancelButton || buttons[0])}
            />
            <Animated.View
              style={[
                styles.dialog,
                {backgroundColor: colors.surface, transform: [{scale: scaleAnim}]},
              ]}>
              {config?.title && (
                <Text style={[styles.title, {color: colors.text}]}>{config.title}</Text>
              )}
              {config?.message && (
                <Text style={[styles.message, {color: colors.textSecondary}]}>{config.message}</Text>
              )}

              {config?.input && (
                <TextInput
                  style={[styles.input, {color: colors.text, borderColor: colors.border, backgroundColor: colors.background}]}
                  value={inputValue}
                  onChangeText={setInputValue}
                  placeholder={config.input.placeholder}
                  placeholderTextColor={colors.textSecondary}
                  maxLength={config.input.maxLength}
                  autoFocus
                  onSubmitEditing={handleInputSubmit}
                />
              )}

              {/* Action buttons as list (for menus with many options) */}
              {actionButtons.length > 3 ? (
                <View style={styles.menuButtons}>
                  {actionButtons.map((btn, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.menuButton, {borderBottomColor: colors.border}]}
                      onPress={() => handleClose(btn)}>
                      <Text style={[styles.menuButtonText, {color: getButtonColor(btn.style)}]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  {cancelButton && (
                    <TouchableOpacity
                      style={[styles.menuButton, {borderBottomWidth: 0}]}
                      onPress={() => handleClose(cancelButton)}>
                      <Text style={[styles.menuButtonText, {color: colors.textSecondary}]}>
                        {cancelButton.text}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.buttonRow}>
                  {config?.input ? (
                    <>
                      <TouchableOpacity
                        style={[styles.button, {backgroundColor: colors.background}]}
                        onPress={() => handleClose()}>
                        <Text style={[styles.buttonText, {color: colors.textSecondary}]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, {backgroundColor: colors.primary}]}
                        onPress={handleInputSubmit}>
                        <Text style={[styles.buttonText, {color: colors.textInverse}]}>Add</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {cancelButton && (
                        <TouchableOpacity
                          style={[styles.button, {backgroundColor: colors.background}]}
                          onPress={() => handleClose(cancelButton)}>
                          <Text style={[styles.buttonText, {color: colors.textSecondary}]}>{cancelButton.text}</Text>
                        </TouchableOpacity>
                      )}
                      {actionButtons.map((btn, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.button,
                            {backgroundColor: btn.style === 'destructive' ? colors.error : colors.primary},
                          ]}
                          onPress={() => handleClose(btn)}>
                          <Text style={[styles.buttonText, {color: colors.textInverse}]}>{btn.text}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </View>
              )}
            </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: Dimensions.get('window').width - 64,
    maxWidth: 400,
    borderRadius: 16,
    padding: Spacing.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    maxHeight: Dimensions.get('window').height * 0.7,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    marginBottom: Spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  menuButtons: {
    marginTop: Spacing.sm,
  },
  menuButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: FontSize.base,
    fontWeight: '500',
  },
});

export default AppAlert;
