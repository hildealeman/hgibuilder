import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeEditorProps {
  code: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code }) => {
  return (
    <div className="h-full w-full overflow-auto bg-[#1e1e1e] text-sm">
      <SyntaxHighlighter
        language="html"
        style={vscDarkPlus}
        customStyle={{ margin: 0, height: '100%', borderRadius: 0 }}
        showLineNumbers
      >
        {code || '<!-- No code generated yet -->'}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeEditor;
