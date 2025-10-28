import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useArena } from '@/contexts/ArenaContext';
import { toast } from 'sonner';
import { Play, Volume2 } from 'lucide-react';
import { useState } from 'react';

const megaphoneColors = [
  'from-orange-500 to-red-500',
  'from-red-500 to-pink-600',
  'from-pink-500 to-purple-500',
  'from-teal-400 to-cyan-500',
  'from-yellow-400 to-orange-500',
];

const getMegaphoneIcon = (index: number) => {
  const colorClass = megaphoneColors[index % megaphoneColors.length];
  return (
    <div className={`relative w-24 h-24 mx-auto mb-4 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center shadow-lg`}>
      <Volume2 className="w-12 h-12 text-white" />
      <div className="absolute -right-2 -top-2">
        <div className={`w-8 h-8 bg-gradient-to-br ${colorClass} rounded-full animate-ping opacity-75`} />
        <div className={`absolute top-0 w-8 h-8 bg-gradient-to-br ${colorClass} rounded-full`} />
      </div>
    </div>
  );
};

export const TopFiveTokens = () => {
  const { audioClips } = useArena();
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const topFive = [...audioClips]
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 5);

  if (!topFive.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No audio clips available yet. Be the first to upload in the Arena!
      </div>
    );
  }

  const generateTokenSymbol = (title: string) => {
    const name = title.split('.')[0].toUpperCase();
    return `$${name.slice(0, 6)}`;
  };

  const generateMarketCap = (votes: number) => {
    const base = Math.max(votes * 1000, 1000);
    const randomFactor = 0.8 + Math.random() * 0.4;
    return Math.floor(base * randomFactor);
  };

  const generatePrice = (marketCap: number) => {
    return (marketCap / 1000000).toFixed(4);
  };

  const handlePlay = (clipId: string, audioUrl: string) => {
    if (playingId === clipId) {
      setPlayingId(null);
    } else {
      setPlayingId(clipId);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setPlayingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
      {topFive.map((clip, idx) => {
        const marketCap = generateMarketCap(clip.votes || 0);
        const price = generatePrice(marketCap);
        const tokenSymbol = generateTokenSymbol(clip.title);

        return (
          <Card key={clip.id} className="glass-strong border-border p-6 flex flex-col items-center text-center space-y-4 hover:glow-primary transition-all">
            {getMegaphoneIcon(idx)}
            
            <div className="space-y-2 w-full">
              <h3 className="text-xl font-bold truncate">{clip.title}</h3>
              <p className="text-primary text-lg font-semibold">{tokenSymbol}</p>
              {clip.creatorUsername && (
                <p className="text-sm text-muted-foreground">by {clip.creatorUsername}</p>
              )}
            </div>

            <Button
              variant="ghost"
              size="lg"
              className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => handlePlay(clip.id, clip.audioUrl)}
            >
              <Play className={`w-6 h-6 ${playingId === clip.id ? 'animate-pulse' : ''}`} fill="currentColor" />
            </Button>

            <div className="space-y-1 text-sm w-full">
              <p className="text-foreground">${marketCap.toLocaleString()} Market Cap</p>
              <p className="text-muted-foreground">${price} Price</p>
            </div>

            <div className="space-y-2 w-full">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => toast.message('Coming Soon', { description: 'Trading functionality coming soon!' })}
              >
                Trade on Raydium
              </Button>
              {idx < 3 && (
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => toast.message('Coming Soon', { description: 'Staking functionality coming soon!' })}
                >
                  Stake
                </Button>
              )}
              {idx === 2 && (
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => toast.message('Coming Soon', { description: 'Remix Battle coming soon!' })}
                >
                  Remix Battle
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default TopFiveTokens;
