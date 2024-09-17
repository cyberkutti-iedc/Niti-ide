import React from 'react';
import { Tabs, TabList, Tab, Box } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

interface TabBarProps {
  tabs: Array<{ path: string; content: string }>;
  activeTab: number;
  setActiveTab: (index: number) => void;
  closeTab: (index: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, setActiveTab, closeTab }) => {
  const getTabLabel = (path: string) => {
    if (!path) {
      return 'Untitled';
    }
    return path.split('/').pop() || 'Untitled';
  };

  return (
    <Tabs index={activeTab} onChange={(index) => setActiveTab(index)} variant="enclosed">
      <TabList>
        {tabs.map((tab, index) => (
          <Tab key={index}>
            {getTabLabel(tab.path)} {/* Display file name or "Untitled" */}
            <Box
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(index);
              }}
              ml={2}
            >
              <CloseIcon boxSize={3} />
            </Box>
          </Tab>
        ))}
      </TabList>
    </Tabs>
  );
};

export default TabBar;
