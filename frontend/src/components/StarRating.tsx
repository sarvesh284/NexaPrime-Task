'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number; // 0 to 5
  totalStars?: number;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  value,
  totalStars = 5,
  interactive = false,
  size = 'md',
  onChange,
  showValue = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className="inline-flex items-center gap-1.5" role={interactive ? 'radiogroup' : 'img'}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: totalStars }, (_, index) => {
          const starNumber = index + 1;
          const isFilled = starNumber <= activeValue;
          const isPartiallyFilled = !isFilled && starNumber - 0.5 <= activeValue;

          return (
            <button
              key={starNumber}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starNumber)}
              onMouseEnter={() => interactive && setHoverValue(starNumber)}
              onMouseLeave={() => interactive && setHoverValue(null)}
              className={`${
                interactive
                  ? 'cursor-pointer transition-transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded'
                  : 'cursor-default'
              } p-0.5`}
              aria-label={`${starNumber} out of ${totalStars} stars`}
            >
              <Star
                className={`${sizeClasses[size]} transition-colors duration-150 ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isPartiallyFilled
                    ? 'text-amber-400 fill-amber-400/50'
                    : 'text-zinc-600 fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-semibold text-zinc-300 ml-1">
          {value > 0 ? value.toFixed(1) : 'No ratings'}
        </span>
      )}
    </div>
  );
};
