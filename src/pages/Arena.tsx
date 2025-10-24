import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Play, Trophy, Users, Sparkles, FolderPlus, Zap, Share2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { useArena } from '@/contexts/ArenaContext';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { supabase } from '@/integrations/supabase/client';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Leaderboard } from '@/components/Leaderboard';

interface Battle {
  id: string;
  category: string;
  categoryId: string;
  contestants: [any, any];
}

const Arena = () => {
  const navigate = useNavigate();
  const { audioClips, categories, refreshData, getOrCreateProfile } = useArena();
  const { walletAddress, isConnected } = useSolanaWallet();
  const { setVisible } = useWalletModal();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState('');
  const [selectedUploadCategory, setSelectedUploadCategory] = useState('');
  const [battles, setBattles] = useState<Battle[]>([]);
  const [votedBattles, setVotedBattles] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [, setTick] = useState(0);

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate battles only when clips change
  useEffect(() => {
    generateBattles();
  }, [audioClips.length, selectedCategory]);

  const generateBattles = () => {
    const newBattles: Battle[] = [];
    
    categories.forEach(category => {
      const categoryClips = audioClips.filter(clip => clip.category === category.name);
      if (categoryClips.length >= 2) {
        // Create battles for all pairs
        for (let i = 0; i < categoryClips.length; i += 2) {
          if (i + 1 < categoryClips.length) {
            newBattles.push({
              id: `${category.name}-${i}`,
              category: category.name,
              categoryId: category.id,
              contestants: [categoryClips[i], categoryClips[i + 1]]
            });
          }
        }
      }
    });
    
    setBattles(newBattles);
  };

  const requireWallet = () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      setVisible(true);
      return false;
    }
    return true;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!requireWallet()) return;
    
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setSelectedFile(file);
      toast.success('Audio file selected!');
    } else {
      toast.error('Please select a valid audio file');
    }
  };

  const handleUpload = async () => {
    if (!requireWallet()) return;
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

    // Ensure user has a profile
    await getOrCreateProfile(walletAddress!);

    const categoryClipsCount = audioClips.filter(
      clip => clip.categoryId === selectedUploadCategory
    ).length;
    
    if (categoryClipsCount >= 10) {
      toast.error('This category has reached maximum entries (10)');
      return;
    }

    try {
      // Upload audio file to storage
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-clips')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-clips')
        .getPublicUrl(fileName);

      // Insert audio clip with URL
      const { error } = await supabase
        .from('audio_clips')
        .insert({
          title: audioTitle,
          creator_wallet: walletAddress!,
          category_id: selectedUploadCategory,
          audio_url: publicUrl,
        });

      if (error) throw error;

      // Award points
      await supabase.rpc('add_user_points', { wallet: walletAddress!, points_to_add: 10 });

      toast.success('Audio uploaded! You earned 10 points! 🎉');
      setSelectedFile(null);
      setAudioTitle('');
      setSelectedUploadCategory('');
      refreshData();
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast.error('Failed to upload audio clip');
    }
  };

  const handleVote = async (battleId: string, clipId: string) => {
    if (!requireWallet()) return;

    // Ensure user has a profile
    await getOrCreateProfile(walletAddress!);

    try {
      // Check if user already voted for this clip
      const { data: existingVotes } = await supabase
        .from('votes')
        .select('*')
        .eq('voter_wallet', walletAddress)
        .eq('clip_id', clipId)
        .maybeSingle();

      if (existingVotes) {
        toast.error('You already voted for this clip!');
        return;
      }

      // Insert vote
      const { error } = await supabase
        .from('votes')
        .insert({
          voter_wallet: walletAddress!,
          clip_id: clipId,
          battle_id: battleId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already voted in this battle');
        } else {
          throw error;
        }
        return;
      }

      // Award points
      await supabase.rpc('add_user_points', { wallet: walletAddress!, points_to_add: 5 });

      setVotedBattles(prev => new Set(prev).add(battleId));
      toast.success('Vote recorded! You earned 5 points!');
      refreshData();
    } catch (error: any) {
      console.error('Error voting:', error);
      toast.error('Failed to record vote');
    }
  };

  const handleShare = (clipId: string, clipTitle: string) => {
    const shareUrl = `${window.location.origin}/arena?clip=${clipId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(`Link copied for ${clipTitle}!`);
  };

  const filteredBattles = selectedCategory === 'all' 
    ? battles 
    : battles.filter(b => b.category === selectedCategory);

  const totalVotes = audioClips.reduce((sum, clip) => sum + clip.votes, 0);

  const categoriesWithCount = categories.map(cat => ({
    ...cat,
    entriesCount: audioClips.filter(clip => clip.categoryId === cat.id).length,
  }));

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s`;
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
                  <div className="text-2xl font-bold">{audioClips.length}</div>
                  <div className="text-sm text-muted-foreground">Audio Clips</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border">
            <CardContent className="pt-6">
              <Button 
                variant="glow" 
                className="w-full h-full"
                onClick={() => {
                  if (requireWallet()) navigate('/create-category');
                }}
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                Create Category
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Battle Arena and Leaderboard Tabs */}
        <Tabs defaultValue="arena" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="arena">Battle Arena</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="arena">
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
              className="cursor-pointer px-4 py-2 whitespace-nowrap flex items-center gap-2"
              onClick={() => setSelectedCategory(cat.name)}
            >
              <span>{cat.name} ({cat.entriesCount}/10)</span>
              <span className="text-xs opacity-75 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {getTimeRemaining(cat.expiresAt)}
              </span>
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
                        <option key={cat.id} value={cat.id}>
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
                    <p>• Connect your Solana wallet</p>
                    <p>• Upload audio clips for free</p>
                    <p>• Earn 10 points per upload</p>
                    <p>• Max 10 entries per category</p>
                    <p>• Vote to earn 5 points</p>
                    <p>• Share clips to get votes</p>
                    <p>• Top clip wins 25 points after 24h</p>
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
                  const category = categories.find(c => c.id === battle.categoryId);
                  return (
                    <Card key={battle.id} className="glass-strong border-border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">1v1 Battle</CardTitle>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-accent text-accent flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {category && getTimeRemaining(category.expiresAt)}
                            </Badge>
                            <Badge variant="outline" className="border-primary text-primary">
                              {battle.category}
                            </Badge>
                          </div>
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
                                  {meme.creatorUsername ? (
                                    <Link 
                                      to={`/profile/${meme.creatorUsername}`}
                                      className="text-xs text-muted-foreground hover:text-primary transition-colors mb-1 inline-block"
                                    >
                                      @{meme.creatorUsername}
                                    </Link>
                                  ) : (
                                    <p className="text-xs text-muted-foreground mb-1">
                                      {meme.creator.slice(0, 4)}...{meme.creator.slice(-4)}
                                    </p>
                                  )}
                                  <p className="text-sm text-primary font-semibold">{meme.votes} votes</p>
                                </div>

                                {meme.audioUrl ? (
                                  <div className="mb-3">
                                    <AudioPlayer audioUrl={meme.audioUrl} title={meme.title} />
                                  </div>
                                ) : (
                                  <div className="mb-3 glass rounded-lg p-3 text-center">
                                    <p className="text-xs text-muted-foreground">No audio available</p>
                                  </div>
                                )}

                                <div className="flex gap-2">
                                  <Button
                                    variant={hasVoted ? "outline" : "glow"}
                                    size="sm"
                                    className="flex-1"
                                    disabled={hasVoted}
                                    onClick={() => handleVote(battle.id, meme.id)}
                                  >
                                    {hasVoted ? '✓ Voted' : 'Vote (+5 pts)'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleShare(meme.id, meme.title)}
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </Button>
                                </div>
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
                    <p className="text-muted-foreground">
                      {selectedCategory === 'all' 
                        ? 'No battles yet. Upload some audio clips to get started!' 
                        : 'No battles in this category yet. Need at least 2 clips.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <div className="max-w-4xl mx-auto">
              <Leaderboard />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Arena;
