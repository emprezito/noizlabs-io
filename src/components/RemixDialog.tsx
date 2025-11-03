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
      <DialogContent className="glass-strong max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto border-primary/20">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg md:text-2xl">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            AI Remix Options
          </DialogTitle>
          <DialogDescription className="text-xs md:text-sm">
            Select a remix style for "{clipTitle}". AI will analyze and describe the transformation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4 mt-2 md:mt-4">
          {remixOptions.map((option) => (
            <Button
              key={option.id}
              variant="outline"
              className="h-auto p-2 md:p-4 flex flex-col items-start gap-1 md:gap-2 hover:border-primary hover:glow-primary transition-all text-left"
              onClick={() => handleRemix(option.id)}
              disabled={loading}
            >
              <div className="flex items-center gap-1 md:gap-2 w-full">
                <span className="text-base md:text-2xl">{option.icon}</span>
                <span className="font-bold text-xs md:text-base">{option.name}</span>
                {loading && selectedRemix === option.id && (
                  <Loader2 className="w-3 h-3 md:w-4 md:h-4 ml-auto animate-spin" />
                )}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground">{option.description}</p>
            </Button>
          ))}
        </div>

        <div className="mt-2 md:mt-4 p-2 md:p-4 bg-background/50 rounded-lg border border-primary/20">
          <div className="flex items-start gap-2">
            <Music className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-xs md:text-sm">
              <p className="font-medium text-primary mb-1">About AI Remixing</p>
              <p className="text-muted-foreground text-[10px] md:text-xs">
                Our AI analyzes your audio and provides creative transformation suggestions to help you create
                unique versions while maintaining the essence of your sound.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
