import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface LeaderboardEntry {
  wallet_address: string;
  username: string;
  points: number;
  rank: number;
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const fetchLeaderboard = async () => {
    try {
      // Get all user points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('wallet_address, points')
        .order('points', { ascending: false });

      if (pointsError) throw pointsError;

      // Get profiles for usernames
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('wallet_address, username');

      if (profilesError) throw profilesError;

      // Merge data and add ranks
      const leaderboardData: LeaderboardEntry[] = (pointsData || []).map((entry, index) => {
        const profile = profilesData?.find(p => p.wallet_address === entry.wallet_address);
        return {
          wallet_address: entry.wallet_address,
          username: profile?.username || `${entry.wallet_address.slice(0, 4)}...${entry.wallet_address.slice(-4)}`,
          points: entry.points,
          rank: index + 1,
        };
      });

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to real-time updates
    const pointsChannel = supabase
      .channel('leaderboard-points')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_points' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('leaderboard-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pointsChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 text-gradient">Leaderboard</h2>
        <p className="text-muted-foreground">Top performers on the platform</p>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry) => (
          <Card 
            key={entry.wallet_address} 
            className={`glass-strong border-border transition-all hover:border-primary ${
              entry.rank <= 3 ? 'glow-primary' : ''
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <div className="flex-1">
                    <Link 
                      to={`/profile/${entry.username}`}
                      className="font-semibold text-lg hover:text-primary transition-colors"
                    >
                      @{entry.username}
                    </Link>
                    <p className="text-xs text-muted-foreground font-mono">
                      {entry.wallet_address.slice(0, 8)}...{entry.wallet_address.slice(-8)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{entry.points}</div>
                  <div className="text-xs text-muted-foreground">points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {leaderboard.length === 0 && (
          <Card className="glass-strong border-border">
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-muted-foreground">No users yet. Be the first to earn points!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
