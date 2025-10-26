import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Check, Clock } from 'lucide-react';

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

const Tasks = () => {
  const { walletAddress, isConnected } = useSolanaWallet();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');

  // Redirect to profile on mobile
  useEffect(() => {
    const checkMobileAndRedirect = async () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile && isConnected && walletAddress) {
        // Fetch username and redirect to profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('wallet_address', walletAddress)
          .single();
        
        if (profileData?.username) {
          navigate(`/profile/${profileData.username}`);
        }
      }
    };
    
    checkMobileAndRedirect();
  }, [isConnected, walletAddress, navigate]);

  useEffect(() => {
    fetchTasks();
    if (isConnected && walletAddress) {
      fetchUserTasks();
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
            <Card className="glass-strong p-6 mb-8 border-primary/20">
              <h3 className="text-xl font-bold mb-4">Redeem Referral Code</h3>
              <p className="text-muted-foreground mb-4">
                Enter a referral code to earn 100 points instantly! The referrer will also receive 100 points.
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

                      // Check if user has created at least 1 category (verified referral)
                      const { data: categoriesData } = await supabase
                        .from('categories')
                        .select('id')
                        .eq('creator_wallet', walletAddress)
                        .limit(1);

                      if (!categoriesData || categoriesData.length === 0) {
                        toast({
                          title: "Not verified",
                          description: "You must create at least 1 category to use a referral code",
                          variant: "destructive",
                        });
                        return;
                      }

                      // Update user profile with referred_by
                      const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ referred_by: referrerData.wallet_address })
                        .eq('wallet_address', walletAddress);

                      if (updateError) throw updateError;

                      // Award 100 points to both user and referrer
                      await supabase.rpc('add_user_points', {
                        wallet: walletAddress,
                        points_to_add: 100,
                      });

                      await supabase.rpc('add_user_points', {
                        wallet: referrerData.wallet_address,
                        points_to_add: 100,
                      });

                      // Update referrer's referral count and referred_users array
                      await supabase
                        .from('profiles')
                        .update({ 
                          referral_count: (referrerData.referral_count || 0) + 1,
                          referred_users: [...(referrerData.referred_users || []), walletAddress]
                        })
                        .eq('wallet_address', referrerData.wallet_address);

                      toast({
                        title: "Success!",
                        description: "You and your referrer both earned 100 points!",
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
