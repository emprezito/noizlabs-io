import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Trophy, TrendingUp, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface AudioMeme {
  id: string;
  title: string;
  creator: string;
  votes: number;
  plays: number;
  rank: number;
}

const mockLeaderboard: AudioMeme[] = [
  { id: '1', title: 'EMOTIONAL DAMAGE', creator: '0x1234...5678', votes: 1250, plays: 15420, rank: 1 },
  { id: '2', title: 'Its Corn!', creator: '0xabcd...efgh', votes: 980, plays: 12300, rank: 2 },
  { id: '3', title: 'Bing Chilling', creator: '0x9876...5432', votes: 875, plays: 10500, rank: 3 },
  { id: '4', title: 'Gangnam Style Drop', creator: '0xdead...beef', votes: 720, plays: 8900, rank: 4 },
  { id: '5', title: 'Subway Surfers Theme', creator: '0xcafe...babe', votes: 650, plays: 7800, rank: 5 },
];

const Arena = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

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
    toast.success('Vote recorded!');
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="glass-strong border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">$5,420</div>
                  <div className="text-sm text-muted-foreground">Prize Pool</div>
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
                  <div className="text-2xl font-bold">1,337</div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/20">
                  <TrendingUp className="w-6 h-6 text-accent" />
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
                <div className="p-3 rounded-lg bg-primary/20">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">5d 12h</div>
                  <div className="text-sm text-muted-foreground">Time Left</div>
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
                  <h4 className="font-semibold mb-3">Voting Breakdown</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Community</span>
                      <span className="text-primary font-semibold">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Engagement</span>
                      <span className="text-secondary font-semibold">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Curators</span>
                      <span className="text-accent font-semibold">15%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboard */}
          <div className="lg:col-span-2">
            <Card className="glass-strong border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Weekly Leaderboard
                </CardTitle>
                <CardDescription>Top audio memes competing for rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLeaderboard.map((meme) => (
                    <div
                      key={meme.id}
                      className="glass rounded-lg p-4 hover:glass-strong transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                            meme.rank === 1 ? 'bg-primary/20 text-primary' :
                            meme.rank === 2 ? 'bg-secondary/20 text-secondary' :
                            meme.rank === 3 ? 'bg-accent/20 text-accent' :
                            'bg-muted/20 text-muted-foreground'
                          }`}>
                            #{meme.rank}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">{meme.title}</h4>
                            {meme.rank <= 3 && (
                              <Badge variant="outline" className="border-primary text-primary">
                                Top 3
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{meme.creator}</p>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">{meme.votes}</div>
                          <div className="text-xs text-muted-foreground">votes</div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setIsPlaying(isPlaying === meme.id ? null : meme.id)}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="glow"
                            onClick={() => handleVote(meme.id)}
                          >
                            Vote
                          </Button>
                        </div>
                      </div>

                      {isPlaying === meme.id && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full w-1/3 bg-gradient-to-r from-primary to-accent animate-pulse" />
                            </div>
                            <span className="text-xs text-muted-foreground">0:08 / 0:24</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arena;
