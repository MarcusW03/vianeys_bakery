'use client';

import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useAdmin } from '@/lib/admin-context';
import type { SectionInstance } from '@/lib/config/types';
import { SECTION_REGISTRY, getInstanceLabel } from '@/lib/sections/registry';

/** Roughly estimates whether removing this instance would discard real
 * content (vs. an untouched default) — drives whether removal needs a
 * confirm step, mirroring GallerySection's content-aware delete confirm. */
function hasRealContent(instance: SectionInstance): boolean {
  const json = JSON.stringify(instance.content);
  return json.length > 40; // heuristic: more than a near-empty content object
}

export default function ManageSectionsDialog({
  open,
  onClose,
  sections,
}: {
  open: boolean;
  onClose: () => void;
  sections: SectionInstance[];
}) {
  const { addSection, duplicateSection, removeSection, toggleSectionVisibility, reorderSections } =
    useAdmin();
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState<SectionInstance | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleRemoveClick = (instance: SectionInstance) => {
    if (hasRealContent(instance)) {
      setRemoveConfirm(instance);
    } else {
      removeSection(instance.id);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const newOrder = sections.map((s) => s.id);
    const fromIdx = newOrder.indexOf(draggedId);
    const toIdx = newOrder.indexOf(targetId);
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, draggedId);
    reorderSections(newOrder);
    setDraggedId(null);
    setDragOverId(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Manage Sections
          <Button size="small" startIcon={<AddIcon />} onClick={() => setAddPickerOpen(true)}>
            Add Section
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <List disablePadding>
            {sections.map((instance) => {
              const def = SECTION_REGISTRY[instance.type];
              const label = getInstanceLabel(instance, sections);
              const isDragging = draggedId === instance.id;
              const isOver = dragOverId === instance.id;
              return (
                <ListItem
                  key={instance.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, instance.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(instance.id);
                  }}
                  onDrop={(e) => handleDrop(e, instance.id)}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  sx={{
                    opacity: isDragging ? 0.4 : instance.hidden ? 0.5 : 1,
                    borderTop: isOver && !isDragging ? '2px solid' : '2px solid transparent',
                    borderColor: isOver && !isDragging ? 'primary.main' : 'transparent',
                    cursor: 'grab',
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => toggleSectionVisibility(instance.id)}
                        title={instance.hidden ? 'Show on page' : 'Hide from page'}
                      >
                        {instance.hidden ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => duplicateSection(instance.id)}
                        title="Duplicate section"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveClick(instance)}
                        title="Remove section"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                >
                  <DragIndicatorIcon sx={{ opacity: 0.4, mr: 1 }} fontSize="small" />
                  <ListItemText
                    primary={label}
                    secondary={def?.label && def.label !== label ? def.label : undefined}
                  />
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Done</Button>
        </DialogActions>
      </Dialog>

      {/* ── Add section picker ── */}
      <Dialog open={addPickerOpen} onClose={() => setAddPickerOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add a Section</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.values(SECTION_REGISTRY).map((def) => (
              <Button
                key={def.type}
                variant="outlined"
                sx={{ justifyContent: 'flex-start' }}
                onClick={() => {
                  addSection(def.type);
                  setAddPickerOpen(false);
                }}
              >
                {def.label}
                <Chip
                  size="small"
                  label={sections.filter((s) => s.type === def.type).length}
                  sx={{ ml: 'auto' }}
                />
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPickerOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* ── Remove confirmation (only when the instance has real content) ── */}
      <Dialog open={!!removeConfirm} onClose={() => setRemoveConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Remove &ldquo;{removeConfirm ? getInstanceLabel(removeConfirm, sections) : ''}&rdquo;?
        </DialogTitle>
        <DialogContent>
          <Typography>
            This section has content in it. Removing it deletes that content from the page
            (any uploaded images stay in the library). Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (removeConfirm) removeSection(removeConfirm.id);
              setRemoveConfirm(null);
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
