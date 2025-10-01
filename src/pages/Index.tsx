import { useState } from "react";
import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import CodeEditorEnhanced from "@/components/CodeEditorEnhanced";
import { BrowserProvider } from "ethers";

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

  const [walletProvider, setWalletProvider] = useState<BrowserProvider | null>(null);

  const handleWalletConnected = (address: string, provider: BrowserProvider) => {
    setWalletProvider(provider);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onWalletConnected={handleWalletConnected} />
      
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-[2000px] mx-auto w-full">
        {/* Chat Interface - Left Side */}
        <div className="lg:w-1/2 flex flex-col gap-4">
          <ChatInterface 
            onCodeGenerated={setGeneratedCode}
          />
        </div>

        {/* Code Editor - Right Side */}
        <div className="lg:w-1/2 flex flex-col gap-4">
          <CodeEditorEnhanced 
            code={generatedCode} 
            onCodeChange={setGeneratedCode}
            provider={walletProvider}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
