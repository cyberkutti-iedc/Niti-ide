import { useEffect } from 'react';
import MonacoEditor from '@monaco-editor/react';

const Editor = () => {
  useEffect(() => {
    // Dynamically import monaco when needed
    import('monaco-editor').then(monaco => {
      console.log(monaco);  // Monaco namespace should now be available here
    });
  }, []);

  return (
    <MonacoEditor
      width="100%"
      height="100%"
      language="javascript"
      theme="vs-dark"
      value="// Your code here"
      options={{ fontSize: 14 }}
    />
  );
};

export default Editor;
