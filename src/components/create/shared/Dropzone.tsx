'use client';

import React, { useState } from 'react';

interface DropzoneProps {
  onFile: (file: File) => void;
  accept: string;
  className?: string;
  children: React.ReactNode;
}

// Shared drag-and-drop + click-to-browse upload zone, used by every Create
// Card studio's photo/video step (RecipeCardStudio, DiscoveryCardStudio,
// VideoCardStudio). Click-to-browse always worked (native <label>+<input>);
// this adds real HTML5 drag-and-drop on top of the same `.studio-dropzone`
// visual, rather than duplicating the drag-state handling three times.
export const Dropzone: React.FC<DropzoneProps> = ({ onFile, accept, className = '', children }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <label
      className={`studio-dropzone${className ? ` ${className}` : ''}${isDragging ? ' is-dragging' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
    >
      {children}
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </label>
  );
};

export default Dropzone;
