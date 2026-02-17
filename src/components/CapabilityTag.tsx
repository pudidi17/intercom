'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CapabilityCategory } from '@/lib/types';

interface CapabilityTagProps {
  name: string;
  proficiency?: number;
  certified?: boolean;
  category?: CapabilityCategory;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  selected?: boolean;
}

const categoryColors: Record<CapabilityCategory | 'default', string> = {
  analysis: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  generation: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
  communication: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  reasoning: 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30',
  action: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
  multimodal: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30',
  default: 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export function CapabilityTag({
  name,
  proficiency,
  certified,
  category,
  size = 'md',
  onClick,
  selected,
}: CapabilityTagProps) {
  const getProficiencyColor = (prof: number) => {
    if (prof >= 0.9) return 'bg-emerald-500';
    if (prof >= 0.7) return 'bg-green-500';
    if (prof >= 0.5) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium transition-all duration-200 cursor-pointer',
        categoryColors[category || 'default'],
        sizeClasses[size],
        selected && 'ring-2 ring-white/50',
        onClick && 'hover:scale-105'
      )}
      onClick={onClick}
    >
      <span className="flex items-center gap-1.5">
        {certified && (
          <svg
            className="w-3 h-3"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {name}
        {proficiency !== undefined && (
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              getProficiencyColor(proficiency)
            )}
            title={`Proficiency: ${Math.round(proficiency * 100)}%`}
          />
        )}
      </span>
    </Badge>
  );
}

interface CapabilityTagListProps {
  capabilities: Array<{
    name: string;
    proficiency?: number;
    certified?: boolean;
    category?: CapabilityCategory;
  }>;
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  onTagClick?: (name: string) => void;
  selectedTags?: string[];
}

export function CapabilityTagList({
  capabilities,
  maxDisplay = 5,
  size = 'md',
  onTagClick,
  selectedTags = [],
}: CapabilityTagListProps) {
  const displayCapabilities = capabilities.slice(0, maxDisplay);
  const remainingCount = capabilities.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displayCapabilities.map((cap) => (
        <CapabilityTag
          key={cap.name}
          name={cap.name}
          proficiency={cap.proficiency}
          certified={cap.certified}
          category={cap.category}
          size={size}
          onClick={() => onTagClick?.(cap.name)}
          selected={selectedTags.includes(cap.name)}
        />
      ))}
      {remainingCount > 0 && (
        <Badge
          variant="outline"
          className={cn(
            'bg-gray-500/10 text-gray-400 border-gray-500/20',
            sizeClasses[size]
          )}
        >
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
