import { useState } from 'react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useArena } from '@/contexts/ArenaContext';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { supabase } from '@/integrations/supabase/client';

const CreateCategory = () => {
  const navigate = useNavigate();
  const { categories, refreshData, fetchUserPoints } = useArena();
  const { walletAddress, isConnected } = useSolanaWallet();
  const { setVisible } = useWalletModal();
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        });

      if (error) throw error;

      // Mark daily quest: created a category today
      const today = new Date().toISOString().slice(0, 10);
      
      const { data: questData } = await supabase
        .from('daily_quests')
        .select('rewarded_category')
        .eq('user_wallet', walletAddress)
        .eq('date', today)
        .maybeSingle();

      await supabase
        .from('daily_quests')
        .upsert({ user_wallet: walletAddress, date: today, created_category: true }, { onConflict: 'user_wallet,date' });

      // Award 10 points for daily quest if not already rewarded
      if (!questData?.rewarded_category) {
        await supabase.rpc('add_user_points', {
          wallet: walletAddress,
          points_to_add: 10,
        });

        await supabase
          .from('daily_quests')
          .update({ rewarded_category: true })
          .eq('user_wallet', walletAddress)
          .eq('date', today);
      }

      // Award 50 points
      await supabase.rpc('add_user_points', { wallet: walletAddress, points_to_add: 50 });

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
                <CardDescription>Define a new audio clip category (24hr duration)</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-primary text-primary w-fit">
              <Sparkles className="w-3 h-3 mr-1" />
              Earns 50 Points
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Name</label>
              <Input
                placeholder="e.g., Movie Quotes, Audio Memes, Voiceovers..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                placeholder="Describe what kind of audio clips belong in this category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="glass rounded-lg p-4">
              <h4 className="font-semibold mb-3">Category Rules</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Category lasts for 24 hours</p>
                <p>• Maximum 10 audio entries per category</p>
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
