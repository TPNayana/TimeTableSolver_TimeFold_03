import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConflictBannerProps {
  conflictCount: number;
  onReview: () => void;
  onDismiss: () => void;
}

export function ConflictBanner({ conflictCount, onReview, onDismiss }: ConflictBannerProps) {
  if (conflictCount === 0) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-3 flex items-center justify-between gap-4"
      data-testid="banner-conflict"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5" />
        <div>
          <span className="font-medium">
            {conflictCount} conflict{conflictCount !== 1 ? 's' : ''} detected
          </span>
          <span className="ml-2 text-sm opacity-90">
            Some classes have scheduling conflicts
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onReview}
          className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90"
          data-testid="button-review-conflicts"
        >
          Review Conflicts
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          className="h-8 w-8 text-destructive-foreground hover:bg-destructive-foreground/20"
          data-testid="button-dismiss-banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
