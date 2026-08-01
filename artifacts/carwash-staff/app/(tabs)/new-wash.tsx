import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useListServices, useCreateTransaction } from '@workspace/api-client-react';
import { formatCurrency } from '@/lib/utils';

type VehicleType = 'Car' | 'SUV' | 'Truck' | 'Minibus' | 'Other';
type PaymentMethod = 'Cash' | 'Mobile Money' | 'Card';

const VEHICLE_TYPES: VehicleType[] = ['Car', 'SUV', 'Truck', 'Minibus', 'Other'];
const PAYMENT_METHODS: PaymentMethod[] = ['Cash', 'Mobile Money', 'Card'];

interface SuccessState {
  receiptNumber: string;
  customerName: string;
  serviceName: string;
  amountPaid: number;
}

export default function NewWashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { data: services, isLoading: servicesLoading } = useListServices();
  const { mutateAsync: createTransaction, isPending } = useCreateTransaction();

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Car');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeServices = services?.filter((s) => s.isActive) ?? [];
  const selectedService = activeServices.find((s) => s.id === selectedServiceId);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 16;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedServiceId) e.service = 'Please select a service';
    if (!customerName.trim()) e.customerName = 'Customer name is required';
    if (!vehiclePlate.trim()) e.vehiclePlate = 'Vehicle plate is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedService) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const tx = await createTransaction({
        data: {
          serviceId: selectedService.id,
          customerName: customerName.trim(),
          vehiclePlate: vehiclePlate.trim().toUpperCase(),
          vehicleType,
          amountPaid: selectedService.price,
          paymentMethod,
          notes: notes.trim() || undefined,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess({
        receiptNumber: tx.receiptNumber,
        customerName: tx.customerName,
        serviceName: tx.serviceName,
        amountPaid: tx.amountPaid,
      });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrors({ submit: 'Failed to save. Please try again.' });
    }
  };

  const handleReset = () => {
    setSuccess(null);
    setSelectedServiceId(null);
    setCustomerName('');
    setVehiclePlate('');
    setVehicleType('Car');
    setPaymentMethod('Cash');
    setNotes('');
    setErrors({});
  };

  const styles = makeStyles(colors);

  if (success) {
    return (
      <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={48} color={colors.success ?? '#22C55E'} />
          </View>
          <Text style={styles.successTitle}>Receipt Issued!</Text>
          <Text style={styles.receiptNumber}>{success.receiptNumber}</Text>
          <View style={styles.successDetails}>
            <DetailRow label="Customer" value={success.customerName} colors={colors} />
            <DetailRow label="Service" value={success.serviceName} colors={colors} />
            <DetailRow label="Amount" value={formatCurrency(success.amountPaid)} colors={colors} />
          </View>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}
            onPress={handleReset}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={styles.primaryBtnText}>New Wash</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { paddingTop: topPad }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Page Title */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Log a Wash</Text>
        <Text style={styles.pageSubtitle}>Fill in the details to issue a receipt</Text>
      </View>

      {/* Service Selection */}
      <SectionLabel label="Service Package" required colors={colors} />
      {servicesLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : (
        <View style={styles.serviceGrid}>
          {activeServices.map((s) => (
            <Pressable
              key={s.id}
              style={({ pressed }) => [
                styles.serviceCard,
                selectedServiceId === s.id && styles.serviceCardActive,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedServiceId(s.id);
                setErrors((e) => ({ ...e, service: '' }));
              }}
            >
              <Text
                style={[
                  styles.serviceName,
                  selectedServiceId === s.id && styles.serviceNameActive,
                ]}
                numberOfLines={1}
              >
                {s.name}
              </Text>
              <Text
                style={[
                  styles.servicePrice,
                  selectedServiceId === s.id && styles.servicePriceActive,
                ]}
              >
                {formatCurrency(s.price)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {!!errors.service && <Text style={styles.error}>{errors.service}</Text>}

      {/* Customer Name */}
      <SectionLabel label="Customer Name" required colors={colors} />
      <TextInput
        style={[styles.input, !!errors.customerName && styles.inputError]}
        value={customerName}
        onChangeText={(t) => {
          setCustomerName(t);
          setErrors((e) => ({ ...e, customerName: '' }));
        }}
        placeholder="e.g. John Mwale"
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="next"
        autoCapitalize="words"
      />
      {!!errors.customerName && <Text style={styles.error}>{errors.customerName}</Text>}

      {/* Vehicle Plate */}
      <SectionLabel label="Vehicle Plate" required colors={colors} />
      <TextInput
        style={[styles.input, !!errors.vehiclePlate && styles.inputError]}
        value={vehiclePlate}
        onChangeText={(t) => {
          setVehiclePlate(t.toUpperCase());
          setErrors((e) => ({ ...e, vehiclePlate: '' }));
        }}
        placeholder="e.g. ABX 1234"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="characters"
        returnKeyType="next"
      />
      {!!errors.vehiclePlate && <Text style={styles.error}>{errors.vehiclePlate}</Text>}

      {/* Vehicle Type */}
      <SectionLabel label="Vehicle Type" colors={colors} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {VEHICLE_TYPES.map((vt) => (
          <Pressable
            key={vt}
            style={[styles.chip, vehicleType === vt && styles.chipActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setVehicleType(vt);
            }}
          >
            <Text style={[styles.chipText, vehicleType === vt && styles.chipTextActive]}>
              {vt}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Payment Method */}
      <SectionLabel label="Payment Method" colors={colors} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {PAYMENT_METHODS.map((pm) => (
          <Pressable
            key={pm}
            style={[styles.chip, paymentMethod === pm && styles.chipActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setPaymentMethod(pm);
            }}
          >
            <Text style={[styles.chipText, paymentMethod === pm && styles.chipTextActive]}>
              {pm}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Notes */}
      <SectionLabel label="Notes (optional)" colors={colors} />
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any special notes..."
        placeholderTextColor={colors.mutedForeground}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Submit Error */}
      {!!errors.submit && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={14} color={colors.destructive} />
          <Text style={styles.errorBannerText}>{errors.submit}</Text>
        </View>
      )}

      {/* Submit Button */}
      <Pressable
        style={({ pressed }) => [
          styles.primaryBtn,
          styles.submitBtn,
          (isPending || !selectedService) && styles.primaryBtnDisabled,
          pressed && !isPending && { opacity: 0.85 },
        ]}
        onPress={handleSubmit}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <>
            <Feather name="check" size={18} color={colors.primaryForeground} />
            <Text style={styles.primaryBtnText}>Issue Receipt</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

function SectionLabel({
  label,
  required,
  colors,
}: {
  label: string;
  required?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground, marginTop: 20, marginBottom: 8, marginHorizontal: 20 }}>
      {label}
      {required && <Text style={{ color: colors.destructive }}> *</Text>}
    </Text>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>{label}</Text>
      <Text style={{ fontSize: 13, color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{value}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pageHeader: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 4,
    },
    pageTitle: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    pageSubtitle: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    serviceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      paddingHorizontal: 20,
    },
    serviceCard: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    serviceCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '18',
    },
    serviceName: {
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    serviceNameActive: {
      color: colors.primary,
    },
    servicePrice: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
      marginTop: 4,
    },
    servicePriceActive: {
      color: colors.primary,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.foreground,
      marginHorizontal: 20,
    },
    inputError: {
      borderColor: colors.destructive,
    },
    inputMultiline: {
      minHeight: 80,
      paddingTop: 12,
    },
    chipScroll: {
      paddingLeft: 20,
      marginBottom: 0,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginRight: 8,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '18',
    },
    chipText: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    chipTextActive: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
    },
    error: {
      fontSize: 12,
      color: colors.destructive,
      fontFamily: 'Inter_400Regular',
      marginTop: 4,
      marginHorizontal: 20,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.destructive + '18',
      borderRadius: 10,
      padding: 12,
      marginHorizontal: 20,
      marginTop: 12,
    },
    errorBannerText: {
      fontSize: 13,
      color: colors.destructive,
      fontFamily: 'Inter_400Regular',
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      gap: 8,
      marginHorizontal: 20,
    },
    primaryBtnDisabled: {
      opacity: 0.5,
    },
    primaryBtnText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primaryForeground,
    },
    submitBtn: {
      marginTop: 24,
    },
    // Success state
    successCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    },
    successIcon: {
      marginBottom: 16,
    },
    successTitle: {
      fontSize: 24,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    receiptNumber: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primary,
      marginTop: 6,
      marginBottom: 24,
    },
    successDetails: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 28,
    },
    success: {
      color: '#22C55E',
    },
  });
}
