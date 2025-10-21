import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Trophy, Users, Zap, Swords } from 'lucide-react';
import { toast } from 'sonner';

interface AudioMeme {
  id: string;
  title: string;
  creator: string;
  wins: number;
  losses: number;
  totalBattles: number;
}

const mockAudioPool: AudioMeme[] = [
  { id: '1', title: 'EMOTIONAL DAMAGE', creator: '0x1234...5678', wins: 45, losses: 12, totalBattles: 57 },
  { id: '2', title: 'Its Corn!', creator: '0xabcd...efgh', wins: 38, losses: 19, totalBattles: 57 },
  { id: '3', title: 'Bing Chilling', creator: '0x9876...5432', wins: 32, losses: 23, totalBattles: 55 },
  { id: '4', title: 'Gangnam Style Drop', creator: '0xdead...beef', wins: 28, losses: 25, totalBattles: 53 },
  { id: '5', title: 'Subway Surfers Theme', creator: '0xcafe...babe', wins: 25, losses: 28, totalBattles: 53 },
  { id: '6', title: 'Bruh Sound Effect #2', creator: '0x1111...2222', wins: 22, losses: 31, totalBattles: 53 },
  { id: '7', title: 'Vine Boom', creator: '0x3333...4444', wins: 19, losses: 34, totalBattles: 53 },
  { id: '8', title: 'Taco Bell Bong', creator: '0x5555...6666', wins: 15, losses: 38, totalBattles: 53 },
];

const Arena = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentBattle, setCurrentBattle] = useState<[AudioMeme, AudioMeme] | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);

  useEffect(() => {
    loadNextBattle();
  }, []);

  const loadNextBattle = () => {
    // Pick two random audio clips for battle
    const shuffled = [...mockAudioPool].sort(() => Math.random() - 0.5);
    setCurrentBattle([shuffled[0], shuffled[1]]);
    setVotedFor(null);
    setIsPlaying(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success('Audio file selected!');
    }
  };

  const handleEnterBattle = () => {
    toast.info('Battle entry requires $0.50 in USDC or $NOIZ');
  };

  const handleVote = (id: string) => {
    setVotedFor(id);
    toast.success('Vote recorded! Loading next battle...');
    setTimeout(loadNextBattle, 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gradient">Audio Arena</h1>
          <p className="text-xl text-muted-foreground">
            Battle for glory. Vote for winners. Earn rewards.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="glass-strong border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Swords className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">1,337</div>
                  <div className="text-sm text-muted-foreground">Active Battles</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-secondary/20">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">89.2K</div>
                  <div className="text-sm text-muted-foreground">Total Votes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/20">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">$5,420</div>
                  <div className="text-sm text-muted-foreground">Prize Pool</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="glass-strong border-border glow-primary">
              <CardHeader>
                <CardTitle>Enter Battle</CardTitle>
                <CardDescription>Upload your audio meme to compete</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="cursor-pointer">
                    <p className="font-medium mb-2">
                      {selectedFile ? selectedFile.name : 'Click to upload'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      MP3, WAV, or OGG (max 30s)
                    </p>
                  </label>
                </div>

                {selectedFile && (
                  <>
                    <Input placeholder="Audio Title" />
                    <div className="p-4 glass rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Entry Fee</p>
                      <p className="text-2xl font-bold">$0.50</p>
                      <p className="text-xs text-muted-foreground">in USDC or $NOIZ</p>
                    </div>
                    <Button variant="hero" className="w-full" onClick={handleEnterBattle}>
                      <Zap className="w-4 h-4" />
                      Enter Battle
                    </Button>
                  </>
                )}

                <div className="glass rounded-lg p-4 mt-6">
                  <h4 className="font-semibold mb-3">How It Works</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Upload your audio meme</p>
                    <p>• Face random opponents in 1v1 battles</p>
                    <p>• Community votes for the winner</p>
                    <p>• Win battles to climb the ranks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Battle Arena */}
          <div className="lg:col-span-2">
            <Card className="glass-strong border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-primary" />
                  Audio Battle Arena
                </CardTitle>
                <CardDescription>Vote for your favorite audio meme</CardDescription>
              </CardHeader>
              <CardContent>
                {currentBattle ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <Badge variant="outline" className="border-primary text-primary mb-4">
                        Round {Math.floor(Math.random() * 100) + 1}
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      {currentBattle.map((meme, index) => (
                        <Card 
                          key={meme.id}
                          className={`glass border-border transition-all ${
                            votedFor === meme.id ? 'ring-2 ring-primary glow-primary' : ''
                          } ${votedFor && votedFor !== meme.id ? 'opacity-50' : ''}`}
                        >
                          <CardContent className="pt-6 space-y-4">
                            <div className="text-center">
                              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                              <h3 className="text-xl font-bold mb-2">{meme.title}</h3>
                              <p className="text-sm text-muted-foreground mb-4">{meme.creator}</p>
                            </div>

                            <div className="glass rounded-lg p-3 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Wins</span>
                                <span className="text-primary font-bold">{meme.wins}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Losses</span>
                                <span className="text-destructive font-bold">{meme.losses}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Win Rate</span>
                                <span className="font-bold">
                                  {((meme.wins / meme.totalBattles) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>

                            <Button
                              variant={isPlaying === meme.id ? "outline" : "ghost"}
                              className="w-full"
                              onClick={() => setIsPlaying(isPlaying === meme.id ? null : meme.id)}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              {isPlaying === meme.id ? 'Playing...' : 'Preview'}
                            </Button>

                            {isPlaying === meme.id && (
                              <div className="flex items-center gap-2 px-2">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full w-1/3 bg-gradient-to-r from-primary to-accent animate-pulse" />
                                </div>
                                <span className="text-xs text-muted-foreground">0:08 / 0:24</span>
                              </div>
                            )}

                            <Button
                              variant="glow"
                              className="w-full"
                              disabled={votedFor !== null}
                              onClick={() => handleVote(meme.id)}
                            >
                              {votedFor === meme.id ? '✓ Voted!' : 'Vote'}
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {votedFor && (
                      <div className="text-center text-sm text-muted-foreground animate-pulse">
                        Loading next battle...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading battle...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arena;
