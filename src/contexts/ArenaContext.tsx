import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AudioMeme {
  id: string;
  title: string;
  creator: string;
  wins: number;
  losses: number;
  totalBattles: number;
  category: string;
}

interface Category {
  id: string;
  name: string;
}

interface ArenaContextType {
  audioClips: AudioMeme[];
  categories: Category[];
  userPoints: number;
  addAudioClip: (clip: Omit<AudioMeme, 'id' | 'wins' | 'losses' | 'totalBattles'>) => void;
  addCategory: (name: string) => void;
  addPoints: (points: number) => void;
  updateClipStats: (clipId: string, won: boolean) => void;
}

const ArenaContext = createContext<ArenaContextType | undefined>(undefined);

const initialCategories: Category[] = [
  { id: '1', name: 'Movie Quotes' },
  { id: '2', name: 'Audio Memes' },
  { id: '3', name: 'Voiceovers' },
  { id: '4', name: 'Sound Effects' },
];

const initialAudioPool: AudioMeme[] = [
  { id: '1', title: 'EMOTIONAL DAMAGE', creator: '0x1234...5678', wins: 45, losses: 12, totalBattles: 57, category: 'Audio Memes' },
  { id: '2', title: 'Its Corn!', creator: '0xabcd...efgh', wins: 38, losses: 19, totalBattles: 57, category: 'Audio Memes' },
  { id: '3', title: 'I am your father', creator: '0x9876...5432', wins: 32, losses: 23, totalBattles: 55, category: 'Movie Quotes' },
  { id: '4', title: 'You shall not pass', creator: '0xdead...beef', wins: 28, losses: 25, totalBattles: 53, category: 'Movie Quotes' },
  { id: '5', title: 'Epic Trailer Voice', creator: '0xcafe...babe', wins: 25, losses: 28, totalBattles: 53, category: 'Voiceovers' },
  { id: '6', title: 'Bruh Sound Effect #2', creator: '0x1111...2222', wins: 22, losses: 31, totalBattles: 53, category: 'Sound Effects' },
  { id: '7', title: 'Vine Boom', creator: '0x3333...4444', wins: 19, losses: 34, totalBattles: 53, category: 'Sound Effects' },
  { id: '8', title: 'Why so serious?', creator: '0x5555...6666', wins: 15, losses: 38, totalBattles: 53, category: 'Movie Quotes' },
];

export const ArenaProvider = ({ children }: { children: ReactNode }) => {
  const [audioClips, setAudioClips] = useState<AudioMeme[]>(() => {
    const saved = localStorage.getItem('arena_audio_clips');
    return saved ? JSON.parse(saved) : initialAudioPool;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('arena_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [userPoints, setUserPoints] = useState<number>(() => {
    const saved = localStorage.getItem('arena_user_points');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('arena_audio_clips', JSON.stringify(audioClips));
  }, [audioClips]);

  useEffect(() => {
    localStorage.setItem('arena_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('arena_user_points', userPoints.toString());
  }, [userPoints]);

  const addAudioClip = (clip: Omit<AudioMeme, 'id' | 'wins' | 'losses' | 'totalBattles'>) => {
    const newClip: AudioMeme = {
      ...clip,
      id: Date.now().toString(),
      wins: 0,
      losses: 0,
      totalBattles: 0,
    };
    setAudioClips(prev => [...prev, newClip]);
  };

  const addCategory = (name: string) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      name,
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const addPoints = (points: number) => {
    setUserPoints(prev => prev + points);
  };

  const updateClipStats = (clipId: string, won: boolean) => {
    setAudioClips(prev =>
      prev.map(clip =>
        clip.id === clipId
          ? {
              ...clip,
              wins: won ? clip.wins + 1 : clip.wins,
              losses: won ? clip.losses : clip.losses + 1,
              totalBattles: clip.totalBattles + 1,
            }
          : clip
      )
    );
  };

  return (
    <ArenaContext.Provider
      value={{
        audioClips,
        categories,
        userPoints,
        addAudioClip,
        addCategory,
        addPoints,
        updateClipStats,
      }}
    >
      {children}
    </ArenaContext.Provider>
  );
};

export const useArena = () => {
  const context = useContext(ArenaContext);
  if (!context) {
    throw new Error('useArena must be used within ArenaProvider');
  }
  return context;
};
