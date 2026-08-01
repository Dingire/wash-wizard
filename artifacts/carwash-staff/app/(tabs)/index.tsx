import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useGetReportSummary, useListTransactions } from '@workspace/api-client-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useGetReportSummary();
  const { data: transactions, isLoading: txLoading, refetch: refetchTx } = useListTransactions({ limit: 5 });

  const isLoading = summaryLoading || txLoading;

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : 0;

  const handleNewWash = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/new-wash');
  };

  const styles = makeStyles(colors);

  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day 👋</Text>
          <Text style={styles.brandName}>Mig Flares Car Wash</Text>
        </View>
        <Pressable
          style={styles.refreshBtn}
          onPress={() => {
            Haptics.selectionAsync();
            refetchSummary();
            refetchTx();
          }}
        >
          <Feather name="refresh-cw" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, styles.kpiPrimary]}>
          <Feather name="dollar-sign" size={20} color={colors.primaryForeground} />
          <Text style={styles.kpiLabel}>Today's Revenue</Text>
          {summaryLoading ? (
            <ActivityIndicator color={colors.primaryForeground} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.kpiValue}>
              {formatCurrency(summary?.todayRevenue ?? 0)}
            </Text>
          )}
        </View>
        <View style={styles.kpiCard}>
          <Feather name="activity" size={20} color={colors.primary} />
          <Text style={[styles.kpiLabel, { color: colors.mutedForeground }]}>Transactions</Text>
          {summaryLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 4 }} />
          ) : (
            <Text style={[styles.kpiValue, { color: colors.foreground }]}>
              {summary?.todayTransactions ?? 0}
            </Text>
          )}
        </View>
      </View>

      {/* New Wash CTA */}
      <Pressable
        style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.85 }]}
        onPress={handleNewWash}
      >
        <Feather name="plus-circle" size={22} color={colors.primaryForeground} />
        <Text style={styles.ctaText}>Log New Wash</Text>
      </Pressable>

      {/* Recent Transactions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent</Text>
      </View>

      {txLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : !transactions?.length ? (
        <View style={styles.empty}>
          <Feather name="inbox" size={32} color={colors.mutedForeground} />
          <Text style={styles.emptyText}>No transactions today yet</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <View style={styles.txIcon}>
                <Feather name="droplet" size={16} color={colors.primary} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txName} numberOfLines={1}>
                  {item.customerName}
                </Text>
                <Text style={styles.txMeta} numberOfLines={1}>
                  {item.vehiclePlate} · {item.serviceName}
                </Text>
              </View>
              <View style={styles.txRight}>
                <Text style={styles.txAmount}>{formatCurrency(item.amountPaid)}</Text>
                <Text style={styles.txTime}>{formatDateTime(item.createdAt)}</Text>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
    },
    greeting: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
    },
    brandName: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.foreground,
      fontFamily: 'Inter_700Bold',
      marginTop: 2,
    },
    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    kpiCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    kpiPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    kpiLabel: {
      fontSize: 12,
      color: colors.primaryForeground,
      fontFamily: 'Inter_500Medium',
      opacity: 0.8,
    },
    kpiValue: {
      fontSize: 20,
      fontFamily: 'Inter_700Bold',
      color: colors.primaryForeground,
    },
    ctaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.foreground,
      borderRadius: 14,
      paddingVertical: 16,
      marginTop: 16,
      gap: 10,
    },
    ctaText: {
      fontSize: 16,
      fontFamily: 'Inter_600SemiBold',
      color: colors.card,
    },
    sectionHeader: {
      marginTop: 28,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      color: colors.foreground,
    },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 10,
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 12,
    },
    txIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txInfo: {
      flex: 1,
    },
    txName: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    txMeta: {
      fontSize: 12,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    txRight: {
      alignItems: 'flex-end',
    },
    txAmount: {
      fontSize: 14,
      fontFamily: 'Inter_600SemiBold',
      color: colors.foreground,
    },
    txTime: {
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
      color: colors.mutedForeground,
      marginTop: 2,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
    },
  });
}
