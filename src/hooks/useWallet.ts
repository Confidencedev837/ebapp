// src/hooks/useWallet.ts
import { useState, useCallback, useEffect } from 'react';
import * as walletApi from '@/services/api/walletApi';

/**
 * Hook for fetching wallet balance
 */
export const useWalletBalance = (userId: string | null) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await walletApi.fetchWalletBalance(userId);
      setBalance(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch wallet';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { balance, loading, error, refetch: fetch };
};

/**
 * Hook for crediting wallet
 */
export const useCreditWallet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const credit = useCallback(async (userId: string, amount: number): Promise<number> => {
    try {
      setLoading(true);
      setError(null);
      const newBalance = await walletApi.creditWallet(userId, amount);
      return newBalance;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to credit wallet';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { credit, loading, error };
};

/**
 * Hook for debiting wallet
 */
export const useDebitWallet = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debit = useCallback(async (userId: string, amount: number): Promise<number> => {
    try {
      setLoading(true);
      setError(null);
      const newBalance = await walletApi.debitWallet(userId, amount);
      return newBalance;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to debit wallet';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { debit, loading, error };
};

/**
 * Hook for updating wallet balance directly
 */
export const useUpdateWalletBalance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (userId: string, newBalance: number): Promise<number> => {
    try {
      setLoading(true);
      setError(null);
      const result = await walletApi.updateWalletBalance(userId, newBalance);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update wallet';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
};
