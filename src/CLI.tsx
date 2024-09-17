import { useState, useEffect, useRef } from 'react';
import { Box, Textarea } from '@chakra-ui/react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { invoke } from '@tauri-apps/api/tauri';
import 'react-resizable/css/styles.css';

const terminalFontStyle = {
  fontFamily: 'Courier New, monospace',
  fontSize: '14px',
  color: 'white',
};

const CLI = () => {
  const [command, setCommand] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const terminalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await runCommand(command);
      setCommand(''); // Clear command after execution
    }
  };

  const runCommand = async (cmd: string) => {
    try {
      const result: string = await invoke('run_command', { command: cmd });
      setOutput((prevOutput) => `${prevOutput}\n> ${cmd}\n${result}`);
    } catch (error) {
      setOutput((prevOutput) => `${prevOutput}\n> ${cmd}\nError: ${error}`);
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <Draggable
      handle=".draggable-header"
      defaultPosition={{ x: 100, y: 100 }}
      bounds="parent"
    >
      <ResizableBox
        width={600}
        height={400}
        minConstraints={[300, 200]}
        maxConstraints={[800, 600]}
        className="draggable-box"
        resizeHandles={['se']}
        style={{ boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)', borderRadius: '8px' }}
      >
        <Box
          p={4}
          bg="gray.900"
          borderRadius="md"
          style={terminalFontStyle}
          display="flex"
          flexDirection="column"
          h="100%"
        >
          <Box
            ref={terminalRef}
            bg="gray.800"
            borderColor="gray.700"
            borderRadius="md"
            style={terminalFontStyle}
            flex="1"
            overflowY="auto"
            p={2}
            mb={2}
          >
            <pre>{output}</pre>
          </Box>
          <Textarea
            placeholder="Type command and press Enter"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            size="sm"
            bg="gray.800"
            color="white"
            borderColor="gray.700"
            borderRadius="md"
            style={terminalFontStyle}
            h="40px"
          />
        </Box>
      </ResizableBox>
    </Draggable>
  );
};

export default CLI;
