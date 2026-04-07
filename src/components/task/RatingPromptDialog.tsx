import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Send } from 'lucide-react';
import { toast } from 'sonner';

interface RatingPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  bondhuName: string;
  onSubmit: (rating: number, review: string, feedback: string) => Promise<void>;
}

export default function RatingPromptDialog({
  open,
  onOpenChange,
  taskTitle,
  bondhuName,
  onSubmit,
}: RatingPromptDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!review.trim()) {
      toast.error('Please write a review');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(rating, review.trim(), feedback.trim());
      toast.success('Thank you for your feedback!');
      onOpenChange(false);
      
      // Reset form
      setRating(0);
      setReview('');
      setFeedback('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience with {bondhuName} for "{taskTitle}"?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Your Rating</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-12 w-12 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {rating === 5 && 'Excellent! ⭐'}
                {rating === 4 && 'Very Good! 👍'}
                {rating === 3 && 'Good 👌'}
                {rating === 2 && 'Fair 😐'}
                {rating === 1 && 'Poor 👎'}
              </p>
            )}
          </div>

          {/* Review */}
          <div className="space-y-2">
            <Label htmlFor="review" className="text-base font-semibold">
              Write a Review <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="review"
              placeholder="Share your experience with this Bondhu..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              {review.length}/500 characters
            </p>
          </div>

          {/* Additional Feedback */}
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-base font-semibold">
              Additional Feedback (Optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Any suggestions or additional comments..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={submitting}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || !review.trim()}
            className="w-full h-12 text-base"
          >
            {submitting ? (
              <span className="animate-pulse">Submitting...</span>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
