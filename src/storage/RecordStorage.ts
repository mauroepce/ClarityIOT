import AsyncStorage from '@react-native-async-storage/async-storage';
import {WeightRecord} from '../contexts/SyncContext';

const STORAGE_KEY = 'weightRecords';

export const getRecords = async (): Promise<WeightRecord[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRecords = async (records: WeightRecord[]) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};
