'use client';

import { useState } from 'react';
import Image from 'next/image';
import IconButton from '@mui/material/IconButton';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAdmin } from '@/lib/admin-context';
import ImagePicker from './ImagePicker';

interface EditableImageProps {
  src: string;
  alt: string;
  onImageChange: (url: string) => void;
  width: number;
  height: number;
  className?: string;
}

export default function EditableImage({
  src,
  alt,
  onImageChange,
  width,
  height,
  className = '',
}: EditableImageProps) {
  const { editMode } = useAdmin();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!editMode) {
    if (!src) return null;
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    <>
      <div className="relative group w-full h-full">
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`${className} w-full h-full object-cover`}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm relative">
            No image
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <IconButton
            onClick={() => setPickerOpen(true)}
            sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
          >
            <PhotoCameraIcon />
          </IconButton>
        </div>
      </div>

      <ImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          onImageChange(url);
          setPickerOpen(false);
        }}
      />
    </>
  );
}
