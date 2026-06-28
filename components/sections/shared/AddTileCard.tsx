'use client';

import Card from '@mui/material/Card';
import AddIcon from '@mui/icons-material/Add';
import type { SxProps, Theme } from '@mui/material/styles';

/** Dashed-bordered "+" tile used by every repeatable-content section
 * (Card Grid, Featured Gallery, Gallery) to add a new item/image while
 * in edit mode. Centralized here so the three section renderers share one
 * visual treatment instead of re-implementing it per type. */
export default function AddTileCard({
  onClick,
  sx,
  iconSize = 32,
  ariaLabel = 'Add item',
}: {
  onClick: () => void;
  sx?: SxProps<Theme>;
  iconSize?: number;
  ariaLabel?: string;
}) {
  return (
    <Card
      variant="outlined"
      onClick={onClick}
      role="button"
      aria-label={ariaLabel}
      sx={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: 'var(--theme-primary)',
        color: 'var(--theme-primary)',
        bgcolor: 'transparent',
        boxShadow: 'none',
        '&:hover': { opacity: 0.7 },
        ...sx,
      }}
    >
      <AddIcon sx={{ fontSize: iconSize }} />
    </Card>
  );
}
