interface BadgeProps {
  variant?: 'success' | 'warning' | 'info' | 'default' | 'danger';
  children: React.ReactNode;
}

const variants: Record<string, { bg: string; color: string }> = {
  success: { bg: 'rgba(52,199,89,0.12)',  color: 'var(--apple-green)' },
  warning: { bg: 'rgba(255,149,0,0.12)',  color: 'var(--apple-orange)' },
  info:    { bg: 'rgba(0,113,227,0.10)',  color: 'var(--apple-blue)' },
  danger:  { bg: 'rgba(255,59,48,0.10)',  color: 'var(--apple-red)' },
  default: { bg: 'var(--apple-bg-2)',     color: 'var(--apple-text-2)' },
};

export function Badge({ variant = 'default', children }: BadgeProps) {
  const v = variants[variant] ?? variants.default;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold"
      style={{ background: v.bg, color: v.color }}
    >
      {children}
    </span>
  );
}
