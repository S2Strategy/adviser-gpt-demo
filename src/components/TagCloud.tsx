import { Badge } from "@/components/ui/badge";
import { QuestionCardData } from "./QuestionCard";

interface TagCloudProps {
  contentItems: QuestionCardData[];
  onTagClick: (tag: string) => void;
  selectedTags?: string[];
  className?: string;
}

export function TagCloud({ contentItems, onTagClick, selectedTags = [], className }: TagCloudProps) {
  // Calculate tag frequencies
  const tagFrequency = contentItems.reduce<Record<string, number>>((acc, item) => {
    item.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  // Sort tags by frequency and then alphabetically
  const sortedTags = Object.entries(tagFrequency)
    .sort(([a, countA], [b, countB]) => {
      if (countA !== countB) return countB - countA; // Higher frequency first
      return a.localeCompare(b); // Alphabetical for same frequency
    })
    .slice(0, 20); // Limit to top 20 tags

  if (sortedTags.length === 0) {
    return (
      <div className={`text-center py-4 ${className}`}>
        <p className="text-sm text-muted-foreground">No tags available</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap gap-2">
        {sortedTags.map(([tag, count]) => {
          const isSelected = selectedTags.includes(tag);
          const size = count >= 5 ? 'default' : count >= 3 ? 'sm' : 'xs';
          
          return (
            <Badge
              key={tag}
              variant={isSelected ? 'default' : 'outline'}
              className={`cursor-pointer transition-all hover:scale-105 ${
                size === 'default' ? 'text-sm px-3 py-1' :
                size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-1.5 py-0.5'
              } ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
              onClick={() => onTagClick(tag)}
            >
              {tag} ({count})
            </Badge>
          );
        })}
      </div>
      
      <div className="text-xs text-muted-foreground">
        Showing top {sortedTags.length} tags • Click to filter
      </div>
    </div>
  );
}