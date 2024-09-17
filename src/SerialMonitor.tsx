import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import {
  Box,
  Button,
  Flex,
  Text,
  Select,
  Textarea,
  Input,
  VStack,
  Heading,
  HStack,
  Switch,
  useToast,
  Stack,
} from "@chakra-ui/react";

const SerialMonitor = () => {
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [receivedData, setReceivedData] = useState<string>("");
  const [inputData, setInputData] = useState<string>("");
  const [autoRead, setAutoRead] = useState(false);
  const [isLineByLine, setIsLineByLine] = useState(false); // State to toggle line-by-line mode
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  const refreshPorts = async () => {
    try {
      const availablePorts: string[] = await invoke("list_serial_ports");
      setPorts(availablePorts);
      if (availablePorts.length === 0) {
        toast({
          title: "No Ports Found",
          description: "No serial ports are available.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch serial ports.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Error fetching serial ports:", error);
    }
  };

  const connectToPort = async () => {
    if (selectedPort) {
      try {
        await invoke("open_serial_port", { port: selectedPort });
        setIsConnected(true);
        toast({
          title: "Connected",
          description: `Connected to ${selectedPort}.`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to connect to ${selectedPort}.`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        console.error("Failed to open port:", error);
      }
    }
  };

  const disconnectFromPort = async () => {
    try {
      await invoke("close_serial_port");
      setIsConnected(false);
      setAutoRead(false);
      toast({
        title: "Disconnected",
        description: `Disconnected from ${selectedPort}.`,
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect from the port.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Failed to disconnect from port:", error);
    }
  };

  const readFromPort = async () => {
    try {
      const data = await invoke("read_serial_port");
      if (isLineByLine) {
        const lines = data.split("\n");
        setReceivedData((prevData) => prevData + lines.map(line => line.trim()).filter(line => line).join("\n"));
      } else {
        setReceivedData((prevData) => prevData + data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read from the port.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Failed to read from port:", error);
    }
  };

  const writeToPort = async () => {
    try {
      await invoke("write_serial_port", { data: inputData });
      setInputData("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to write to the port.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      console.error("Failed to write to port:", error);
    }
  };

  const toggleAutoRead = () => {
    setAutoRead((prevAutoRead) => !prevAutoRead);
  };

  const toggleLineMode = () => {
    setIsLineByLine((prevMode) => !prevMode);
  };

  useEffect(() => {
    if (autoRead && isConnected) {
      intervalRef.current = setInterval(readFromPort, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRead, isConnected, isLineByLine]);

  useEffect(() => {
    refreshPorts();
  }, []);

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <VStack spacing={4} align="stretch">
        <Heading as="h2" size="lg" mb={4}>
          Serial Monitor
        </Heading>

        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center">
          <HStack spacing={4} mb={{ base: 4, md: 0 }}>
            <Text fontSize="lg">Select Port:</Text>
            <Select
              placeholder="Select a port"
              value={selectedPort ?? ""}
              onChange={(e) => setSelectedPort(e.target.value)}
              width={{ base: "full", md: "200px" }}
            >
              {ports.length > 0 ? (
                ports.map((port, index) => (
                  <option key={index} value={port}>
                    {port}
                  </option>
                ))
              ) : (
                <option disabled>No Ports Available</option>
              )}
            </Select>
          </HStack>
          <Button onClick={refreshPorts} colorScheme="blue" variant="solid">
            Refresh Ports
          </Button>
        </Flex>

        <HStack spacing={4} mb={4}>
          <Button
            onClick={connectToPort}
            colorScheme="green"
            isDisabled={!selectedPort || isConnected}
          >
            {isConnected ? "Connected" : "Connect"}
          </Button>
          <Button
            onClick={disconnectFromPort}
            colorScheme="red"
            isDisabled={!isConnected}
          >
            Disconnect
          </Button>
        </HStack>

        <HStack spacing={4} align="center" mb={4}>
          <Text fontSize="md">Auto Read:</Text>
          <Switch
            isChecked={autoRead}
            onChange={toggleAutoRead}
            colorScheme="teal"
            isDisabled={!isConnected}
          />
          <Button
            onClick={toggleLineMode}
            colorScheme="purple"
            variant={isLineByLine ? "outline" : "solid"}
          >
            {!isLineByLine ? "Line-by-Line Mode" : "Normal Mode"}
          </Button>
        </HStack>

        <Box>
          <Heading as="h3" size="md" mb={2}>
            Received Data
          </Heading>
          <Textarea
            value={receivedData}
            placeholder="Data will appear here"
            readOnly
            height="150px"  // Reduced height
            resize="none"
            whiteSpace="pre-wrap"  // Preserve white space and line breaks
          />
          {!autoRead && (
            <Button
              onClick={readFromPort}
              colorScheme="teal"
              mt={2}
              isDisabled={!isConnected}
            >
              Read Data
            </Button>
          )}
        </Box>

        <Box>
          <Heading as="h3" size="md" mb={2}>
            Send Data
          </Heading>
          <Stack spacing={4} direction={{ base: "column", md: "row" }}>
            <Input
              placeholder="Enter data to send"
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              width={{ base: "full", md: "300px" }}
            />
            <Button
              onClick={writeToPort}
              colorScheme="purple"
              isDisabled={!isConnected || !inputData}
            >
              Send Data
            </Button>
          </Stack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SerialMonitor;
