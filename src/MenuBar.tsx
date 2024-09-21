import React, { useEffect, useState } from 'react';
import {
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  
  
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Text,
  useDisclosure,
  Box,
  Stack,
} from '@chakra-ui/react';
//import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { invoke } from '@tauri-apps/api/tauri';

interface MenuBarProps {
  createNewFile: () => void;
  openFile: () => void;
  saveFile: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitWindow: () => void;
  buildProject: () => void;
  runProject: () => void;
  flashToController: () => void;
  toggleColorMode: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
  createNewFile,
  openFile,
  saveFile,
  zoomIn,
  zoomOut,
  fitWindow,
  buildProject,
  runProject
}) => {
  //const { colorMode, toggleColorMode: toggleTheme } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isExitModalOpen, onOpen: onOpenExitModal, onClose: onCloseExitModal } = useDisclosure();

  const [githubUrl, setGithubUrl] = useState<string>('');
  const [aboutUs, setAboutUs] = useState<string>('');
  const [boardDetails, setBoardDetails] = useState<string>('');

  const handleShowBoardInfo = async () => {
    try {
      const details = await invoke<string>('get_board_info');
      setBoardDetails(details);
      onOpen();
    } catch (error) {
      console.error('Error fetching board info:', error);
    }
  };

  useEffect(() => {
    invoke<string>('get_github_url')
      .then((url) => setGithubUrl(url))
      .catch((err) => console.error('Error fetching GitHub URL:', err));

    invoke<string>('get_about_us')
      .then((info) => setAboutUs(info))
      .catch((err) => console.error('Error fetching About Us info:', err));
  }, []);

  const handleExit = () => {
    // Implement actual exit logic here
    window.close(); // This might not work in some contexts; adjust as needed
  };

  return (
    <>
      <HStack spacing={4} padding={2} backgroundColor="gray.700" boxShadow="md">
        {/* File Menu */}
        <Menu>
          <MenuButton as={Button}>File</MenuButton>
          <MenuList>
            <MenuItem onClick={createNewFile}>
              New File <Text fontSize="sm" color="gray.400" ml={2}>(Ctrl+N)</Text>
            </MenuItem>
            <MenuItem onClick={openFile}>
              Open File <Text fontSize="sm" color="gray.400" ml={2}>(Ctrl+O)</Text>
            </MenuItem>
            <MenuItem onClick={saveFile}>
              Save File <Text fontSize="sm" color="gray.400" ml={2}>(Ctrl+S)</Text>
            </MenuItem>
            <MenuItem onClick={onOpenExitModal}>
              Exit <Text fontSize="sm" color="gray.400" ml={2}>(Ctrl+Q)</Text>
            </MenuItem>
          </MenuList>
        </Menu>

        {/* View Menu */}
        <Menu>
          <MenuButton as={Button}>View</MenuButton>
          <MenuList>
            <MenuItem onClick={zoomIn}>
              Zoom In <Text fontSize="sm" color="gray.400" ml={2}>(Ctrl+Shift +)</Text>
            </MenuItem>
            <MenuItem onClick={zoomOut}>
              Zoom Out <Text fontSize="sm" color="gray.400" ml={2}>(Ctrl+Shift -)</Text>
            </MenuItem>
            <MenuItem onClick={fitWindow}>
              Fit Window
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Help Menu */}
        <Menu>
          <MenuButton as={Button}>Help</MenuButton>
          <MenuList>
            <MenuItem onClick={() => window.open(githubUrl)}>
              GitHub Source Code
            </MenuItem>
            <MenuItem onClick={() => alert(aboutUs)}>
              About Us
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Run Menu */}
        <Menu>
          <MenuButton as={Button}>Run</MenuButton>
          <MenuList>
            <MenuItem onClick={buildProject}>
              Build
            </MenuItem>
            <MenuItem onClick={runProject}>
              Run
            </MenuItem>
           
            <MenuItem onClick={handleShowBoardInfo}>
              Show Board Info
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Theme Toggle Button 
        <IconButton
      aria-label="Toggle Dark Mode"
      icon={colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
      onClick={toggleColorMode}
      bg={colorMode === 'dark' ? '#ccc' : 'gray.800'} // Light mode bg: #ccc, Dark mode bg: gray.800
      color={colorMode === 'dark' ? 'gray.800' : 'whiteAlpha.900'} // Text color for each mode
      _hover={{
        bg: colorMode === 'dark' ? '#bbb' : 'gray.700', // Adjust hover colors
      }}
    />*/}
      </HStack>

      {/* Exit Confirmation Modal */}
      <Modal isOpen={isExitModalOpen} onClose={onCloseExitModal} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Exit</ModalHeader>
          <ModalBody>
            <Text fontSize="md">
              Are you sure you want to exit the application? 😔
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleExit}>
              Yes, Exit
            </Button>
            <Button variant="outline" onClick={onCloseExitModal}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Board Info Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Board Information</ModalHeader>
          <ModalBody>
            <Box p={4}>
              <Stack spacing={2}>
                {boardDetails.split('\n').map((line, index) => (
                  <Text key={index} fontSize="md">
                    {line}
                  </Text>
                ))}
              </Stack>
            </Box>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MenuBar;
