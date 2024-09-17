import { Box, VStack, Button } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { useState } from 'react';

interface SidebarProps {
  onFileOpen: (filePath: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onFileOpen }) => {
  const [files, setFiles] = useState<string[]>([]);

  const handleOpenFolder = async () => {
    const folderPath = await open({ directory: true, multiple: false });
    if (folderPath) {
      const result: { files: string[] } = await invoke('read_folder', { path: folderPath });
      setFiles(result.files);
    }
  };

  return (
    <Box p={4} bg="gray.800" h="100%">
      <VStack spacing={4}>
        <Button colorScheme="teal" onClick={handleOpenFolder}>
          Open Folder
        </Button>
        {files.map(file => (
          <Button variant="ghost" key={file} onClick={() => onFileOpen(file)}>
            {file}
          </Button>
        ))}
      </VStack>
    </Box>
  );
};

export default Sidebar;
