import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Copy, Trophy, User, ArrowLeft, ExternalLink, Check, Clock } from 'lucide-react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useWalletAuth } from '@/hooks/useWalletAuth';

interface Task {
  id: string;
  name: string;
  description: string;
  points_reward: number;
  task_type: string;
  external_link: string | null;
  max_completions: number;
}

interface UserTask {
  task_id: string;
  completed_at: string;
  verified: boolean;
}

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
  const { isAuthenticated } = useWalletAuth();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') === 'tasks') ? 'tasks' : 'profile';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [dailyQuest, setDailyQuest] = useState<{ 
    checkin_done: boolean; 
    created_category: boolean; 
    votes_count: number;
    streak_count: number;
    rewarded_checkin: boolean;
    rewarded_category: boolean;
    rewarded_votes: boolean;
  }>({ 
    checkin_done: false, 
    created_category: false, 
    votes_count: 0, 
    streak_count: 0,
    rewarded_checkin: false,
    rewarded_category: false,
    rewarded_votes: false,
  });
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    fetchProfile();
    if (walletAddress) {
      fetchTasks();
      fetchUserTasks();
      fetchDailyQuest();
    }
  }, [username, walletAddress]);

  // Set up real-time subscriptions for task updates
  useEffect(() => {
    if (!walletAddress) return;

    const today = new Date().toISOString().slice(0, 10);

    // Subscribe to daily_quests changes
    const dailyQuestChannel = supabase
      .channel('daily-quests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_quests',
          filter: `user_wallet=eq.${walletAddress}`
        },
        () => {
          fetchDailyQuest();
          fetchProfile();
        }
      )
      .subscribe();

    // Subscribe to user_tasks changes
    const userTasksChannel = supabase
      .channel('user-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_tasks',
          filter: `user_wallet=eq.${walletAddress}`
        },
        () => {
          fetchUserTasks();
          fetchProfile();
        }
      )
      .subscribe();

    // Subscribe to user_points changes
    const pointsChannel = supabase
      .channel('user-points-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `wallet_address=eq.${walletAddress}`
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dailyQuestChannel);
      supabase.removeChannel(userTasksChannel);
      supabase.removeChannel(pointsChannel);
    };
  }, [walletAddress]);

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

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUserTasks = async () => {
    if (!walletAddress) return;

    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('task_id, completed_at, verified')
        .eq('user_wallet', walletAddress);

      if (error) throw error;
      setUserTasks(data || []);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    }
  };

  const fetchDailyQuest = async () => {
    if (!walletAddress) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const { data } = await supabase
        .from('daily_quests')
        .select('checkin_done, created_category, votes_count, streak_count, rewarded_checkin, rewarded_category, rewarded_votes')
        .eq('user_wallet', walletAddress)
        .eq('date', today)
        .maybeSingle();
      setDailyQuest({
        checkin_done: data?.checkin_done || false,
        created_category: data?.created_category || false,
        votes_count: data?.votes_count || 0,
        streak_count: data?.streak_count || 0,
        rewarded_checkin: data?.rewarded_checkin || false,
        rewarded_category: data?.rewarded_category || false,
        rewarded_votes: data?.rewarded_votes || false,
      });
    } catch (e) {
      console.error('Error fetching daily quest:', e);
    }
  };

  // Update countdown timer every second
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDailyCheckin = async () => {
    if (!walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in with your wallet first');
      return;
    }
    
    try {
      // Check if already checked in today (client-side check for UX)
      if (dailyQuest.checkin_done) {
        toast.error('You already checked in today!');
        return;
      }
      
      // Call secure edge function that uses SERVER-SIDE date
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        toast.error('Please sign in again');
        return;
      }

      const { data, error } = await supabase.functions.invoke('daily-checkin', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });
      
      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      if (data.isStreakComplete) {
        toast.success(`🎉 7-day streak complete! +${data.points} points total!`);
      } else {
        toast.success(`Checked in! +${data.points} points. Streak: ${data.streak} days 🔥`);
      }
      
      await fetchDailyQuest();
      await fetchProfile();
    } catch (e: any) {
      console.error('Error checking in:', e);
      toast.error(e.message || 'Failed to check in');
    }
  };

  const isTaskCompleted = (taskId: string) => {
    return userTasks.some(ut => ut.task_id === taskId && ut.verified);
  };

  const handleCompleteTask = async (task: Task) => {
    if (!walletAddress) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please sign in with your wallet first');
      return;
    }

    if (isTaskCompleted(task.id)) {
      toast.error("You've already completed this task");
      return;
    }

    try {
      if (task.task_type === 'social' && task.external_link) {
        window.open(task.external_link, '_blank');
        
        const { error: insertError } = await supabase
          .from('user_tasks')
          .insert({
            user_wallet: walletAddress,
            task_id: task.id,
            verified: true,
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }

        const { error: pointsError } = await supabase.rpc('add_user_points', {
          wallet: walletAddress,
          points_to_add: task.points_reward,
        });

        if (pointsError) {
          console.error('Points error:', pointsError);
          throw pointsError;
        }

        toast.success(`You earned ${task.points_reward} points!`);
        await fetchUserTasks();
        await fetchProfile();
      }
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast.error(error.message || "Failed to complete task");
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
    <div className="min-h-screen bg-background pt-24 pb-24 md:pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/arena')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Arena
        </Button>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isOwnProfile && (
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="tasks" className="relative">Tasks {(!dailyQuest.checkin_done || !dailyQuest.created_category || dailyQuest.votes_count < 20) && (
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" aria-label="tasks pending"></span>
              )}</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="profile">
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
          </TabsContent>

           {isOwnProfile && (
            <TabsContent value="tasks">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Daily Quests */}
                <Card className="glass-strong p-6 border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Daily Quests</h3>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Resets in</p>
                      <p className="text-sm font-mono text-primary">{timeUntilReset}</p>
                    </div>
                  </div>
                  
                  {dailyQuest.checkin_done && (
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">🔥 Daily Streak: {dailyQuest.streak_count}/7 days</p>
                        <p className="text-xs text-muted-foreground">
                          {dailyQuest.streak_count >= 7 ? '100 pts earned!' : `${100 - (dailyQuest.streak_count * 14)} pts remaining`}
                        </p>
                      </div>
                      <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-500"
                          style={{ width: `${Math.min((dailyQuest.streak_count / 7) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Daily Check-in</p>
                        <p className="text-sm text-muted-foreground">Check in every day to build your streak</p>
                        <p className="text-sm text-primary font-semibold mt-1">+10 points</p>
                      </div>
                      {dailyQuest.checkin_done ? (
                        <Badge variant="secondary" className="gap-1"><Check className="w-4 h-4" /> Done</Badge>
                      ) : (
                        <Button size="sm" onClick={handleDailyCheckin}>Check-in</Button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Create a Category</p>
                        <p className="text-sm text-muted-foreground">Create at least one category today</p>
                        <p className="text-sm text-primary font-semibold mt-1">+10 points</p>
                      </div>
                      {dailyQuest.created_category ? (
                        <Badge variant="secondary" className="gap-1"><Check className="w-4 h-4" /> Done</Badge>
                      ) : (
                        <Button size="sm" onClick={() => navigate('/create-category')}>Create</Button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Vote on 20 Audio Clips</p>
                        <p className="text-sm text-muted-foreground">Progress: {dailyQuest.votes_count}/20</p>
                        <p className="text-sm text-primary font-semibold mt-1">+5 points</p>
                      </div>
                      {dailyQuest.votes_count >= 20 ? (
                        <Badge variant="secondary" className="gap-1"><Check className="w-4 h-4" /> Done</Badge>
                      ) : (
                        <Button size="sm" onClick={() => navigate('/arena')}>Go Vote</Button>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Social Tasks */}
                <Card className="glass-strong p-6 border-primary/20">
                  <h3 className="text-xl font-bold mb-4">Tasks</h3>
                  <div className="space-y-4">
                    {tasks.filter(task => task.task_type === 'social').map((task) => {
                      const completed = isTaskCompleted(task.id);
                      
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-4 bg-background/50 rounded-lg border transition-all ${
                            completed
                              ? 'border-primary/50'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{task.name}</p>
                            <p className="text-sm text-muted-foreground">{task.description}</p>
                            <p className="text-sm text-primary font-semibold mt-1">+{task.points_reward} points</p>
                          </div>
                          {completed ? (
                            <Badge variant="secondary" className="gap-1"><Check className="w-4 h-4" /> Done</Badge>
                          ) : (
                            <Button size="sm" onClick={() => handleCompleteTask(task)} className="gap-2">
                              Complete
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="glass-strong p-6 border-primary/20">
                  <h3 className="text-xl font-bold mb-4">Redeem Referral Code</h3>
                  <p className="text-muted-foreground mb-4">
                    Enter a referral code, then create your first category to earn 100 points for you and your referrer!
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="Enter referral code"
                      className="flex-1 px-4 py-2 rounded-lg glass border border-border focus:border-primary focus:outline-none"
                      maxLength={8}
                    />
                    <Button 
                      onClick={async () => {
                        if (!referralCode.trim()) {
                          toast.error("Please enter a referral code");
                          return;
                        }

                        try {
                          const { data: profileData } = await supabase
                            .from('profiles')
                            .select('referred_by')
                            .eq('wallet_address', walletAddress)
                            .single();

                          if (profileData?.referred_by) {
                            toast.error("You've already used a referral code");
                            return;
                          }

                          const { data: referrerData } = await supabase
                            .from('profiles')
                            .select('wallet_address, username, referral_count, referred_users')
                            .ilike('referral_code', referralCode)
                            .single();

                          if (!referrerData) {
                            toast.error("Referral code not found");
                            return;
                          }

                          if (referrerData.wallet_address === walletAddress) {
                            toast.error("You can't use your own referral code");
                            return;
                          }

                          // Update user profile with referred_by (no points yet - must create category first)
                          const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ referred_by: referrerData.wallet_address })
                            .eq('wallet_address', walletAddress);

                          if (updateError) throw updateError;

                          toast.success("Referral code saved! Create your first category to earn 100 points for you and your referrer!");
                          setReferralCode('');
                          fetchUserTasks();
                        } catch (error) {
                          console.error('Error redeeming referral code:', error);
                          toast.error("Failed to redeem referral code");
                        }
                      }}
                    >
                      Redeem
                    </Button>
                  </div>
                </Card>

                {/* Referral Task */}
                {tasks.filter(task => task.task_type === 'referral').map((task) => {
                  const completed = isTaskCompleted(task.id);
                  
                  return (
                    <Card
                      key={task.id}
                      className={`glass p-6 border transition-all ${
                        completed
                          ? 'border-primary/50 glow-primary'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold">{task.name}</h3>
                            {completed && (
                              <div className="flex items-center gap-1 text-primary text-sm">
                                <Check className="w-4 h-4" />
                                <span>Completed</span>
                              </div>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-4">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-primary font-bold text-lg">
                              +{task.points_reward} points
                            </span>
                            <span className="text-sm text-muted-foreground">
                              (per referral)
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleCompleteTask(task)}
                          disabled={true}
                          className="gap-2"
                          variant="outline"
                        >
                          <Clock className="w-4 h-4" />
                          Auto-tracked
                        </Button>
                      </div>

                      <div className="mt-4 p-4 bg-background/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Share your referral code: <strong>{profile.referral_code}</strong>. When referred users redeem your code after creating a category, you'll both earn 100 points!
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}