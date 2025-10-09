import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { RealtimeChat } from "@/utils/RealtimeAudio";

interface VoiceInterfaceProps {
  onCodeGenerated: (code: string) => void;
}

const VoiceInterface = ({ onCodeGenerated }: VoiceInterfaceProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");

  const extractSolidityCode = (text: string): string => {
    const solidityMatch = text.match(/```solidity\n([\s\S]*?)\n```/);
    if (solidityMatch) return solidityMatch[1];
    const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch && codeMatch[1].includes("pragma solidity")) return codeMatch[1];
    if (text.includes("pragma solidity")) return text;
    return "";
  };

  const handleMessage = (event: any) => {
    // Speaking state
    if (event.type === "response.audio.delta") setIsListening(true);
    if (event.type === "response.audio.done") setIsListening(false);

    // Transcript accumulation
    if (event.type === "response.audio_transcript.delta" && event.delta) {
      setCurrentTranscript((prev) => prev + event.delta);
    }
    if (event.type === "response.audio_transcript.done") {
      const transcript = event.transcript || currentTranscript;
      const code = extractSolidityCode(transcript);
      if (code) {
        onCodeGenerated(code);
        toast.success("Smart contract generated from voice!");
      }
      setCurrentTranscript("");
    }

    // Errors
    if (event.type === "error") {
      toast.error(event.error?.message || "Voice chat error");
    }
  };

  const start = async () => {
    try {
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setIsConnected(true);
      toast.success("Voice chat ready! Start speaking.");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to start voice chat");
    }
  };

  const stop = () => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    setIsConnected(false);
    setIsListening(false);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="flex items-center gap-2">
      {!isConnected ? (
        <Button onClick={start} size="icon" variant="outline" className="h-10 w-10">
          <Mic className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          onClick={stop}
          size="icon"
          variant={isListening ? "default" : "outline"}
          className={`h-10 w-10 ${isListening ? "animate-pulse" : ""}`}
        >
          <MicOff className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default VoiceInterface;
