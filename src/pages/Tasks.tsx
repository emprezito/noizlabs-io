import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Check, Clock, Flame, Target, Users } from 'lucide-react';

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

const Tasks = () => {
  const { walletAddress, isConnected } = useSolanaWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [streakCount, setStreakCount] = useState(0);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [dailyQuest, setDailyQuest] = useState<DailyQuest>({ categories_created: 0, clips_uploaded: 0, votes_cast: 0 });
  const [referrals, setReferrals] = useState<Referral[]>([]);


  useEffect(() => {
    fetchTasks();
    if (isConnected && walletAddress) {
      fetchUserTasks();
      fetchStreakData();
      fetchDailyQuest();
      fetchReferrals();
    }
  }, [isConnected, walletAddress]);

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
    } finally {
      setLoading(false);
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

  const fetchStreakData = async () => {
    if (!walletAddress) return;

    try {
      // Get user's timezone
      const { data: profileData } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('wallet_address', walletAddress)
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

      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('*')
        .eq('user_wallet', walletAddress)
        .order('check_in_date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastCheckIn = data[0];
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
      // Get user's timezone
      const { data: profileData } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('wallet_address', walletAddress)
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
    if (!isConnected || !walletAddress || hasCheckedInToday) return;

    try {
      // Get user's timezone
      const { data: profileData } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('wallet_address', walletAddress)
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
      
      // Get last check-in
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

      // Insert new check-in
      const { error } = await supabase
        .from('daily_check_ins')
        .insert({
          user_wallet: walletAddress,
          check_in_date: today,
          streak_count: newStreak,
        });

      if (error) throw error;

      // Award 100 points if reached 7-day streak
      if (newStreak === 7) {
        await supabase.rpc('add_user_points', {
          wallet: walletAddress,
          points_to_add: 100,
        });

        toast({
          title: "🎉 7-Day Streak Complete!",
          description: "You earned 100 bonus points!",
        });
      } else {
        toast({
          title: "Check-in complete!",
          description: `Current streak: ${newStreak} days`,
        });
      }

      setStreakCount(newStreak);
      setHasCheckedInToday(true);
    } catch (error) {
      console.error('Error checking in:', error);
      toast({
        title: "Error",
        description: "Failed to check in",
        variant: "destructive",
      });
    }
  };

  const isTaskCompleted = (taskId: string) => {
    return userTasks.some(ut => ut.task_id === taskId && ut.verified);
  };

  const handleCompleteTask = async (task: Task) => {
    if (!isConnected || !walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to complete tasks",
        variant: "destructive",
      });
      return;
    }

    if (isTaskCompleted(task.id)) {
      toast({
        title: "Already completed",
        description: "You've already completed this task",
      });
      return;
    }

    try {
      // For social tasks, open the link and mark as pending verification
      if (task.task_type === 'social' && task.external_link) {
        window.open(task.external_link, '_blank');
        
        // Insert task completion (pending verification)
        const { error } = await supabase
          .from('user_tasks')
          .insert({
            user_wallet: walletAddress,
            task_id: task.id,
            verified: true, // Auto-verify for now
          });

        if (error) throw error;

        // Award points
        const { error: pointsError } = await supabase.rpc('add_user_points', {
          wallet: walletAddress,
          points_to_add: task.points_reward,
        });

        if (pointsError) throw pointsError;

        toast({
          title: "Task completed!",
          description: `You earned ${task.points_reward} points!`,
        });

        fetchUserTasks();
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 md:pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient mb-4">
              Complete Tasks & Earn Points
            </h1>
            <p className="text-muted-foreground text-lg">
              Complete social tasks and refer friends to earn rewards
            </p>
          </div>

          {!isConnected && (
            <Card className="glass-strong p-6 mb-8 border-primary/20">
              <p className="text-center text-muted-foreground">
                Connect your wallet to start completing tasks and earning points
              </p>
            </Card>
          )}

          {isConnected && (
            <>
              {/* Daily Streak Check-in */}
              <Card className="glass-strong p-6 mb-8 border-primary/20">
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
              <Card className="glass-strong p-6 mb-8 border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold">Daily Quests</h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  Complete daily activities to earn points. Resets at midnight.
                </p>
                
                <div className="space-y-4">
                  {/* Create Category Quest */}
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

                  {/* Upload 5 Clips Quest */}
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

                  {/* Vote 20 Times Quest */}
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
              <Card className="glass-strong p-6 mb-8 border-primary/20">
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
            </>
          )}

          {isConnected && (
            <Card className="glass-strong p-6 mb-8 border-primary/20">
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
                      toast({
                        title: "Error",
                        description: "Please enter a referral code",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      // Check if user has already used a referral code
                      const { data: profileData } = await supabase
                        .from('profiles')
                        .select('referred_by')
                        .eq('wallet_address', walletAddress)
                        .single();

                      if (profileData?.referred_by) {
                        toast({
                          title: "Already used",
                          description: "You've already used a referral code",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Find the referrer by code
                      const { data: referrerData } = await supabase
                        .from('profiles')
                        .select('wallet_address, username, referral_count, referred_users')
                        .ilike('referral_code', referralCode)
                        .single();

                      if (!referrerData) {
                        toast({
                          title: "Invalid code",
                          description: "Referral code not found",
                          variant: "destructive",
                        });
                        return;
                      }

                      if (referrerData.wallet_address === walletAddress) {
                        toast({
                          title: "Invalid code",
                          description: "You can't use your own referral code",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Update user profile with referred_by (no points yet - must create category first)
                      const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ referred_by: referrerData.wallet_address })
                        .eq('wallet_address', walletAddress);

                      if (updateError) throw updateError;

                      toast({
                        title: "Referral code saved!",
                        description: "Create your first category to earn 100 points for you and your referrer!",
                      });

                      setReferralCode('');
                      fetchUserTasks();
                    } catch (error) {
                      console.error('Error redeeming referral code:', error);
                      toast({
                        title: "Error",
                        description: "Failed to redeem referral code",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="gap-2"
                >
                  Redeem
                </Button>
              </div>
            </Card>
          )}

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
                        disabled={!isConnected || isReferral}
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
                        Share your referral link from your profile page. When referred users connect their wallet and create a category, you'll automatically earn points!
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
