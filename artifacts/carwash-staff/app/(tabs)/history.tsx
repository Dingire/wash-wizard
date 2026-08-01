import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useListTransactions } from '@workspace/api-client-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';

const PAYMENT_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Cash: 'dollar-sign',
  'Mobile Money': 'smartphone',
  Card: 'credit-card',
};

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const { data: transactions, isLoading, refetch } = useListTransactions({
    date: selectedDate,
    limit: 100,
  });

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom + 16;

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.selectionAsync();
    await refetch();
    setRefreshing(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const filters = [
    { label: 'Today', value: today },
    { label: 'Yesterday', value: yesterday },
    { label: 'All', value: undefined },
  ];

  const styles = makeStyles(colors);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>History</Text>
        <Text style={styles.txCount}>
          {isLoading ? '…' : `${transactions?.length ?? 0} records`}
        </Text>
      </View>

      {/* Date Filters */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <Pressable
            key={String(f.label)}
            style={[
              styles.filterChip,
              selectedDate === f.value && styles.filterChipActive,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedDate(f.value);
            }}
          >
            <Text
              style={[
                styles.filterText,
                selectedDate === f.value && styles.filterTextActive,
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: bottomPad + 24, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="clock" size={36} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedDate === today
                  ? 'No washes logged today yet'
                  : 'Try selecting a different date range'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <Text style={styles.receipt}>{item.receiptNumber}</Text>
                  <Text style={styles.customer} numberOfLines={1}>
                    {item.customerName}
                  </Text>
                </View>
                <View style={styles.amountBadge}>
                  <Text style={styles.amountText}>{formatCurrency(item.amountPaid)}</Text>
                </View>
              </View>
              <View style={styles.cardDivider} />
              <View style={styles.cardBottom}>
                <Tag icon="tag" label={item.serviceName} colors={colors} />
                <Tag icon="truck" label={`${item.vehiclePlate} · ${item.vehicleType}`} colors={colors} />
                <Tag
                  icon={PAYMENT_ICONS[item.paymentMethod] ?? 'dollar-sign'}
                  label={item.paymentMethod}
                  colors={colors}
                />
                <View style={styles.timeTag}>
                  <Feather name="clock" size={11} color={colors.mutedForeground} />
                  <Text style={styles.timeText}>
                    {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
}

function Tag({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 10, marginBottom: 4 }}>
      <Feather name={icon} size={11} color={colors.mutedForeground} />
      <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.mutedForeground }}>
        {label}
      </Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 10,
    },
    pageTitle: {
      fontSize: 22,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    txCount: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    filterChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '18',
    },
    filterText: {
      fontSize: 13,
      fontFamily: 'Inter_500Medium',
      color: colors.mutedForeground,
    },
    filterTextActive: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
    },
    empty: {
      alignItems: 'center',
      paddingTop: 60,
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
      marginTop: 8,
    },
    emptySubtitle: {
      fontSize: 13,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: 14,
    },
    cardLeft: {
      flex: 1,
      marginRight: 12,
    },
    receipt: {
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
      color: colors.primary,
      marginBottom: 2,
    },
    customer: {
      fontSize: 15,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    amountBadge: {
      backgroundColor: colors.primary + '18',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    amountText: {
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
      color: colors.primary,
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 14,
    },
    cardBottom: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      padding: 12,
      paddingTop: 10,
    },
    timeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginLeft: 'auto',
    },
    timeText: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
    },
  });
}
