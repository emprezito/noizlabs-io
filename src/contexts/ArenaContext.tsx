import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types
interface AudioMeme {
  id: string;
  title: string;
  creator: string;
  category: string;
  categoryId: string;
  votes: number;
}

interface Category {
  id: string;
  name: string;
  creatorWallet: string;
  expiresAt: string;
}

interface ArenaContextType {
  audioClips: AudioMeme[];
  categories: Category[];
  userPoints: number;
  refreshData: () => Promise<void>;
  fetchUserPoints: (walletAddress: string) => Promise<void>;
}

const ArenaContext = createContext<ArenaContextType | undefined>(undefined);

export const ArenaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [audioClips, setAudioClips] = useState<AudioMeme[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);

  // Fetch data from database
  const refreshData = async () => {
    try {
      // Fetch categories (only non-expired)
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (categoriesError) throw categoriesError;

      const formattedCategories: Category[] = (categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        creatorWallet: cat.creator_wallet,
        expiresAt: cat.expires_at,
      }));

      setCategories(formattedCategories);

      // Fetch audio clips with vote counts
      const { data: clipsData, error: clipsError } = await supabase
        .from('audio_clips')
        .select('*, categories!inner(name, expires_at)')
        .gt('categories.expires_at', new Date().toISOString());

      if (clipsError) throw clipsError;

      // Get vote counts for all clips
      const clipsWithVotes = await Promise.all(
        (clipsData || []).map(async (clip: any) => {
          const { data: votesData } = await supabase.rpc('get_clip_votes', { clip_uuid: clip.id });
          return {
            id: clip.id,
            title: clip.title,
            creator: clip.creator_wallet,
            category: clip.categories.name,
            categoryId: clip.category_id,
            votes: votesData || 0,
          };
        })
      );

      setAudioClips(clipsWithVotes);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Fetch user points based on wallet
  const fetchUserPoints = async (walletAddress: string) => {
    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('points')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (error) throw error;
      setUserPoints(data?.points || 0);
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    refreshData();

    const categoriesChannel = supabase
      .channel('categories-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        refreshData();
      })
      .subscribe();

    const clipsChannel = supabase
      .channel('clips-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audio_clips' }, () => {
        refreshData();
      })
      .subscribe();

    const votesChannel = supabase
      .channel('votes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => {
        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(clipsChannel);
      supabase.removeChannel(votesChannel);
    };
  }, []);

  const value = {
    audioClips,
    categories,
    userPoints,
    refreshData,
    fetchUserPoints,
  };

  return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>;
};

export const useArena = () => {
  const context = useContext(ArenaContext);
  if (context === undefined) {
    throw new Error('useArena must be used within an ArenaProvider');
  }
  return context;
};
