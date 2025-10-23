import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Copy, Trophy, User, ArrowLeft } from 'lucide-react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';

interface ProfileData {
  username: string;
  referral_code: string;
  wallet_address: string;
  points: number;
  created_at: string;
}

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { walletAddress } = useSolanaWallet();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;

      // Fetch points
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('wallet_address', profileData.wallet_address)
        .maybeSingle();

      setProfile({
        ...profileData,
        points: pointsData?.points || 0
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Profile not found');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferral = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success('Referral code copied!');
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || !walletAddress) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.trim() })
        .eq('wallet_address', walletAddress);

      if (error) throw error;

      toast.success('Username updated!');
      navigate(`/profile/${newUsername.trim()}`);
      setIsEditing(false);
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Username already taken');
      } else {
        toast.error('Failed to update username');
      }
    }
  };

  const isOwnProfile = profile?.wallet_address === walletAddress;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">Profile not found</p>
            <Button onClick={() => navigate('/arena')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Arena
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/arena')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Arena
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Input
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="New username"
                        className="max-w-[200px]"
                      />
                      <Button size="sm" onClick={handleUpdateUsername}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <CardTitle className="text-3xl">@{profile.username}</CardTitle>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile.wallet_address.slice(0, 4)}...{profile.wallet_address.slice(-4)}
                  </p>
                </div>
              </div>
              {isOwnProfile && !isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Username
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Points</p>
                      <p className="text-2xl font-bold">{profile.points}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Referral Code</p>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {profile.referral_code}
                      </Badge>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyReferral}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Member since {new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}