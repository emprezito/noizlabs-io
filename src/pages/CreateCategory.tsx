import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useArena } from '@/contexts/ArenaContext';

const CreateCategory = () => {
  const navigate = useNavigate();
  const { categories, addCategory, addPoints } = useArena();
  const [categoryName, setCategoryName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateCategory = () => {
    if (!categoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    // Check if category already exists
    if (categories.some(cat => cat.name.toLowerCase() === categoryName.toLowerCase())) {
      toast.error('Category already exists');
      return;
    }
    
    addCategory(categoryName);
    addPoints(50);
    
    toast.success('Category created! You earned 50 points! 🎉');
    setTimeout(() => navigate('/arena'), 1500);
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/arena')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Arena
        </Button>

        <Card className="glass-strong border-border glow-primary">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-primary/20">
                <FolderPlus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Create New Category</CardTitle>
                <CardDescription>Define a new audio clip category</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-primary text-primary w-fit">
              <Sparkles className="w-3 h-3 mr-1" />
              Earn 50 Points
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Name</label>
              <Input
                placeholder="e.g., Movie Quotes, Audio Memes, Voiceovers..."
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                placeholder="Describe what kind of audio clips belong in this category..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="glass rounded-lg p-4">
              <h4 className="font-semibold mb-3">Category Rules</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Maximum 10 audio entries per category</p>
                <p>• All clips compete in 1v1 battles</p>
                <p>• Community votes determine winners</p>
                <p>• You'll earn 50 points for creating this category</p>
              </div>
            </div>

            <Button 
              variant="glow" 
              className="w-full" 
              onClick={handleCreateCategory}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateCategory;
