import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useArena } from '@/contexts/ArenaContext';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState('');
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  
  const topFive = [...audioClips]
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 5);

  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

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

  const handlePlay = (clipId: string, audioUrl: string) => {
    if (playingId === clipId) {
      if (audioRefs.current[clipId]) {
        audioRefs.current[clipId].pause();
      }
      setPlayingId(null);
    } else {
      Object.values(audioRefs.current).forEach(audio => audio.pause());
      
      if (!audioRefs.current[clipId]) {
        audioRefs.current[clipId] = new Audio(audioUrl);
        audioRefs.current[clipId].onended = () => setPlayingId(null);
      }
      
      audioRefs.current[clipId].play();
      setPlayingId(clipId);
    }
  };

  const handleComingSoon = (feature: string) => {
    setComingSoonTitle(feature);
    setShowComingSoon(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
        {topFive.map((clip, idx) => {
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
                {playingId === clip.id ? (
                  <Pause className="w-6 h-6" fill="currentColor" />
                ) : (
                  <Play className="w-6 h-6" fill="currentColor" />
                )}
              </Button>

              <div className="space-y-2 w-full">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleComingSoon('Trading')}
                >
                  Trade on Raydium
                </Button>
                {idx < 3 && (
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => handleComingSoon('Staking')}
                  >
                    Stake
                  </Button>
                )}
                {idx === 2 && (
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => handleComingSoon('Remix Battle')}
                  >
                    Remix Battle
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coming Soon! 🚀</DialogTitle>
            <DialogDescription>
              {comingSoonTitle} functionality is currently under development. Stay tuned for updates!
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowComingSoon(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TopFiveTokens;
