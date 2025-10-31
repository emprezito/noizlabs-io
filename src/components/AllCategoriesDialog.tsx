import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Clock, Search, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useArena } from '@/contexts/ArenaContext';
import { supabase } from '@/integrations/supabase/client';

interface AllCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AllCategoriesDialog = ({ open, onOpenChange }: AllCategoriesDialogProps) => {
  const navigate = useNavigate();
  const { categories, audioClips, getOrCreateProfile } = useArena();
  const { walletAddress, isConnected } = useSolanaWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const categoriesWithCount = categories.map(cat => ({
    ...cat,
    entriesCount: audioClips.filter(clip => clip.categoryId === cat.id).length,
  }));

  const filteredCategories = categoriesWithCount.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    const file = e.target.files?.[0];
    if (file) {
      const isAudio = file.type.startsWith('audio/') || 
                      /\.(mp3|wav|ogg|aac|m4a)$/i.test(file.name);
      
      if (isAudio) {
        setSelectedFile(file);
        setSelectedCategoryId(categoryId);
        toast.success('Audio file selected!');
      } else {
        toast.error('Please select a valid audio file');
      }
    }
  };

  const handleUpload = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedFile || !audioTitle || !selectedCategoryId) {
      toast.error('Please fill in all fields');
      return;
    }

    await getOrCreateProfile(walletAddress);

    // Check if user already uploaded to this category
    const userClipInCategory = audioClips.find(
      clip => clip.categoryId === selectedCategoryId && clip.creator === walletAddress
    );
    
    if (userClipInCategory) {
      toast.error('You can only upload 1 clip per category');
      return;
    }

    // Check if user is the creator of this category
    const category = categories.find(cat => cat.id === selectedCategoryId);
    if (category && category.creatorWallet === walletAddress) {
      toast.error("You can't upload to a category you created");
      return;
    }

    const categoryClipsCount = audioClips.filter(
      clip => clip.categoryId === selectedCategoryId
    ).length;
    
    if (categoryClipsCount >= 10) {
      toast.error('This category has reached maximum entries (10)');
      return;
    }

    setIsUploading(true);

    try {
      // Upload audio file
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-clips')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('audio-clips')
        .getPublicUrl(fileName);

      // Insert audio clip
      const { data: insertData, error } = await supabase
        .from('audio_clips')
        .insert({
          title: audioTitle,
          creator_wallet: walletAddress,
          category_id: selectedCategoryId,
          audio_url: publicUrl,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Award points via secure edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await supabase.functions.invoke('award-points', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { action: 'upload', data: { clipId: insertData.id } }
        });
      }

      toast.success('Audio uploaded! You earned 5 points! 🎉');
      setSelectedFile(null);
      setAudioTitle('');
      setSelectedCategoryId('');
      onOpenChange(false);
      window.location.reload(); // Refresh to show new clip
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast.error('Failed to upload audio clip');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            All Categories
          </DialogTitle>
          <DialogDescription>
            Browse all categories and upload your audio clips
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Upload Form (if file selected) */}
          {selectedFile && (
            <Card className="glass border-primary/50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Category: {categories.find(c => c.id === selectedCategoryId)?.name}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setAudioTitle('');
                      setSelectedCategoryId('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <Input
                  placeholder="Audio Title"
                  value={audioTitle}
                  onChange={(e) => setAudioTitle(e.target.value)}
                />
                <Button
                  variant="glow"
                  className="w-full"
                  onClick={handleUpload}
                  disabled={isUploading || !audioTitle}
                >
                  {isUploading ? 'Uploading...' : 'Upload & Earn 5 Points'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => (
                <Card key={category.id} className="glass border-border hover:border-primary transition-colors">
                  <CardContent className="pt-6 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg line-clamp-1">{category.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {category.entriesCount}/10 clips
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTimeRemaining(category.expiresAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        type="file"
                        accept="audio/*,.aac,.m4a"
                        onChange={(e) => handleFileSelect(e, category.id)}
                        className="hidden"
                        id={`upload-${category.id}`}
                        disabled={category.entriesCount >= 10}
                      />
                      <label htmlFor={`upload-${category.id}`}>
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={category.entriesCount >= 10}
                          asChild
                        >
                          <div className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            {category.entriesCount >= 10 ? 'Full' : 'Upload to Category'}
                          </div>
                        </Button>
                      </label>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                No categories found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
