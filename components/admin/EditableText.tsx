'use client';

import { useAdmin } from '@/lib/admin-context';

interface EditableTextProps {
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  className?: string;
  /**
   * 'dark'  — text sits on a dark/coloured background (hero). Uses white border.
   * 'light' — text sits on a white or cream background. Uses accent-coloured border.
   * Defaults to 'light'.
   */
  variant?: 'dark' | 'light';
}

export default function EditableText({
  value,
  onChange,
  multiline = false,
  className = '',
  variant = 'light',
}: EditableTextProps) {
  const { editMode } = useAdmin();

  if (!editMode) {
    return <span className={className}>{value}</span>;
  }

  // Border + focus ring differ by surface so the affordance is always visible
  const borderClass =
    variant === 'dark'
      ? 'border-white/60 focus:border-white placeholder-white/40'
      : 'border-b-[var(--theme-primary)] focus:border-[var(--theme-accent)] placeholder-gray-400';

  const base = [
    'bg-transparent',
    'border-b-2 border-dashed',
    'outline-none',
    'w-full',
    'resize-none',
    'transition-colors duration-150',
    'rounded-none', // keep the inline feel
    borderClass,
    className,
  ].join(' ');

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={base}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={base}
    />
  );
}
