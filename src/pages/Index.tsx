import { useState } from "react";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import CodeEditor from "@/components/CodeEditor";
import ContractTemplates from "@/components/ContractTemplates";

const Index = () => {
  const [generatedCode, setGeneratedCode] = useState(`// Welcome to Elsie AI
// Your intelligent coding assistant for Somnia blockchain
// Type a prompt in the chat to generate smart contracts

pragma solidity ^0.8.0;

contract Welcome {
    string public greeting = "Hello from Elsie!";
    
    function updateGreeting(string memory _newGreeting) public {
        greeting = _newGreeting;
    }
}`);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-[2000px] mx-auto w-full">
        {/* Chat Interface - Left Side */}
        <div className="lg:w-1/2 flex flex-col gap-4">
          <ChatInterface 
            onCodeGenerated={setGeneratedCode}
            selectedTemplate={selectedTemplate}
          />
        </div>

        {/* Code Editor - Right Side */}
        <div className="lg:w-1/2 flex flex-col gap-4">
          <ContractTemplates onSelectTemplate={setSelectedTemplate} />
          <CodeEditor code={generatedCode} onCodeChange={setGeneratedCode} />
        </div>
      </main>
    </div>
  );
};

export default Index;
