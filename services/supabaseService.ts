import { supabase } from './supabaseClient';
import { DetranData, User } from '../types';

export const saveDetranDataToSupabase = async (userId: string, data: DetranData[]) => {
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, data: data }, { onConflict: 'user_id' });
    
  if (error) {
    console.error('Error saving data to Supabase:', error);
    throw error;
  }
};

export const getDetranDataFromSupabase = async (userId: string): Promise<DetranData[] | null> => {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching data from Supabase:', error);
    return null;
  }

  return data ? data.data : null;
};
