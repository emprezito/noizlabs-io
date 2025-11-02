import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types
interface AudioMeme {
  id: string;
  title: string;
  creator: string;
  creatorUsername?: string;
  category: string;
  categoryId: string;
  votes: number;
  audioUrl?: string;
  imageUrl?: string;
}

interface Category {
  id: string;
  name: string;
  creatorWallet: string;
  expiresAt: string;
  genre?: string;
}

interface Profile {
  wallet_address: string;
  username: string;
  referral_code: string;
}

interface ArenaContextType {
  audioClips: AudioMeme[];
  categories: Category[];
  userPoints: number;
  profiles: Profile[];
  refreshData: () => Promise<void>;
  fetchUserPoints: (walletAddress: string) => Promise<void>;
  getOrCreateProfile: (walletAddress: string) => Promise<string>;
}

const ArenaContext = createContext<ArenaContextType | undefined>(undefined);

export const ArenaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [audioClips, setAudioClips] = useState<AudioMeme[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Fetch data from database
  const refreshData = async () => {
    try {
      // Fetch profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');
      
      setProfiles(profilesData || []);

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
        genre: cat.genre,
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
          const creatorProfile = (profilesData || []).find((p: any) => p.wallet_address === clip.creator_wallet);
          return {
            id: clip.id,
            title: clip.title,
            creator: clip.creator_wallet,
            creatorUsername: creatorProfile?.username,
            category: clip.categories.name,
            categoryId: clip.category_id,
            votes: votesData || 0,
            audioUrl: clip.audio_url,
            imageUrl: clip.image_url,
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

  // Get or create profile for a wallet
  const getOrCreateProfile = async (walletAddress: string): Promise<string> => {
    try {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (existingProfile) {
        return existingProfile.username;
      }

      // Create new profile with default username
      const defaultUsername = `user_${walletAddress.slice(0, 8)}`;
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          wallet_address: walletAddress,
          username: defaultUsername,
        })
        .select('username')
        .single();

      if (error) throw error;
      
      await refreshData();
      return newProfile.username;
    } catch (error) {
      console.error('Error creating profile:', error);
      return `user_${walletAddress.slice(0, 8)}`;
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
    profiles,
    refreshData,
    fetchUserPoints,
    getOrCreateProfile,
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
