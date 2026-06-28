'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EditableText from '@/components/admin/EditableText';
import SectionStyleEditor from '@/components/admin/SectionStyleEditor';
import type { ContactLink, ContactSectionContent } from '@/lib/config/types';
import { resolveStyleColor, resolveStyleRadius, resolveBackgroundLayer } from '@/lib/config/section-background';
import { getSectionAnchorId } from '@/lib/sections/registry';
import type { SectionRendererProps } from '@/lib/sections/registry';

export default function ContactSection({
  instance,
  editMode,
  onContentChange,
  allSections,
}: SectionRendererProps<ContactSectionContent>) {
  const { links, sectionTitle } = instance.content;
  const style = instance.style;
  const headingColor = resolveStyleColor(style.heading, 'var(--theme-accent)');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ContactLink | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const openEdit = (link: ContactLink) => {
    setEditingLink(link);
    setEditLabel(link.label);
    setEditUrl(link.url);
    setDialogOpen(true);
  };

  const openAdd = () => {
    setEditingLink(null);
    setEditLabel('');
    setEditUrl('');
    setDialogOpen(true);
  };

  const handleSaveLink = () => {
    if (!editLabel || !editUrl) return;
    const updatedLinks = editingLink
      ? links.map((l) =>
          l.id === editingLink.id ? { ...l, label: editLabel, url: editUrl } : l,
        )
      : [...links, { id: `link-${Date.now()}`, label: editLabel, url: editUrl }];
    onContentChange({ links: updatedLinks });
    setDialogOpen(false);
  };

  const handleDeleteLink = (id: string) => {
    onContentChange({ links: links.filter((l) => l.id !== id) });
  };

  const validLinks = links.filter((l) => l.url);

  return (
    <section
      id={getSectionAnchorId(instance, allSections)}
      className={`py-20 px-6 overflow-hidden shadow-[var(--shadow-md)] ${editMode ? 'edit-mode-section-outline' : ''}`}
      style={{
        ...resolveBackgroundLayer(style, 'var(--theme-secondary)'),
        borderRadius: resolveStyleRadius(style.borderRadius, 'var(--radius-md)'),
      }}
    >
      {editMode && <SectionStyleEditor instanceId={instance.id} style={style} />}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ color: headingColor }}>
          <EditableText
            value={sectionTitle}
            onChange={(val) => onContentChange({ sectionTitle: val })}
            variant="light"
          />
        </h2>

        <div className="flex flex-wrap justify-center gap-4">
          {editMode ? (
            <>
              {links.map((link) => (
                <Box
                  key={link.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    px: 2,
                    py: 1,
                    bgcolor: 'white',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}
                >
                  <div className="text-sm">
                    <div className="font-medium" style={{ color: 'var(--theme-accent)' }}>
                      {link.label}
                    </div>
                    <div className="text-xs text-gray-400 truncate max-w-[160px]">
                      {link.url || '(no URL)'}
                    </div>
                  </div>
                  <IconButton size="small" onClick={() => openEdit(link)} sx={{ ml: 0.5 }}>
                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteLink(link.id)}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={openAdd}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                Add Link
              </Button>
            </>
          ) : (
            validLinks.map((link) => (
              <Button
                key={link.id}
                href={link.url}
                target={
                  link.url.startsWith('mailto:') || link.url.startsWith('tel:')
                    ? undefined
                    : '_blank'
                }
                rel="noopener noreferrer"
                variant="contained"
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  bgcolor: 'var(--theme-primary)',
                  '&:hover': { bgcolor: 'var(--theme-primary)', opacity: 0.85 },
                }}
              >
                {link.label}
              </Button>
            ))
          )}
        </div>
      </div>

      {/* Edit / Add link dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingLink ? 'Edit Link' : 'Add Link'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Link Text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="e.g., Call us"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="URL"
            value={editUrl}
            onChange={(e) => setEditUrl(e.target.value)}
            placeholder="e.g., tel:+1-555-000-0000 or https://instagram.com/…"
            helperText="Use tel: for phone numbers, mailto: for email addresses"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveLink}
            variant="contained"
            disabled={!editLabel || !editUrl}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </section>
  );
}
