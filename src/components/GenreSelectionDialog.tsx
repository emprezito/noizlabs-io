import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AVAILABLE_GENRES = [
  'Hip Hop/Rap',
  'Electronic/EDM',
  'Rock',
  'Pop',
  'R&B/Soul',
  'Jazz',
  'Classical',
  'Country',
  'Metal',
  'Reggae',
  'Latin',
  'Blues',
  'Folk',
  'Indie',
  'Ambient',
  'Lo-fi',
  'Afrobeats',
  'Dancehall',
  'House',
  'Techno',
];

interface GenreSelectionDialogProps {
  walletAddress: string | null;
  open: boolean;
  onComplete: () => void;
}

export default function GenreSelectionDialog({ walletAddress, open, onComplete }: GenreSelectionDialogProps) {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTimezone, setUserTimezone] = useState<string>('');

  useEffect(() => {
    // Detect user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
  }, []);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = async () => {
    if (selectedGenres.length === 0) {
      toast({
        title: 'Select at least one genre',
        description: 'Please choose your preferred audio genres',
        variant: 'destructive',
      });
      return;
    }

    if (!walletAddress) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          personalization: true,
          preferred_genres: selectedGenres,
          timezone: userTimezone,
          timezone_set_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress);

      if (error) throw error;

      toast({
        title: 'Preferences saved!',
        description: 'Your audio preferences have been set',
      });

      onComplete();
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to NoizLabs!</DialogTitle>
          <DialogDescription>
            Choose your favorite audio genres to personalize your experience
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {AVAILABLE_GENRES.map((genre) => (
            <div key={genre} className="flex items-center space-x-2">
              <Checkbox
                id={genre}
                checked={selectedGenres.includes(genre)}
                onCheckedChange={() => toggleGenre(genre)}
              />
              <Label
                htmlFor={genre}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {genre}
              </Label>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedGenres.length === 0}
          className="w-full"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
