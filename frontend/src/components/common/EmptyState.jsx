import Button from './Button';
import { CalendarSearch } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = CalendarSearch,
  title = 'No items found',
  description = 'There are no records matching your current filter criteria.',
  action,
  actionText,
  onAction,
  actionIcon,
  secondaryActionText,
  onSecondaryAction,
  className = '',
  children
}) => {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl ${className}`}
    >
      <div
        className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 shadow-inner"
        aria-hidden="true"
      >
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {(action || actionText || secondaryActionText || children) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {action}
          {actionText && (
            <Button
              onClick={onAction}
              variant="primary"
              size="md"
              leftIcon={actionIcon}
            >
              {actionText}
            </Button>
          )}

          {secondaryActionText && (
            <Button
              onClick={onSecondaryAction}
              variant="outline"
              size="md"
            >
              {secondaryActionText}
            </Button>
          )}
          {children}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
