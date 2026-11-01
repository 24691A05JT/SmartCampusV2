import { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export const Select = forwardRef(
  (
    {
      label,
      id,
      name,
      value,
      onChange,
      options = [],
      placeholder = 'Select an option',
      error,
      helperText,
      disabled = false,
      required = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const selectId = id || name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={`w-full px-4 py-2.5 pr-10 bg-slate-900/90 text-slate-100 text-sm rounded-xl border appearance-none transition-all duration-200 outline-none cursor-pointer ${
              error
                ? 'border-rose-500/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-800 hover:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''} ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-slate-900 text-slate-400">
                {placeholder}
              </option>
            )}
            {options.length > 0
              ? options.map((opt) => {
                  const val = typeof opt === 'object' ? opt.value : opt;
                  const labelText = typeof opt === 'object' ? opt.label : opt;
                  return (
                    <option key={val} value={val} className="bg-slate-900 text-slate-100 py-1">
                      {labelText}
                    </option>
                  );
                })
              : children}
          </select>

          <span className="absolute right-3.5 text-slate-400 pointer-events-none">
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>

        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-rose-400 font-medium mt-0.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : (
          helperText && <p className="text-xs text-slate-400 mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
