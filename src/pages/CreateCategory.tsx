import { useState } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Sparkles, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useArena } from '@/contexts/ArenaContext';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { supabase } from '@/integrations/supabase/client';

const AVAILABLE_GENRES = [
  'Hip Hop/Rap',
  'Electronic/EDM',
  'Rock',
  'Pop',
  'R&B/Soul',
  'Jazz',
  'Classical',
  'Country',
  'Metal',
  'Reggae',
  'Latin',
  'Blues',
  'Folk',
  'Indie',
  'Ambient',
  'Lo-fi',
  'Afrobeats',
  'Dancehall',
  'House',
  'Techno',
];

const CreateCategory = () => {
  const navigate = useNavigate();
  const { categories, refreshData, fetchUserPoints } = useArena();
  const { walletAddress, isConnected } = useSolanaWallet();
  const { setVisible } = useWalletModal();
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateDailyQuest = async (wallet: string) => {
    try {
      // Get user's timezone
      const { data: profileData } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('wallet_address', wallet)
        .maybeSingle();
      
      const timezone = profileData?.timezone || 'UTC';
      
      // Get today's date in user's timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      
      const parts = formatter.formatToParts(new Date());
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      const today = `${year}-${month}-${day}`;
      
      // Get or create today's quest
      const { data: existingQuest } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('user_wallet', wallet)
        .eq('quest_date', today)
        .single();

      const newValue = existingQuest ? existingQuest.categories_created + 1 : 1;
      const questCompleted = newValue === 1 && !existingQuest;

      // Upsert quest progress
      await supabase
        .from('daily_quests')
        .upsert({
          user_wallet: wallet,
          quest_date: today,
          categories_created: newValue,
        }, {
          onConflict: 'user_wallet,quest_date'
        });

      // Award 10 points if quest just completed
      if (questCompleted) {
        await supabase.rpc('add_user_points', {
          wallet: wallet,
          points_to_add: 10,
        });
        toast.success('Daily quest completed! +10 bonus points! 🎯');
      }
    } catch (error) {
      console.error('Error updating daily quest:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      setVisible(true);
      return;
    }

    if (!categoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (!selectedGenre) {
      toast.error('Please select a genre');
      return;
    }

    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }

    // Check if user has created 5 categories in the last 24 hours
    const { data: recentCategories, error: countError } = await supabase
      .from('categories')
      .select('id')
      .eq('creator_wallet', walletAddress)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (countError) {
      console.error('Error checking category limit:', countError);
      toast.error('Failed to check category limit');
      return;
    }

    if (recentCategories && recentCategories.length >= 5) {
      toast.error('You can only create 5 categories per day');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create category
      const { error } = await supabase
        .from('categories')
        .insert({
          name: categoryName,
          creator_wallet: walletAddress,
          genre: selectedGenre,
        });

      if (error) throw error;

      // Award 50 points
      await supabase.rpc('add_user_points', { wallet: walletAddress, points_to_add: 50 });

      // Update daily quest progress
      await updateDailyQuest(walletAddress);

      // Check if this is user's first category and they were referred
      const { data: userCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('creator_wallet', walletAddress);

      const isFirstCategory = userCategories && userCategories.length === 1;

      if (isFirstCategory) {
        // Check if user was referred
        const { data: profileData } = await supabase
          .from('profiles')
          .select('referred_by')
          .eq('wallet_address', walletAddress)
          .single();

        if (profileData?.referred_by) {
          // Award 100 points to both user and referrer
          await supabase.rpc('add_user_points', {
            wallet: walletAddress,
            points_to_add: 100,
          });

          await supabase.rpc('add_user_points', {
            wallet: profileData.referred_by,
            points_to_add: 100,
          });

          // Update referrer's referral count and referred_users array
          const { data: referrerData } = await supabase
            .from('profiles')
            .select('referral_count, referred_users')
            .eq('wallet_address', profileData.referred_by)
            .single();

          if (referrerData) {
            await supabase
              .from('profiles')
              .update({ 
                referral_count: (referrerData.referral_count || 0) + 1,
                referred_users: [...(referrerData.referred_users || []), walletAddress]
              })
              .eq('wallet_address', profileData.referred_by);
          }

          toast.success('Category created! You and your referrer earned 100 points each! 🎉');
        } else {
          toast.success('Category created successfully! 🎉');
        }
      } else {
        toast.success('Category created successfully! 🎉');
      }

      await refreshData();
      await fetchUserPoints(walletAddress);
      navigate('/arena');
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 md:pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/arena')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Arena
        </Button>

        <Card className="glass-strong border-border glow-primary">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-primary/20">
                <FolderPlus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Create New Category</CardTitle>
                <CardDescription>Define a new audio clip category (7 day duration)</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-primary text-primary w-fit">
              <Sparkles className="w-3 h-3 mr-1" />
              Earns 50 Points
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                placeholder="e.g., Movie Quotes, Audio Memes, Voiceovers..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre">Genre</Label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger id="genre">
                  <SelectValue placeholder="Select a genre" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what kind of audio clips belong in this category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="glass rounded-lg p-4">
              <h4 className="font-semibold mb-3">Category Rules</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Category lasts for 7 days</p>
                <p>• Unlimited audio entries per category</p>
                <p>• All clips compete in 1v1 battles</p>
                <p>• Community votes determine winners</p>
                <p>• Top voted clip wins 25 points after expiry</p>
              </div>
            </div>

            <Button 
              variant="glow" 
              className="w-full" 
              onClick={handleCreateCategory}
              disabled={isSubmitting}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCategory;
