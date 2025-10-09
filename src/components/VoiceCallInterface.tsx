import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { toast } from "sonner";
import { RealtimeChat } from "@/utils/RealtimeAudio";

interface VoiceCallInterfaceProps {
  onCodeGenerated: (code: string) => void;
}

const VoiceCallInterface = ({ onCodeGenerated }: VoiceCallInterfaceProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string>("");

  const extractSolidityCode = (text: string): string => {
    const solidityMatch = text.match(/```solidity\n([\s\S]*?)\n```/);
    if (solidityMatch) return solidityMatch[1];
    const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch && codeMatch[1].includes("pragma solidity")) return codeMatch[1];
    if (text.includes("pragma solidity")) return text;
    return "";
  };

  const handleMessage = (event: any) => {
    console.log("Voice event:", event.type);

    if (event.type === "response.audio.delta") {
      setIsSpeaking(true);
    }
    if (event.type === "response.audio.done") {
      setIsSpeaking(false);
    }

    if (event.type === "input_audio_buffer.speech_started") {
      setIsListening(true);
    }
    if (event.type === "input_audio_buffer.speech_stopped") {
      setIsListening(false);
    }

    if (event.type === "conversation.item.input_audio_transcription.completed") {
      setTranscript((prev) => [...prev, `You: ${event.transcript}`]);
    }

    if (event.type === "response.audio_transcript.delta" && event.delta) {
      setCurrentTranscript((prev) => prev + event.delta);
    }
    
    if (event.type === "response.audio_transcript.done") {
      const text = event.transcript || currentTranscript;
      if (text) {
        setTranscript((prev) => [...prev, `Elsie: ${text}`]);
        const code = extractSolidityCode(text);
        if (code) {
          onCodeGenerated(code);
          toast.success("Smart contract generated from voice!");
        }
      }
      setCurrentTranscript("");
    }

    if (event.type === "error") {
      console.error("Voice error:", event);
      toast.error(event.error?.message || "Voice chat error");
    }
  };

  const start = async () => {
    setIsConnecting(true);
    setConnectionError("");
    
    try {
      console.log("Starting voice call...");
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setIsConnected(true);
      setIsConnecting(false);
      toast.success("Connected to Elsie");
    } catch (err) {
      console.error("Voice call connection error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start voice call";
      setConnectionError(errorMessage);
      setIsConnecting(false);
      toast.error(errorMessage);
    }
  };

  const stop = () => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setTranscript([]);
    setCurrentTranscript("");
  };

  useEffect(() => () => stop(), []);

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
            {isSpeaking ? "Elsie is speaking..." : isListening ? "Listening..." : "Speak naturally"}
          </p>
        </div>

        {/* Avatar with Animation */}
        <div className="relative mb-8">
          <div
            className={`w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center transition-all duration-300 ${
              isSpeaking ? "animate-pulse scale-110" : isListening ? "ring-4 ring-primary/50 scale-105" : ""
            }`}
          >
            <Mic className={`h-16 w-16 text-primary-foreground ${isListening ? "animate-pulse" : ""}`} />
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
          {currentTranscript && (
            <p className="text-sm text-primary animate-pulse">Elsie: {currentTranscript}...</p>
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
