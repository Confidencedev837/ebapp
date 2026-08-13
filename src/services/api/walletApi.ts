// src/services/api/walletApi.ts
import { supabase } from '../supabase';
import { WalletRow } from '@/types/supabase';

/**
 * Get wallet balance for user
 */
export const fetchWalletBalance = async (userId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If wallet doesn't exist, try to create it
      if (error.code === 'PGRST116') {
        return 0;
      }
      throw error;
    }

    return data?.balance ? Number(data.balance) : 0;
  } catch (error) {
    console.error('[walletApi] fetchWalletBalance error:', error);
    throw error;
  }
};

/**
 * Get full wallet details
 */
export const fetchWallet = async (userId: string): Promise<WalletRow | null> => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[walletApi] fetchWallet error:', error);
    throw error;
  }
};

/**
 * Create wallet for new user
 */
export const createWallet = async (userId: string, initialBalance: number = 0): Promise<WalletRow> => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        balance: initialBalance,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[walletApi] createWallet error:', error);
    throw error;
  }
};

/**
 * Update wallet balance
 * Use this for crediting/debiting wallet
 */
export const updateWalletBalance = async (userId: string, newBalance: number): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', userId)
      .select('balance')
      .single();

    if (error) throw error;
    return Number(data?.balance || 0);
  } catch (error) {
    console.error('[walletApi] updateWalletBalance error:', error);
    throw error;
  }
};

/**
 * Credit wallet (add funds)
 */
export const creditWallet = async (userId: string, amount: number): Promise<number> => {
  try {
    const currentBalance = await fetchWalletBalance(userId);
    const newBalance = currentBalance + amount;
    return await updateWalletBalance(userId, newBalance);
  } catch (error) {
    console.error('[walletApi] creditWallet error:', error);
    throw error;
  }
};

/**
 * Debit wallet (subtract funds)
 */
export const debitWallet = async (userId: string, amount: number): Promise<number> => {
  try {
    const currentBalance = await fetchWalletBalance(userId);
    if (currentBalance < amount) {
      throw new Error('Insufficient wallet balance');
    }
    const newBalance = currentBalance - amount;
    return await updateWalletBalance(userId, newBalance);
  } catch (error) {
    console.error('[walletApi] debitWallet error:', error);
    throw error;
  }
};
