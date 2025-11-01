import { supabase } from '@/integrations/supabase/client';

/**
 * Get the start of the day in the user's timezone
 */
export const getStartOfDayInTimezone = (timezone: string): Date => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '');
  
  // Create date in user's timezone
  const userDate = new Date(year, month, day, 0, 0, 0, 0);
  return userDate;
};

/**
 * Get today's date string in the user's timezone (YYYY-MM-DD)
 */
export const getTodayInTimezone = (timezone: string): string => {
  const startOfDay = getStartOfDayInTimezone(timezone);
  return startOfDay.toISOString().split('T')[0];
};

/**
 * Get user's timezone from profile, defaults to UTC
 */
export const getUserTimezone = async (walletAddress: string): Promise<string> => {
  const { data } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('wallet_address', walletAddress)
    .maybeSingle();
  
  return data?.timezone || 'UTC';
};
