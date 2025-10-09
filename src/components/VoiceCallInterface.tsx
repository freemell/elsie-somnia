import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { useConversation } from "@11labs/react";
import { supabase } from "@/integrations/supabase/client";

interface VoiceCallInterfaceProps {
  onCodeGenerated: (code: string) => void;
}

const VoiceCallInterface = ({ onCodeGenerated }: VoiceCallInterfaceProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string>("");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [agentId, setAgentId] = useState<string>(""); // Set your ElevenLabs agent ID here

  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs: Connected");
      toast.success("Connected to Elsie");
      setIsConnecting(false);
    },
    onDisconnect: () => {
      console.log("ElevenLabs: Disconnected");
    },
    onMessage: (message) => {
      console.log("ElevenLabs message:", message);
      
      if (message.source === "user") {
        setTranscript((prev) => [...prev, `You: ${message.message}`]);
      }
      
      if (message.source === "ai") {
        setTranscript((prev) => [...prev, `Elsie: ${message.message}`]);
        const code = extractSolidityCode(message.message);
        if (code) {
          onCodeGenerated(code);
          toast.success("Smart contract generated from voice!");
        }
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      const errorMessage = typeof error === 'string' ? error : "Voice chat error";
      setConnectionError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const { status, isSpeaking } = conversation;
  const isConnected = status === "connected";

  const extractSolidityCode = (text: string): string => {
    const solidityMatch = text.match(/```solidity\n([\s\S]*?)\n```/);
    if (solidityMatch) return solidityMatch[1];
    const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch && codeMatch[1].includes("pragma solidity")) return codeMatch[1];
    if (text.includes("pragma solidity")) return text;
    return "";
  };


  const start = async () => {
    setIsConnecting(true);
    setConnectionError("");
    
    try {
      console.log("Starting ElevenLabs voice call...");
      
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AGENT_ID = "agent_6101k74nms6beb29n8yz67q71xbf";
      
      // Get signed URL from our edge function
      const { data, error } = await supabase.functions.invoke('elevenlabs-session', {
        body: { agentId: AGENT_ID }
      });
      
      if (error || !data?.signedUrl) {
        throw new Error(error?.message || "Failed to get signed URL");
      }
      
      console.log("Got signed URL, starting conversation...");
      
      // Start the conversation with the signed URL
      await conversation.startSession({
        signedUrl: data.signedUrl
      });
      
    } catch (err) {
      console.error("Voice call connection error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start voice call";
      setConnectionError(errorMessage);
      setIsConnecting(false);
      toast.error(errorMessage);
    }
  };

  const stop = async () => {
    await conversation.endSession();
    setTranscript([]);
    setConnectionError("");
  };

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Button 
          onClick={start} 
          size="icon" 
          variant="outline" 
          className="h-10 w-10"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
        {isConnecting && (
          <p className="text-xs text-muted-foreground">Connecting...</p>
        )}
        {connectionError && (
          <p className="text-xs text-destructive max-w-[200px] text-center">{connectionError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="container max-w-2xl mx-auto h-full flex flex-col items-center justify-center p-6">
        {/* Call Header */}
        <div className="text-center mb-8 animate-scale-in">
          <h2 className="text-3xl font-bold mb-2">Voice Call with Elsie</h2>
          <p className="text-muted-foreground">
            {isSpeaking ? "Elsie is speaking..." : "Speak naturally"}
          </p>
        </div>

        {/* Avatar with Animation */}
        <div className="relative mb-8">
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center transition-all duration-300 ${
              isSpeaking ? "animate-pulse scale-110" : ""
            }`}
          >
            <Mic className="h-16 w-16 text-primary-foreground" />
          </div>
          {isSpeaking && (
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          )}
        </div>

        {/* Transcript */}
        <div className="w-full max-h-64 overflow-y-auto bg-card rounded-lg p-4 mb-8 space-y-2 border">
          {transcript.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">Start speaking to see the conversation...</p>
          ) : (
            transcript.map((line, i) => (
              <p key={i} className={`text-sm ${line.startsWith("You:") ? "text-foreground" : "text-primary"}`}>
                {line}
              </p>
            ))
          )}
        </div>

        {/* End Call Button */}
        <Button onClick={stop} size="lg" variant="destructive" className="gap-2">
          <PhoneOff className="h-5 w-5" />
          End Call
        </Button>
      </div>
    </div>
  );
};

export default VoiceCallInterface;
