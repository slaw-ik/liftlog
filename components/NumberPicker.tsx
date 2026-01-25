import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Picker } from '@react-native-picker/picker';

type NumberPickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  decimal?: boolean;
  suffix?: string;
};

// Generate array of numbers for picker
const generateNumbers = (min: number, max: number, step: number, decimal: boolean): string[] => {
  const numbers: string[] = [];
  for (let i = min; i <= max; i += step) {
    if (decimal) {
      // Handle floating point precision issues
      const rounded = Math.round(i * 10) / 10;
      numbers.push(rounded.toFixed(1));
    } else {
      numbers.push(Math.round(i).toString());
    }
  }
  return numbers;
};

export function NumberPicker({
  value,
  onValueChange,
  label,
  placeholder = '0',
  min = 0,
  max = 300,
  step = 1,
  decimal = false,
  suffix = '',
}: NumberPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempValue, setTempValue] = useState(value || (decimal ? min.toFixed(1) : min.toString()));

  const numbers = generateNumbers(min, max, step, decimal);

  // For iOS - use native picker wheel
  if (Platform.OS === 'ios') {
    const displayValue = value ? `${value}${suffix ? ` ${suffix}` : ''}` : placeholder;

    return (
      <View className="flex-1">
        <Text className="mb-2 text-sm text-muted-foreground">{label}</Text>
        <TouchableOpacity
          onPress={() => {
            // Set temp value to current value or find closest value in the picker
            const currentVal = value || (decimal ? min.toFixed(1) : min.toString());
            const closestValue = numbers.reduce((prev, curr) => {
              return Math.abs(parseFloat(curr) - parseFloat(currentVal)) <
                Math.abs(parseFloat(prev) - parseFloat(currentVal))
                ? curr
                : prev;
            });
            setTempValue(closestValue);
            setShowPicker(true);
          }}
          className="h-14 justify-center rounded-xl border border-border bg-card px-4"
          activeOpacity={0.7}
        >
          <Text
            className={`text-center text-xl font-bold ${value ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {displayValue}
          </Text>
        </TouchableOpacity>

        <Modal visible={showPicker} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/30">
            <TouchableOpacity
              className="flex-1"
              activeOpacity={1}
              onPress={() => setShowPicker(false)}
            />
            <View className="overflow-hidden rounded-t-3xl bg-card">
              {/* Header with Cancel and Done */}
              <View className="flex-row items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
                <TouchableOpacity onPress={() => setShowPicker(false)} className="px-3 py-2">
                  <Text className="text-base font-medium text-muted-foreground">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-foreground">{label}</Text>
                <TouchableOpacity
                  onPress={() => {
                    onValueChange(tempValue);
                    setShowPicker(false);
                  }}
                  className="px-3 py-2"
                >
                  <Text className="text-base font-bold text-primary">Done</Text>
                </TouchableOpacity>
              </View>

              {/* Current selection display */}
              <View className="items-center bg-primary/5 py-4">
                <Text className="text-4xl font-bold text-primary">
                  {tempValue}
                  {suffix ? ` ${suffix}` : ''}
                </Text>
              </View>

              {/* Picker */}
              <Picker
                selectedValue={tempValue}
                onValueChange={(itemValue) => setTempValue(itemValue)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {numbers.map((num) => (
                  <Picker.Item key={num} label={suffix ? `${num} ${suffix}` : num} value={num} />
                ))}
              </Picker>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // For Android - use numpad TextInput
  return (
    <View className="flex-1">
      <Text className="mb-2 text-sm text-muted-foreground">{label}</Text>
      <TextInput
        className="h-14 rounded-xl border border-border bg-card px-4 text-center text-xl font-bold text-foreground"
        placeholder={placeholder}
        placeholderTextColor="#71717a"
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        value={value}
        onChangeText={onValueChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    height: 200,
  },
  pickerItem: {
    fontSize: 24,
    fontWeight: '600',
  },
});

// Specialized Weight Picker (0-300 kg with 0.5 step)
export function WeightPicker({
  value,
  onValueChange,
  label,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
}) {
  return (
    <NumberPicker
      value={value}
      onValueChange={onValueChange}
      label={label}
      placeholder="0"
      min={0}
      max={300}
      step={0.5}
      decimal={true}
      suffix="kg"
    />
  );
}

// Specialized Reps Picker (1-50 reps)
export function RepsPicker({
  value,
  onValueChange,
  label,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
}) {
  return (
    <NumberPicker
      value={value}
      onValueChange={onValueChange}
      label={label}
      placeholder="0"
      min={1}
      max={50}
      step={1}
      decimal={false}
    />
  );
}
