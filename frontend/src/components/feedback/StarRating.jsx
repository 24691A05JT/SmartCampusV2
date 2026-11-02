import { useState } from 'react';
import { Star } from 'lucide-react';

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

const ratingLabels = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

export const StarRating = ({
  rating = 0,
  onChange,
  interactive = true,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const activeRating = interactive && hoverRating > 0 ? hoverRating : rating;

  const handleClick = (starValue) => {
    if (interactive && onChange) {
      onChange(starValue);
    }
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starValue) => {
          const isFilled = starValue <= activeRating;
          return (
            <button
              key={starValue}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`transition-all duration-150 ${
                interactive
                  ? 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50 rounded-md p-0.5'
                  : 'cursor-default'
              }`}
              aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
            >
              <Star
                className={`${sizeMap[size] || sizeMap.md} transition-colors ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                    : 'text-slate-600 fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && activeRating > 0 && (
        <span className="text-xs font-semibold text-amber-300 ml-1.5">
          {ratingLabels[activeRating] || `${activeRating} Stars`}
        </span>
      )}
    </div>
  );
};

export default StarRating;
