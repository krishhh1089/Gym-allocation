import React from 'react';
import { Badge } from '@/components/ui';
import { LucideIcon } from 'lucide-react';

export interface MetricCardProps {
  code: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: LucideIcon;
  badgeStatus?: 'ACTIVE' | 'PENDING' | 'LATE' | 'ABSENT' | 'NEUTRAL' | 'PRESENT';
  badgeText?: string;
  accentColor?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  code,
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  badgeStatus,
  badgeText,
  accentColor = 'var(--ink)',
  className = '',
}) => {
  return (
    <div
      data-ui="admin-metric-card"
      className={`p-5 bg-white border-3 border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)] relative flex flex-col justify-between ${className}`}
      style={{ borderTopWidth: '5px', borderTopColor: accentColor }}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-dashed border-neutral-300">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-neutral-500">
            {code}
          </span>
          <div className="flex items-center gap-1.5">
            {badgeText && (
              <Badge status={badgeStatus || 'NEUTRAL'} className="font-mono text-[10px] py-0">
                {badgeText}
              </Badge>
            )}
            {Icon && <Icon size={16} className="text-neutral-500" />}
          </div>
        </div>

        {/* Title */}
        <h4 className="font-serif font-bold text-sm text-[var(--ink)] leading-snug">
          {title}
        </h4>

        {/* Primary Value */}
        <div className="font-mono text-3xl font-black text-[var(--ink)] tracking-tight my-2">
          {value}
        </div>
      </div>

      {/* Footer Details */}
      {(subtitle || trend) && (
        <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs font-mono text-neutral-600">
          <span>{subtitle}</span>
          {trend && (
            <span
              className={`font-bold ${
                trend.isPositive ? 'text-[var(--athletic-green)]' : 'text-[var(--oxblood)]'
              }`}
            >
              {trend.isPositive ? '▲' : '▼'} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
