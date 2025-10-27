import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useArena } from '@/contexts/ArenaContext';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const TopFiveTokens = () => {
  const { audioClips } = useArena();
  const topFive = [...audioClips]
    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    .slice(0, 5);

  if (!topFive.length) return null;

  return (
    <div className="space-y-4">
      {topFive.map((clip, idx) => (
        <Card key={clip.id} className="glass p-4 border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline">#{idx + 1}</Badge>
            <div>
              <div className="font-semibold">{clip.title}</div>
              {clip.creatorUsername && (
                <div className="text-sm text-muted-foreground">by {clip.creatorUsername}</div>
              )}
              <div className="text-sm text-primary">Votes: {clip.votes}</div>
            </div>
          </div>
          <Button onClick={() => toast.message('Coming Soon', { description: 'Trading coming soon' })}>
            Trade Now
          </Button>
        </Card>
      ))}
    </div>
  );
}

export default TopFiveTokens;
