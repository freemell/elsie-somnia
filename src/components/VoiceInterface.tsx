import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { AudioRecorder, encodeAudioForAPI } from "@/utils/audioRecorder";
import { playAudioData, clearAudioQueue } from "@/utils/audioPlayer";

interface VoiceInterfaceProps {
  onCodeGenerated: (code: string) => void;
}

const VoiceInterface = ({ onCodeGenerated }: VoiceInterfaceProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const sessionConfiguredRef = useRef(false);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const extractSolidityCode = (text: string): string => {
    const solidityMatch = text.match(/```solidity\n([\s\S]*?)\n```/);
    if (solidityMatch) return solidityMatch[1];
    
    const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (codeMatch && codeMatch[1].includes('pragma solidity')) return codeMatch[1];
    
    if (text.includes('pragma solidity')) return text;
    
    return '';
  };

  const connect = async () => {
    try {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      const ws = new WebSocket(
        `wss://refncwnbaiudqhjohdeb.supabase.co/functions/v1/realtime-voice`
      );
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        sessionConfiguredRef.current = false;
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log("Received message:", data.type);

        if (data.type === "session.created") {
          console.log("Session created, configuring...");
          const config = {
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: "You are Elsie, an AI assistant specialized in creating Solidity smart contracts for the Somnia blockchain. When users ask to create contracts, generate complete, secure Solidity code. Always wrap code in ```solidity blocks. Keep responses concise and focused on smart contract development.",
              voice: "alloy",
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 1000
              },
              temperature: 0.8,
              max_response_output_tokens: 4096
            }
          };
          ws.send(JSON.stringify(config));
        }

        if (data.type === "session.updated") {
          console.log("Session configured successfully");
          sessionConfiguredRef.current = true;
          toast.success("Voice chat ready! Start speaking.");
          startRecording(ws);
        }

        if (data.type === "response.audio.delta" && data.delta) {
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          if (audioContextRef.current) {
            await playAudioData(audioContextRef.current, bytes);
          }
        }

        if (data.type === "response.audio_transcript.delta") {
          setCurrentTranscript(prev => prev + data.delta);
        }

        if (data.type === "response.audio_transcript.done") {
          const transcript = data.transcript || currentTranscript;
          console.log("Complete transcript:", transcript);
          const code = extractSolidityCode(transcript);
          if (code) {
            onCodeGenerated(code);
            toast.success("Smart contract generated from voice!");
          }
          setCurrentTranscript("");
        }

        if (data.type === "input_audio_buffer.speech_started") {
          console.log("Speech detected");
          setIsListening(true);
        }

        if (data.type === "input_audio_buffer.speech_stopped") {
          console.log("Speech stopped");
          setIsListening(false);
        }

        if (data.type === "error") {
          console.error("OpenAI error:", data);
          toast.error(data.error?.message || "Voice chat error");
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("Voice connection error");
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setIsListening(false);
        stopRecording();
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to start voice chat");
    }
  };

  const startRecording = async (ws: WebSocket) => {
    try {
      recorderRef.current = new AudioRecorder((audioData) => {
        if (ws.readyState === WebSocket.OPEN && sessionConfiguredRef.current) {
          const encoded = encodeAudioForAPI(audioData);
          ws.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: encoded
          }));
        }
      });
      await recorderRef.current.start();
      console.log("Recording started");
    } catch (error) {
      console.error("Recording error:", error);
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  };

  const disconnect = () => {
    stopRecording();
    clearAudioQueue();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsConnected(false);
    setIsListening(false);
    sessionConfiguredRef.current = false;
  };

  return (
    <div className="flex items-center gap-2">
      {!isConnected ? (
        <Button
          onClick={connect}
          size="icon"
          variant="outline"
          className="h-10 w-10"
        >
          <Mic className="h-5 w-5" />
        </Button>
      ) : (
        <Button
          onClick={disconnect}
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
