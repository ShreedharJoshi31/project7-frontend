"use client";

import React, { useState } from "react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackConsole,
  SandpackFileExplorer,
  SandpackThemeProvider,
} from "@codesandbox/sandpack-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EnhancedSandpack = ({ code }) => {
  const [isOpen, setIsOpen] = useState(false);

  const files = {
    "/App.js": code,
    "/index.js": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import './index.css';
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<React.StrictMode><App /></React.StrictMode>);`,
    "/public/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sandpack App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
    "/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;`,
    "/tailwind.config.js": `module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    "/postcss.config.js": `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Open Enhanced Sandpack</Button>
      </DialogTrigger>
      <DialogContent className="h-[95vh] w-[95vw] max-w-none">
        <div>
          <DialogTitle />
        </div>
        <SandpackProvider
          theme={"dark"}
          template="react"
          files={files}
          customSetup={{
            dependencies: {
              react: "^18.0.0",
              "react-dom": "^18.0.0",
              tailwindcss: "^3.0.0",
              autoprefixer: "^10.0.0",
              postcss: "^8.0.0",
              three: "^0.150.0",
              "@react-three/fiber": "^8.0.0",
              "@react-three/drei": "^9.0.0",
              "framer-motion": "^10.0.0",
              "date-fns": "^2.0.0",
              "framer-motion-3d": "^10.0.0",
            },
          }}
        >
          <SandpackThemeProvider theme={"dark"}>
            <SandpackLayout className="h-full">
              <div className="flex-1 overflow-hidden">
                <Tabs defaultValue="code" className="flex h-full flex-col">
                  <TabsList className="px-2 py-1">
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="console">Console</TabsTrigger>
                  </TabsList>
                  <TabsContent value="code">
                    <div className="flex">
                      <SandpackFileExplorer style={{ width: "250px" }} />
                      <SandpackCodeEditor
                        showTabs
                        showLineNumbers
                        showInlineErrors
                        wrapContent
                        closableTabs
                        style={{ height: "800px", width: "1200px" }}
                        showRunButton
                      />
                    </div>
                  </TabsContent>
                  <TabsContent value="preview" className="flex-1">
                    <SandpackPreview
                      showOpenInCodeSandbox={false}
                      style={{ height: "800px", width: "1200px" }}
                    />
                  </TabsContent>
                  <TabsContent value="console" className="flex-1 overflow-auto">
                    <SandpackConsole
                      style={{ height: "800px", width: "1200px" }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </SandpackLayout>
          </SandpackThemeProvider>
        </SandpackProvider>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedSandpack;
