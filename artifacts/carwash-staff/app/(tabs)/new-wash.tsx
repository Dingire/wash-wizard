import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
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
import { useRouter } from 'expo-router';
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
  smsStatus?: string;
}

export default function NewWashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: services, isLoading: servicesLoading } = useListServices();
  const { mutateAsync: createTransaction, isPending } = useCreateTransaction();

  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sendSms, setSendSms] = useState(false);
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
  // The tab bar is absolutely positioned over the scroll content, so the
  // bottom of the screen must be padded past its height (~49pt native,
  // ~84px web) or the last button gets covered.
  const tabBarPad = (Platform.OS === 'web' ? 84 : 49) + bottomPad;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedServiceId) e.service = 'Please select a service';
    if (!customerName.trim()) e.customerName = 'Customer name is required';
    if (sendSms && !/^\+?[0-9\s()-]{7,20}$/.test(customerPhone)) {
      e.customerPhone = 'Enter a valid phone number with country code';
    }
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
          customerPhone: customerPhone.trim() || undefined,
          sendSms,
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
        smsStatus: tx.smsStatus,
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
    setCustomerPhone('');
    setSendSms(false);
    setVehiclePlate('');
    setVehicleType('Car');
    setPaymentMethod('Cash');
    setNotes('');
    setErrors({});
  };

  const handleDone = () => {
    handleReset();
    router.replace('/');
  };

  const pickService = (id: number) => {
    Haptics.selectionAsync();
    setSelectedServiceId(id);
    setServicePickerOpen(false);
    setErrors((e) => ({ ...e, service: '' }));
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
            {success.smsStatus && success.smsStatus !== 'not_requested' && (
              <DetailRow label="SMS" value={success.smsStatus.replace('_', ' ')} colors={colors} />
            )}
          </View>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, styles.successPrimaryBtn, pressed && { opacity: 0.85 }]}
            onPress={handleReset}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={styles.primaryBtnText}>Add New Wash</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
            onPress={handleDone}
          >
            <Feather name="check" size={18} color={colors.primary} />
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { paddingTop: topPad }]}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: bottomPad + tabBarPad + 24 }}
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
      <Pressable
        style={({ pressed }) => [styles.serviceField, pressed && { opacity: 0.85 }]}
        onPress={() => setServicePickerOpen(true)}
        disabled={servicesLoading}
      >
        {servicesLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : selectedService ? (
          <>
            <View style={styles.serviceFieldTextWrap}>
              <Text style={styles.serviceFieldName} numberOfLines={1}>
                {selectedService.name}
              </Text>
              <Text style={styles.serviceFieldPrice}>{formatCurrency(selectedService.price)}</Text>
            </View>
            <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
          </>
        ) : (
          <Text style={styles.serviceFieldPlaceholder}>
            {activeServices.length > 0 ? 'Choose a service package' : 'No services available'}
          </Text>
        )}
      </Pressable>
      {!!errors.service && <Text style={styles.error}>{errors.service}</Text>}

      {/* Service Picker Modal */}
      <Modal
        visible={servicePickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setServicePickerOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setServicePickerOpen(false)}>
          <Pressable style={[styles.modalSheet, { paddingBottom: bottomPad }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a Service Package</Text>
              <Pressable onPress={() => setServicePickerOpen(false)} hitSlop={10}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {activeServices.map((s) => {
                const isSelected = s.id === selectedServiceId;
                return (
                  <Pressable
                    key={s.id}
                    style={({ pressed }) => [
                      styles.modalItem,
                      isSelected && styles.modalItemSelected,
                      pressed && { opacity: 0.85 },
                    ]}
                    onPress={() => pickService(s.id)}
                  >
                    <View style={styles.modalItemTextWrap}>
                      <Text
                        style={[styles.modalItemName, isSelected && styles.modalItemNameSelected]}
                        numberOfLines={1}
                      >
                        {s.name}
                      </Text>
                      <Text style={styles.modalItemDesc} numberOfLines={2}>
                        {s.description}
                      </Text>
                    </View>
                    <Text style={[styles.modalItemPrice, isSelected && styles.modalItemPriceSelected]}>
                      {formatCurrency(s.price)}
                    </Text>
                    {isSelected && <Feather name="check" size={16} color={colors.primary} />}
                  </Pressable>
                );
              })}
              {activeServices.length === 0 && (
                <Text style={styles.modalEmpty}>No services available yet.</Text>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

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

      {/* Optional SMS receipt */}
      <Pressable
        style={styles.smsToggle}
        onPress={() => {
          Haptics.selectionAsync();
          setSendSms((current) => !current);
          setErrors((e) => ({ ...e, customerPhone: '' }));
        }}
      >
        <Feather name={sendSms ? 'check-square' : 'square'} size={21} color={sendSms ? colors.primary : colors.mutedForeground} />
        <View style={styles.smsToggleText}>
          <Text style={styles.smsToggleTitle}>Send SMS receipt</Text>
          <Text style={styles.smsToggleSubtitle}>Send the customer their receipt after it is issued</Text>
        </View>
      </Pressable>

      <SectionLabel label="Customer Phone" required={sendSms} colors={colors} />
      <TextInput
        style={[styles.input, !!errors.customerPhone && styles.inputError, !sendSms && styles.inputDisabled]}
        value={customerPhone}
        onChangeText={(t) => {
          setCustomerPhone(t);
          setErrors((e) => ({ ...e, customerPhone: '' }));
        }}
        placeholder="e.g. +255 688 942 372"
        placeholderTextColor={colors.mutedForeground}
        keyboardType="phone-pad"
        editable={sendSms}
      />
      {!!errors.customerPhone && <Text style={styles.error}>{errors.customerPhone}</Text>}

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
    serviceField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 14,
      marginHorizontal: 20,
      gap: 10,
    },
    serviceFieldTextWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    serviceFieldName: {
      flex: 1,
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    serviceFieldPrice: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
    },
    serviceFieldPlaceholder: {
      fontSize: 15,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 16,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    modalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 8,
    },
    modalItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '12',
    },
    modalItemTextWrap: {
      flex: 1,
    },
    modalItemName: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    modalItemNameSelected: {
      color: colors.primary,
    },
    modalItemDesc: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    modalItemPrice: {
      fontSize: 15,
      fontFamily: 'Inter_700Bold',
      color: colors.mutedForeground,
    },
    modalItemPriceSelected: {
      color: colors.primary,
    },
    modalEmpty: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      paddingVertical: 24,
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
    inputDisabled: {
      opacity: 0.55,
    },
    smsToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 20,
      marginHorizontal: 20,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    smsToggleText: {
      flex: 1,
    },
    smsToggleTitle: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    smsToggleSubtitle: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
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
    successPrimaryBtn: {
      alignSelf: 'stretch',
    },
    doneBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.primary,
      paddingVertical: 16,
      gap: 8,
      marginHorizontal: 20,
      marginTop: 12,
      alignSelf: 'stretch',
    },
    doneBtnText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.primary,
    },
    success: {
      color: '#22C55E',
    },
  });
}
