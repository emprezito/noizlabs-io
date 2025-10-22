import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Trophy, Users, Sparkles, FolderPlus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useArena } from '@/contexts/ArenaContext';

interface AudioMeme {
  id: string;
  title: string;
  creator: string;
  wins: number;
  losses: number;
  totalBattles: number;
  category: string;
}

interface CategoryWithCount {
  id: string;
  name: string;
  entriesCount: number;
}

interface Battle {
  id: string;
  category: string;
  contestants: [AudioMeme, AudioMeme];
}

const Arena = () => {
  const navigate = useNavigate();
  const { audioClips, categories, userPoints, addAudioClip, addPoints, updateClipStats } = useArena();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState('');
  const [selectedUploadCategory, setSelectedUploadCategory] = useState('');
  const [battles, setBattles] = useState<Battle[]>([]);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [votedBattles, setVotedBattles] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calculate category counts dynamically
  const categoriesWithCount: CategoryWithCount[] = categories.map(cat => ({
    ...cat,
    entriesCount: audioClips.filter(clip => clip.category === cat.name).length,
  }));

  useEffect(() => {
    generateBattles();
  }, [audioClips]);

  const generateBattles = () => {
    const newBattles: Battle[] = [];
    
    categories.forEach(category => {
      const categoryClips = audioClips.filter(clip => clip.category === category.name);
      if (categoryClips.length >= 2) {
        const shuffled = [...categoryClips].sort(() => Math.random() - 0.5);
        newBattles.push({
          id: `${category.name}-${Date.now()}-${Math.random()}`,
          category: category.name,
          contestants: [shuffled[0], shuffled[1]]
        });
      }
    });
    
    setBattles(newBattles.sort(() => Math.random() - 0.5));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      toast.success('Audio file selected!');
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please select an audio file');
      return;
    }
    if (!audioTitle) {
      toast.error('Please enter a title');
      return;
    }
    if (!selectedUploadCategory) {
      toast.error('Please select a category');
      return;
    }

    // Check if category has reached max entries
    const categoryClipsCount = audioClips.filter(
      clip => clip.category === selectedUploadCategory
    ).length;
    
    if (categoryClipsCount >= 10) {
      toast.error('This category has reached maximum entries (10)');
      return;
    }

    // Add the audio clip
    addAudioClip({
      title: audioTitle,
      creator: '0x1234...5678', // Mock wallet address
      category: selectedUploadCategory,
    });

    // Award points
    addPoints(10);

    toast.success('Audio uploaded! You earned 10 points! 🎉');
    setSelectedFile(null);
    setAudioTitle('');
    setSelectedUploadCategory('');
  };

  const handleVote = (battleId: string, clipId: string, opponentId: string) => {
    // Mark this battle as voted
    setVotedBattles(prev => new Set(prev).add(battleId));
    
    // Update clip stats - winner gets +1 win, loser gets +1 loss
    updateClipStats(clipId, true);
    updateClipStats(opponentId, false);
    
    // Award 5 points for voting
    addPoints(5);
    
    toast.success('Vote recorded! You earned 5 points!');
  };

  const filteredBattles = selectedCategory === 'all' 
    ? battles 
    : battles.filter(b => b.category === selectedCategory);

  // Calculate total votes from all clips
  const totalVotes = audioClips.reduce((sum, clip) => sum + clip.totalBattles, 0);

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

        {/* Stats & Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-strong border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/20">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalVotes}</div>
                  <div className="text-sm text-muted-foreground">Total Votes</div>
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
                  <div className="text-2xl font-bold">{categories.length}</div>
                  <div className="text-sm text-muted-foreground">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/20">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{userPoints}</div>
                  <div className="text-sm text-muted-foreground">Your Points</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border">
            <CardContent className="pt-6">
              <Button 
                variant="glow" 
                className="w-full h-full"
                onClick={() => navigate('/create-category')}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer px-4 py-2"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Badge>
          {categoriesWithCount.map(cat => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.name ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2 whitespace-nowrap"
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.name} ({cat.entriesCount}/10)
            </Badge>
          ))}
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card className="glass-strong border-border glow-primary sticky top-24">
              <CardHeader>
                <CardTitle>Upload Audio</CardTitle>
                <CardDescription>Free to upload and compete</CardDescription>
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
                    <Input 
                      placeholder="Audio Title" 
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                    />
                    <select 
                      className="w-full p-2 rounded-lg glass border border-border"
                      value={selectedUploadCategory}
                      onChange={(e) => setSelectedUploadCategory(e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categoriesWithCount.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name} ({cat.entriesCount}/10)
                        </option>
                      ))}
                    </select>
                    <Badge variant="outline" className="border-primary text-primary w-full justify-center py-2">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Earn 10 Points
                    </Badge>
                    <Button variant="glow" className="w-full" onClick={handleUpload}>
                      <Zap className="w-4 h-4 mr-2" />
                      Upload Free
                    </Button>
                  </>
                )}

                <div className="glass rounded-lg p-4 mt-6">
                  <h4 className="font-semibold mb-3">How It Works</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Upload audio clips for free</p>
                    <p>• Earn 10 points per upload</p>
                    <p>• Max 10 entries per category</p>
                    <p>• Community votes in 1v1 battles</p>
                    <p>• Create categories for 50 points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Battle Feed */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredBattles.length > 0 ? (
                filteredBattles.map((battle) => {
                  const hasVoted = votedBattles.has(battle.id);
                  return (
                    <Card key={battle.id} className="glass-strong border-border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">1v1 Battle</CardTitle>
                          <Badge variant="outline" className="border-primary text-primary">
                            {battle.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          {battle.contestants.map((meme) => (
                            <Card 
                              key={meme.id}
                              className="glass border-border transition-all hover:border-primary"
                            >
                              <CardContent className="pt-6 space-y-4">
                                <div className="text-center">
                                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white" />
                                  </div>
                                  <h3 className="text-lg font-bold mb-1">{meme.title}</h3>
                                  <p className="text-xs text-muted-foreground mb-3">{meme.creator}</p>
                                </div>

                                <Button
                                  variant={isPlaying === meme.id ? "outline" : "ghost"}
                                  size="sm"
                                  className="w-full"
                                  onClick={() => setIsPlaying(isPlaying === meme.id ? null : meme.id)}
                                >
                                  <Play className="w-3 h-3 mr-2" />
                                  {isPlaying === meme.id ? 'Playing...' : 'Preview'}
                                </Button>

                                {isPlaying === meme.id && (
                                  <div className="flex items-center gap-2 px-2">
                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full w-1/3 bg-gradient-to-r from-primary to-accent animate-pulse" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">0:08</span>
                                  </div>
                                )}

                                <Button
                                  variant={hasVoted ? "outline" : "glow"}
                                  size="sm"
                                  className="w-full"
                                  disabled={hasVoted}
                                  onClick={() => {
                                    const opponent = battle.contestants.find(c => c.id !== meme.id);
                                    if (opponent) handleVote(battle.id, meme.id, opponent.id);
                                  }}
                                >
                                  {hasVoted ? '✓ Voted' : 'Vote (+5 pts)'}
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="glass-strong border-border">
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No battles in this category yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arena;
