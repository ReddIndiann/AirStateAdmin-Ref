import axios from 'axios';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface MNotifyBalance {
  smsBalance: number | null;
  smsBonus: number | null;
  voiceBalance: number | null;
  error?: string;
}

/**
 * Fetches the mNotify API key from AdminConfig collection
 */
export const getMNotifyApiKey = async (): Promise<string | null> => {
  try {
    const configSnapshot = await getDocs(query(collection(db, 'AdminConfig')));
    if (!configSnapshot.empty) {
      const firstDoc = configSnapshot.docs[0];
      const data = firstDoc.data();
      return data.mNotifyApikey || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching mNotify API key:', error);
    return null;
  }
};

/**
 * Fetches SMS balance from mNotify API
 */
export const getSMSBalance = async (apiKey: string): Promise<{ balance: number; bonus: number } | null> => {
  try {
    const response = await axios.get(`https://api.mnotify.com/api/balance/sms?key=${apiKey}`);
    if (response.data.status === 'success') {
      return {
        balance: response.data.balance || 0,
        bonus: response.data.bonus || 0
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching SMS balance:', error);
    return null;
  }
};

/**
 * Fetches Voice balance from mNotify API
 */
export const getVoiceBalance = async (apiKey: string): Promise<number | null> => {
  try {
    const response = await axios.get(`https://api.mnotify.com/api/balance/voice?key=${apiKey}`);
    if (response.data.status === 'success') {
      return response.data.balance || 0;
    }
    return null;
  } catch (error) {
    console.error('Error fetching Voice balance:', error);
    return null;
  }
};

/**
 * Fetches both SMS and Voice balances from mNotify API
 */
export const getMNotifyBalances = async (): Promise<MNotifyBalance> => {
  try {
    const apiKey = await getMNotifyApiKey();
    
    if (!apiKey) {
      return {
        smsBalance: null,
        smsBonus: null,
        voiceBalance: null,
        error: 'mNotify API key not found in configuration'
      };
    }

    const [smsBalanceData, voiceBalance] = await Promise.all([
      getSMSBalance(apiKey),
      getVoiceBalance(apiKey)
    ]);

    return {
      smsBalance: smsBalanceData?.balance ?? null,
      smsBonus: smsBalanceData?.bonus ?? null,
      voiceBalance: voiceBalance ?? null
    };
  } catch (error) {
    console.error('Error fetching mNotify balances:', error);
    return {
      smsBalance: null,
      smsBonus: null,
      voiceBalance: null,
      error: 'Failed to fetch balances'
    };
  }
};

