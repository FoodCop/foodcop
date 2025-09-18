import React from "react";
import ConsoleAgentApp from "./ConsoleAgentApp";

const ConsoleAgentPage: React.FC = () => {
  const handleFixApplied = (fix: string) => {
    console.log("Fix applied:", fix);
    // Here you could integrate with your code editor or file system
    // For example, using the MCP (Model Context Protocol) to modify files
  };

  const handleCodeChange = (filePath: string, newCode: string) => {
    console.log("Code change requested:", filePath);
    console.log("New code:", newCode);
    // Here you could integrate with your code editor to apply changes
    // For example, using the MCP to write files
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ConsoleAgentApp
        wsUrl="ws://localhost:3001/console"
        enableRealTime={true}
        enableAutoFix={true}
        enableDashboard={true}
        onFixApplied={handleFixApplied}
        onCodeChange={handleCodeChange}
      />
    </div>
  );
};

export default ConsoleAgentPage;
