import { open, save } from '@tauri-apps/api/dialog';
import React from 'react';

interface FileDialogProps {
  onOpenFile: (filePath: string, content: string) => void;
  onSaveFile: (filePath: string) => void;
}

const FileDialog: React.FC<FileDialogProps> = ({ onOpenFile, onSaveFile }) => {
  const handleOpen = async () => {
    const selectedFile = await open({
      filters: [{ name: 'All Files', extensions: ['*'] }]
    });
    if (typeof selectedFile === 'string') {
      const result = await window.__TAURI__.invoke('read_file', { path: selectedFile });
      onOpenFile(selectedFile, result as string);
    }
  };

  const handleSave = async () => {
    const selectedFile = await save({
      filters: [{ name: 'All Files', extensions: ['*'] }]
    });
    if (typeof selectedFile === 'string') {
      onSaveFile(selectedFile);
    }
  };

  return (
    <div>
      <button onClick={handleOpen}>Open File</button>
      <button onClick={handleSave}>Save File</button>
    </div>
  );
};

export default FileDialog;
