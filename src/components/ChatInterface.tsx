import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import elsieLogo from "@/assets/elsie-logo.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  onCodeGenerated: (code: string) => void;
}

const ChatInterface = ({ onCodeGenerated }: ChatInterfaceProps) => {
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

  const extractSolidityCode = (text: string): string => {
    // Handle incomplete code blocks during streaming (opening fence without closing)
    const incompleteSolidityMatch = text.match(/```solidity\n([\s\S]*)$/);
    if (incompleteSolidityMatch) {
      return incompleteSolidityMatch[1];
    }
    
    const incompleteCodeMatch = text.match(/```\n([\s\S]*)$/);
    if (incompleteCodeMatch && incompleteCodeMatch[1].includes('pragma solidity')) {
      return incompleteCodeMatch[1];
    }
    
    // Extract complete Solidity code blocks
    const solidityMatch = text.match(/```solidity\n([\s\S]*?)\n```/);
    if (solidityMatch) {
      return solidityMatch[1];
    }
    
    // Check for generic code blocks
    const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch && codeMatch[1].includes('pragma solidity')) {
      return codeMatch[1];
    }
    
    // If no code blocks, check if the entire text is Solidity code
    if (text.includes('pragma solidity')) {
      return text;
    }
    
    return '';
  };

  const generateResponse = async (userMessage: string) => {
    try {
      console.log('Calling AI with message:', userMessage);
      
      const conversationMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      conversationMessages.push({
        role: 'user',
        content: userMessage
      });

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-contract`;
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: conversationMessages }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (response.status === 402) {
          throw new Error("AI credits depleted. Please add credits to continue.");
        }
        throw new Error('Failed to start stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;
      let fullMessage = '';
      let currentCode = '';

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullMessage += content;
              
              // Extract and update code progressively for letter-by-letter display
              const extractedCode = extractSolidityCode(fullMessage);
              if (extractedCode && extractedCode !== currentCode) {
                currentCode = extractedCode;
                onCodeGenerated(currentCode);
              }
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final extraction
      const finalCode = extractSolidityCode(fullMessage);
      onCodeGenerated(finalCode);

      // Return only non-code parts for chat display
      const chatMessage = fullMessage.replace(/```solidity\n[\s\S]*?\n```/g, '[Smart contract generated]')
        .replace(/```\n[\s\S]*?\n```/g, '[Smart contract generated]');
      
      return chatMessage || 'Smart contract generated successfully!';

    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsGenerating(true);

    try {
      const response = await generateResponse(input);
      const assistantMessage: Message = { role: "assistant", content: response };
      setMessages(prev => [...prev, assistantMessage]);
      
      toast.success("Smart contract generated by AI!");
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.message || "Failed to generate code. Please try again.";
      
      if (errorMessage.includes("Rate limit")) {
        toast.error("AI rate limit reached. Please wait a moment and try again.");
      } else if (errorMessage.includes("credits")) {
        toast.error("AI credits depleted. Please add credits to continue.");
      } else {
        toast.error(errorMessage);
      }
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
          <img src={elsieLogo} alt="Elsie" className="h-5 w-5" />
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
