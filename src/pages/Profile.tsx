import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, Copy, Trophy, User, ArrowLeft, ExternalLink, Check, Clock, Flame, Target, Users } from 'lucide-react';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';

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

interface DailyCheckIn {
  check_in_date: string;
  streak_count: number;
}

interface DailyQuest {
  categories_created: number;
  clips_uploaded: number;
  votes_cast: number;
}

interface Referral {
  username: string;
  wallet_address: string;
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
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [dailyQuest, setDailyQuest] = useState<DailyQuest>({ categories_created: 0, clips_uploaded: 0, votes_cast: 0 });
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    fetchProfile();
    if (isOwnProfile) {
      fetchTasks();
      fetchUserTasks();
      fetchStreakData();
      fetchDailyQuest();
      fetchReferrals();
    }
  }, [username, walletAddress]);

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

  const isTaskCompleted = (taskId: string) => {
    return userTasks.some(ut => ut.task_id === taskId && ut.verified);
  };

  const fetchStreakData = async () => {
    if (!walletAddress) return;

    try {
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('*')
        .eq('user_wallet', walletAddress)
        .order('check_in_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastCheckIn = data[0];
        const today = new Date().toISOString().split('T')[0];
        const lastCheckInDate = lastCheckIn.check_in_date;

        setStreakCount(lastCheckIn.streak_count);
        setHasCheckedInToday(lastCheckInDate === today);
      }
    } catch (error) {
      console.error('Error fetching streak data:', error);
    }
  };

  const fetchDailyQuest = async () => {
    if (!walletAddress) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_quests')
        .select('*')
        .eq('user_wallet', walletAddress)
        .eq('quest_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setDailyQuest({
          categories_created: data.categories_created,
          clips_uploaded: data.clips_uploaded,
          votes_cast: data.votes_cast,
        });
      }
    } catch (error) {
      console.error('Error fetching daily quest:', error);
    }
  };

  const fetchReferrals = async () => {
    if (!walletAddress) return;

    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('referred_users')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) throw error;

      if (profileData?.referred_users && profileData.referred_users.length > 0) {
        const { data: referredProfiles, error: refError } = await supabase
          .from('profiles')
          .select('username, wallet_address')
          .in('wallet_address', profileData.referred_users);

        if (refError) throw refError;
        setReferrals(referredProfiles || []);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!walletAddress || hasCheckedInToday) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: lastCheckIn } = await supabase
        .from('daily_check_ins')
        .select('*')
        .eq('user_wallet', walletAddress)
        .order('check_in_date', { ascending: false })
        .limit(1)
        .single();

      let newStreak = 1;
      if (lastCheckIn) {
        const lastDate = new Date(lastCheckIn.check_in_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak = lastCheckIn.streak_count + 1;
        }
      }

      const { error } = await supabase
        .from('daily_check_ins')
        .insert({
          user_wallet: walletAddress,
          check_in_date: today,
          streak_count: newStreak,
        });

      if (error) throw error;

      if (newStreak === 7) {
        await supabase.rpc('add_user_points', {
          wallet: walletAddress,
          points_to_add: 100,
        });

        toast.success("🎉 7-Day Streak Complete! You earned 100 bonus points!");
      } else {
        toast.success(`Check-in complete! Current streak: ${newStreak} days`);
      }

      setStreakCount(newStreak);
      setHasCheckedInToday(true);
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error("Failed to check in");
    }
  };

  const handleCompleteTask = async (task: Task) => {
    if (!walletAddress) return;

    if (isTaskCompleted(task.id)) {
      toast.error("You've already completed this task");
      return;
    }

    try {
      if (task.task_type === 'social' && task.external_link) {
        window.open(task.external_link, '_blank');
        
        const { error } = await supabase
          .from('user_tasks')
          .insert({
            user_wallet: walletAddress,
            task_id: task.id,
            verified: true,
          });

        if (error) throw error;

        const { error: pointsError } = await supabase.rpc('add_user_points', {
          wallet: walletAddress,
          points_to_add: task.points_reward,
        });

        if (pointsError) throw pointsError;

        toast.success(`You earned ${task.points_reward} points!`);
        fetchUserTasks();
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error("Failed to complete task");
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

        <Tabs defaultValue="profile" className="w-full">
          {isOwnProfile && (
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
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
                {/* Daily Streak Check-in */}
                <Card className="glass-strong p-6 border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Flame className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-bold">Daily Streak</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Check in daily to maintain your streak. Reach 7 days for 100 bonus points!
                  </p>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Progress to 7 days</span>
                      <span className="text-sm font-bold text-primary">{streakCount}/7 days</span>
                    </div>
                    <Progress value={(streakCount / 7) * 100} className="h-3" />
                  </div>
                  <Button 
                    onClick={handleCheckIn}
                    disabled={hasCheckedInToday}
                    className="w-full gap-2"
                  >
                    {hasCheckedInToday ? (
                      <>
                        <Check className="w-4 h-4" />
                        Checked in today
                      </>
                    ) : (
                      <>
                        <Flame className="w-4 h-4" />
                        Check in now
                      </>
                    )}
                  </Button>
                </Card>

                {/* Daily Quests */}
                <Card className="glass-strong p-6 border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-bold">Daily Quests</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Complete daily activities to earn points. Resets at midnight.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-background/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Create a Category</span>
                        <span className="text-primary font-bold">
                          {dailyQuest.categories_created >= 1 ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              +10 points
                            </span>
                          ) : (
                            '+10 points'
                          )}
                        </span>
                      </div>
                      <Progress value={dailyQuest.categories_created >= 1 ? 100 : 0} className="h-2" />
                    </div>

                    <div className="p-4 bg-background/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Upload 5 Audio Clips</span>
                        <span className="text-primary font-bold">
                          {dailyQuest.clips_uploaded >= 5 ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              +10 points
                            </span>
                          ) : (
                            '+10 points'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <Progress value={(dailyQuest.clips_uploaded / 5) * 100} className="h-2 flex-1 mr-2" />
                        <span className="text-xs text-muted-foreground">{dailyQuest.clips_uploaded}/5</span>
                      </div>
                    </div>

                    <div className="p-4 bg-background/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Vote on 20 Audio Clips</span>
                        <span className="text-primary font-bold">
                          {dailyQuest.votes_cast >= 20 ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              +10 points
                            </span>
                          ) : (
                            '+10 points'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <Progress value={(dailyQuest.votes_cast / 20) * 100} className="h-2 flex-1 mr-2" />
                        <span className="text-xs text-muted-foreground">{dailyQuest.votes_cast}/20</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Referral Stats */}
                <Card className="glass-strong p-6 border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-bold">Your Referrals</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {referrals.length} {referrals.length === 1 ? 'person has' : 'people have'} used your referral code
                  </p>
                  {referrals.length > 0 && (
                    <div className="space-y-2">
                      {referrals.map((referral, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                          <Check className="w-4 h-4 text-primary" />
                          <span className="font-medium">{referral.username}</span>
                        </div>
                      ))}
                    </div>
                  )}
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

                <div className="space-y-4">
                  {tasks.map((task) => {
                    const completed = isTaskCompleted(task.id);
                    const isReferral = task.task_type === 'referral';
                    
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
                              {isReferral && (
                                <span className="text-sm text-muted-foreground">
                                  (per referral)
                                </span>
                              )}
                            </div>
                          </div>

                          {!completed && (
                            <Button
                              onClick={() => handleCompleteTask(task)}
                              disabled={isReferral}
                              className="gap-2"
                              variant={isReferral ? "outline" : "default"}
                            >
                              {isReferral ? (
                                <>
                                  <Clock className="w-4 h-4" />
                                  Auto-tracked
                                </>
                              ) : (
                                <>
                                  Complete
                                  <ExternalLink className="w-4 h-4" />
                                </>
                              )}
                            </Button>
                          )}
                        </div>

                        {isReferral && (
                          <div className="mt-4 p-4 bg-background/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Share your referral code: <strong>{profile.referral_code}</strong>. When referred users redeem your code after creating a category, you'll both earn 100 points!
                            </p>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}