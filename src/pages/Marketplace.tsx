import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Volume2 } from 'lucide-react';
import { useArena } from '@/contexts/ArenaContext';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useNavigate } from 'react-router-dom';

const Marketplace = () => {
  const { audioClips } = useArena();
  const navigate = useNavigate();
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  // Get top 5 clips by votes
  const top5Clips = [...audioClips]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);

  const handlePlayPause = (clipId: string) => {
    setPlayingClipId(playingClipId === clipId ? null : clipId);
  };

  const megaphoneColors = [
    'from-orange-500 to-red-500',
    'from-red-500 to-pink-500',
    'from-pink-500 to-purple-500',
    'from-cyan-500 to-teal-500',
    'from-blue-500 to-purple-500',
  ];

  const tokenTickers = [
    '$AHHHH',
    '$RIZZ',
    '$CRUNCH',
    '$GIGA',
    '$NOIZ'
  ];

  return (
    <div className="min-h-screen pt-24 pb-24 md:pb-12">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold">
            Top 5 Meme Sounds This Week – Now Tokenized 🎧💥
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Every week, the loudest memes are crowned – and their sounds are turned into tradable tokens. Discover them below.
          </p>
          <Button 
            variant="default" 
            size="lg"
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-8 py-6 text-lg rounded-lg"
            onClick={() => navigate('/arena')}
          >
            View Leaderboard
          </Button>
        </div>

        {/* Top 5 Clips Grid */}
        {top5Clips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {top5Clips.map((clip, index) => (
              <Card 
                key={clip.id} 
                className="glass-strong border border-border/50 hover:border-primary/50 transition-all duration-300"
              >
                <CardContent className="p-6 space-y-6">
                  {/* Megaphone Icon */}
                  <div className="flex justify-center">
                    <div className={`relative w-32 h-32 bg-gradient-to-br ${megaphoneColors[index]} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <Volume2 className="w-16 h-16 text-white" />
                      <div className="absolute -right-2 -top-2">
                        <div className="relative">
                          {[...Array(3)].map((_, i) => (
                            <div 
                              key={i}
                              className={`absolute w-4 h-1 bg-gradient-to-r ${megaphoneColors[index]} rounded-full`}
                              style={{
                                right: `${i * 8}px`,
                                top: `${i * 6}px`,
                                transform: 'rotate(-45deg)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title & Token */}
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold truncate">{clip.title}</h3>
                    <Badge variant="outline" className="text-[#2563eb] border-[#2563eb] text-lg px-3 py-1">
                      {tokenTickers[index] || `$${clip.title.slice(0, 5).toUpperCase()}`}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground text-center min-h-[40px]">
                    {clip.creatorUsername ? `By ${clip.creatorUsername}` : 'Viral sound'}
                  </p>

                  {/* Play Button */}
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      className="w-16 h-16 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-lg"
                      onClick={() => handlePlayPause(clip.id)}
                    >
                      <Play className="w-6 h-6 fill-white" />
                    </Button>
                  </div>

                  {/* Audio Player (hidden) */}
                  {clip.audioUrl && playingClipId === clip.id && (
                    <div className="hidden">
                      <AudioPlayer audioUrl={clip.audioUrl} />
                    </div>
                  )}

                  {/* Stats */}
                  <div className="space-y-2 text-sm text-center pt-4 border-t border-border/50">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Market Cap</span>
                      <span className="font-semibold">${(Math.random() * 20000 + 4000).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold">${(Math.random() * 0.5).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Votes</span>
                      <span className="font-semibold">{clip.votes}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full border-border/50 hover:border-primary/50"
                      disabled
                    >
                      Trade on Raydium
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full border-border/50 hover:border-primary/50"
                      disabled
                    >
                      Stake
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="glass-strong border-border max-w-2xl mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-xl text-muted-foreground">
                No audio clips yet. Start uploading in the Arena to see top clips here!
              </p>
              <Button 
                variant="glow" 
                size="lg"
                className="mt-6"
                onClick={() => navigate('/arena')}
              >
                Go to Arena
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Coming Soon Notice */}
        <div className="text-center mt-16 max-w-2xl mx-auto">
          <Card className="glass border-border/50">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground">
                Trading features coming soon! Join our{' '}
                <a 
                  href="https://t.me/noizlabs_io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Telegram community
                </a>
                {' '}for updates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
