import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onCodeGenerated: (code: string) => void;
  selectedTemplate: string | null;
}

const ChatInterface = ({ onCodeGenerated, selectedTemplate }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Elsie, your AI coding assistant for Somnia blockchain. I can help you create, edit, and deploy smart contracts. What would you like to build today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedTemplate) {
      handleTemplateSelection(selectedTemplate);
    }
  }, [selectedTemplate]);

  const handleTemplateSelection = (template: string) => {
    const templatePrompts: Record<string, string> = {
      erc20: "Create an ERC-20 token contract",
      nft: "Create an NFT minting contract",
      dao: "Create a DAO governance contract",
      defi: "Create a DeFi staking contract"
    };
    
    const prompt = templatePrompts[template];
    if (prompt) {
      setInput(prompt);
    }
  };

  const generateResponse = async (userMessage: string) => {
    // Mock AI response with sample contract generation
    const templates: Record<string, string> = {
      "erc-20": `pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}`,
      "nft": `pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("MyNFT", "MNFT") {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
    }
}`,
      "dao": `pragma solidity ^0.8.0;

contract SimpleDAO {
    struct Proposal {
        string description;
        uint256 voteCount;
        bool executed;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public votes;
    uint256 public proposalCount;

    function createProposal(string memory description) public {
        proposals[proposalCount] = Proposal(description, 0, false);
        proposalCount++;
    }

    function vote(uint256 proposalId) public {
        require(!votes[msg.sender][proposalId], "Already voted");
        votes[msg.sender][proposalId] = true;
        proposals[proposalId].voteCount++;
    }
}`,
      "default": `pragma solidity ^0.8.0;

contract GeneratedContract {
    // Contract generated based on your prompt
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Add your custom logic here
}`
    };

    const lowerMessage = userMessage.toLowerCase();
    let code = templates["default"];
    let response = "I've generated a smart contract based on your request. ";

    if (lowerMessage.includes("erc-20") || lowerMessage.includes("token")) {
      code = templates["erc-20"];
      response += "This is an ERC-20 token contract with minting functionality.";
    } else if (lowerMessage.includes("nft") || lowerMessage.includes("721")) {
      code = templates["nft"];
      response += "This is an ERC-721 NFT contract with minting capabilities.";
    } else if (lowerMessage.includes("dao") || lowerMessage.includes("governance")) {
      code = templates["dao"];
      response += "This is a simple DAO governance contract with proposal and voting functionality.";
    } else {
      response += "I've created a basic contract structure. Let me know what specific features you'd like to add!";
    }

    onCodeGenerated(code);
    return response;
  };

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await generateResponse(input);
      const assistantMessage: Message = { role: "assistant", content: response };
      setMessages(prev => [...prev, assistantMessage]);
      
      toast.success("Code generated successfully!");
    } catch (error) {
      toast.error("Failed to generate code. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-card border border-border rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Chat with Elsie
        </h2>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-muted/50">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to build... (e.g., 'Create an ERC-20 token')"
            className="min-h-[60px] resize-none"
            disabled={isGenerating}
          />
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
