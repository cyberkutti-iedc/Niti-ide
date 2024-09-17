import React, { useState, useEffect } from 'react';
import { ChakraProvider, Box, extendTheme, useColorMode, useToast, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@chakra-ui/react';
import MonacoEditor from '@monaco-editor/react';
import { invoke } from '@tauri-apps/api/tauri';
import { dialog, window as tauriWindow } from '@tauri-apps/api';
import MenuBar from './MenuBar';
import TabBar from './TabBar';
import SerialMonitor from './SerialMonitor';

const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
});

const App = () => {
  const [code, setCode] = useState('// Write your Rust code here\n');
  const [fontSize, setFontSize] = useState(14);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [editorTabs, setEditorTabs] = useState<Array<{ path: string; content: string }>>([]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [ports, setPorts] = useState<string[]>([]);
  const { toggleColorMode } = useColorMode();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure(); // Chakra UI modal hooks
  const [pendingAction, setPendingAction] = useState<'quit' | null>(null);

  useEffect(() => {
    import('monaco-editor/esm/vs/editor/editor.main').then(() => {
      // Monaco Editor is ready
    });

    // Add keyboard event listeners
    const handleKeyDown = async (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            await saveFile();
            break;
          case 'o':
            event.preventDefault();
            await openFile();
            break;
          case 'n':
            event.preventDefault();
            createNewFile();
            break;
          case 'q':
            event.preventDefault();
            setPendingAction('quit');
            onOpen();
            break;
          case '+':
            if (event.shiftKey) {
              event.preventDefault();
              zoomIn();
            }
            break;
          case '-':
            event.preventDefault();
            zoomOut();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editorTabs, activeTab, filePath, fontSize]);

  const openFile = async () => {
    const path = await dialog.open();
    if (typeof path === 'string') {
      const fileContent = await invoke<string>('open_file', { path });
      setFilePath(path);
      setEditorTabs((prev) => [...prev, { path, content: fileContent }]);
      setActiveTab(editorTabs.length);
    }
  };

  const saveFile = async () => {
    try {
      const activeFile = editorTabs[activeTab];
      if (activeFile.path) {
        await invoke('save_file', { path: activeFile.path, content: activeFile.content });
        toast({
          title: 'File Saved',
          description: 'The file has been saved successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        let path = await dialog.save({
          filters: [{ name: 'Rust File', extensions: ['rs'] }],
        });
        if (typeof path === 'string') {
          if (!path.endsWith('.rs')) {
            path += '.rs';
          }
          const updatedTabs = [...editorTabs];
          updatedTabs[activeTab].path = path;
          setEditorTabs(updatedTabs);
          setFilePath(path);
          await invoke('save_file', { path, content: activeFile.content });
          toast({
            title: 'File Saved',
            description: 'The file has been saved successfully.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'There was an error saving the file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const createNewFile = () => {
    setCode('// New Rust code here\n');
    setFilePath(null);
    setEditorTabs((prev) => [...prev, { path: '', content: code }]);
    setActiveTab(editorTabs.length);
  };

  const closeTab = (index: number) => {
    setEditorTabs((prevTabs) => {
      const newTabs = prevTabs.filter((_, i) => i !== index);
      if (index === activeTab && newTabs.length > 0) {
        setActiveTab(index === 0 ? 0 : index - 1);
      } else if (newTabs.length === 0) {
        setCode('// Write your Rust code here\n');
        setFilePath(null);
        setActiveTab(0);
      }
      return newTabs;
    });
  };

  const zoomIn = () => setFontSize((prev) => prev + 1);
  const zoomOut = () => setFontSize((prev) => prev - 1);

  const buildProject = () => {
    // Implement build project logic
  };

  const runProject = () => {
    // Implement run project logic
  };

  const flashToController = () => {
    // Implement flash to controller logic
  };

  const handleQuit = async () => {
    if (pendingAction === 'quit') {
      try {
        await invoke('exit'); // Ensure the process exits
      } catch (error) {
        console.error('Failed to invoke exit:', error);
        toast({
          title: 'Error',
          description: 'Failed to exit the application.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      try {
        await tauriWindow.appWindow.close(); // Close the window
      } catch (error) {
        console.error('Failed to close window:', error);
        toast({
          title: 'Error',
          description: 'Failed to close the application window.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
    onClose(); // Close the modal after performing the action
  };

  return (
    <ChakraProvider theme={theme}>
      <Box height="100vh" display="flex" flexDirection="column">
        <MenuBar
          createNewFile={createNewFile}
          openFile={openFile}
          saveFile={saveFile}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          fitWindow={() => {}}
          buildProject={buildProject}
          runProject={runProject}
          flashToController={flashToController}
          toggleColorMode={toggleColorMode}
        />
        <Box flex={1} display="flex" flexDirection="row" overflow="hidden">
          <SerialMonitor />
          <Box flex={1} display="flex" flexDirection="column" overflow="hidden">
            <TabBar
              tabs={editorTabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              closeTab={closeTab}
            />
            <Box flex={1} backgroundColor="gray.800" overflow="hidden">
              <MonacoEditor
                width="100%"
                height="100%"
                language="rust"
                theme="vs-dark"
                value={editorTabs[activeTab]?.content ?? ''}
                options={{ fontSize }}
                onChange={(value) => {
                  if (typeof value === 'string') {
                    setEditorTabs((prevTabs) => {
                      const newTabs = [...prevTabs];
                      newTabs[activeTab].content = value;
                      return newTabs;
                    });
                  }
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Quit Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Quit</ModalHeader>
          <ModalBody>
            Are you sure you want to quit Niti IDE? 😔
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleQuit}>
              Yes, Quit
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  );
};

export default App;
