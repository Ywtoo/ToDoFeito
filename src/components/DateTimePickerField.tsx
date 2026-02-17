import React, { useState, useCallback, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { toDateValue, combineDateAndTime } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';
import { createDateTimeStyles } from '../styles/DateTimePickerField.style';

interface Props {
  value?: Date | null;
  onChange: (d: Date | null) => void;
  placeholder?: string;
}

export default function DateTimePickerField({ value, onChange, placeholder = 'Selecionar data' }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createDateTimeStyles(theme), [theme]);
  
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [iosSelected, setIosSelected] = useState<Date | null>(null);

  const openPicker = useCallback(() => {
    setTempDate(null);
    setIosSelected(null);
    setMode('date');
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setMode(null);
    setTempDate(null);
    setIosSelected(null);
  }, []);

  const handleAndroidDatePicked = useCallback((picked: Date) => {
    setTempDate(picked);
    setMode('time');
  }, []);

  const handleAndroidTimePicked = useCallback((picked: Date) => {
    const base = tempDate ?? value ?? new Date();
    const combined = combineDateAndTime(base, picked);
    onChange(combined);
    close();
  }, [tempDate, value, onChange, close]);

  function onChangeAndroid(event: DateTimePickerEvent & { type?: string }, selected?: Date | undefined) {
    if (event?.type === 'dismissed') {
      close();
      return;
    }

    const picked = selected;
    if (!picked) {
      close();
      return;
    }

    if (mode === 'date') {
      handleAndroidDatePicked(picked);
    } else if (mode === 'time') {
      handleAndroidTimePicked(picked);
    }
  }

  //TODO: Testar fluxo IOS e talvez separar em outro componente específico para evitar tanta lógica junta
  function onChangeIOS(_: DateTimePickerEvent, selected?: Date | undefined) {
    const picked = toDateValue(selected) || null;
    setIosSelected(picked);
  }

  function confirmIos() {
    onChange(iosSelected ?? value ?? new Date());
    close();
  }

  function formatDate(d?: Date | null) {
    if (!d) return '';
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    } catch {
      return d.toLocaleString();
    }
  }

  const display = value ? formatDate(value) : '';

  return (
    <>
      <TouchableOpacity onPress={openPicker} activeOpacity={0.7}>
        <View style={styles.inputContainer}>
          <Text style={display ? styles.inputText : styles.placeholderText}>
            {display || placeholder}
          </Text>
        </View>
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <DateTimePicker
                value={iosSelected ?? value ?? new Date()}
                mode="datetime"
                display="spinner"
                onChange={onChangeIOS}
                style={styles.datePicker}
              />

              <View style={styles.actions}>
                <TouchableOpacity onPress={close} style={styles.actionButton}>
                  <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={confirmIos} style={styles.actionButton}>
                  <Text style={styles.actionText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        visible && mode && (
          <DateTimePicker
            value={tempDate ?? value ?? new Date()}
            mode={mode}
            display="default"
            onChange={onChangeAndroid}
          />
        )
      )}
    </>
  );
}