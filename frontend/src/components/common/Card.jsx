import React from 'react';

export const Card = ({ children, className = '', title, subtitle, action, footer }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-card transition-all duration-200 hover:shadow-hover ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && <h3 className="font-semibold text-slate-800 text-lg tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-slate-50/60 rounded-b-2xl border-t border-slate-100 text-xs text-slate-500">
          {footer}
        </div>
      )}
    </div>
  );
};
