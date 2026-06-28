'use client';

import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

/** Small circular "x" overlay used by every repeatable-content section
 * (Card Grid, Featured Gallery, Gallery) to remove one item/image in edit
 * mode. Only visible on hover of an ancestor with className="group". */
export default function RemoveIconButton({
  onClick,
  size = 20,
  iconSize = 14,
  top = 8,
  right = 8,
  ariaLabel = 'Remove',
}: {
  onClick: () => void;
  size?: number;
  iconSize?: number;
  top?: number;
  right?: number;
  ariaLabel?: string;
}) {
  return (
    <IconButton
      size="small"
      onClick={onClick}
      aria-label={ariaLabel}
      sx={{
        position: 'absolute',
        top,
        right,
        zIndex: 1,
        bgcolor: 'error.main',
        color: 'white',
        width: size,
        height: size,
        opacity: 0,
        '.group:hover &': { opacity: 1 },
        '&:hover': { bgcolor: 'error.dark' },
      }}
    >
      <CloseIcon sx={{ fontSize: iconSize }} />
    </IconButton>
  );
}
