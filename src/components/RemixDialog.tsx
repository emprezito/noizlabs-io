import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Music, Sparkles } from 'lucide-react';

interface RemixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioUrl: string;
  clipTitle: string;
}

const remixOptions = [
  {
    id: 'pitch-shift',
    name: 'Pitch Shift',
    description: 'Change the pitch while keeping tempo',
    icon: '🎵',
  },
  {
    id: 'tempo-change',
    name: 'Tempo Change',
    description: 'Speed up or slow down the audio',
    icon: '⚡',
  },
  {
    id: 'reverb-effect',
    name: 'Add Reverb',
    description: 'Create spatial depth and ambiance',
    icon: '🌊',
  },
  {
    id: 'bass-boost',
    name: 'Bass Boost',
    description: 'Enhance low-frequency content',
    icon: '🔊',
  },
  {
    id: 'distortion',
    name: 'Distortion',
    description: 'Add edge and aggression',
    icon: '⚡',
  },
  {
    id: 'style-transfer',
    name: 'Style Transfer',
    description: 'Transform into different genre',
    icon: '✨',
  },
];

export const RemixDialog = ({ open, onOpenChange, audioUrl, clipTitle }: RemixDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedRemix, setSelectedRemix] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRemix = async (remixType: string) => {
    setLoading(true);
    setSelectedRemix(remixType);

    try {
      const { data, error } = await supabase.functions.invoke('remix-audio', {
        body: { audioUrl, remixType },
      });

      if (error) throw error;

      toast({
        title: 'Remix Analysis Complete! 🎧',
        description: data.message,
      });

      console.log('Remix description:', data.description);
    } catch (error) {
      console.error('Error remixing audio:', error);
      toast({
        title: 'Remix Error',
        description: error instanceof Error ? error.message : 'Failed to remix audio',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setSelectedRemix(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-2xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Remix Options
          </DialogTitle>
          <DialogDescription>
            Select a remix style for "{clipTitle}". AI will transform your audio to help avoid
            copyright issues while maintaining the vibe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {remixOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:border-primary hover:glow-primary transition-all"
              onClick={() => handleRemix(option.id)}
              disabled={loading}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-2xl">{option.icon}</span>
                <span className="font-bold">{option.name}</span>
                {loading && selectedRemix === option.id && (
                  <Loader2 className="w-4 h-4 ml-auto animate-spin" />
                )}
              </div>
              <p className="text-xs text-muted-foreground text-left">{option.description}</p>
            </Button>
          ))}
        </div>

        <div className="mt-4 p-4 bg-background/50 rounded-lg border border-primary/20">
          <div className="flex items-start gap-2">
            <Music className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">About AI Remixing</p>
              <p className="text-muted-foreground">
                Our AI analyzes your audio and applies creative transformations to help you create
                unique versions that are less likely to trigger copyright detection while maintaining
                the essence of your sound.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
