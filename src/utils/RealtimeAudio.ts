import { supabase } from "@/integrations/supabase/client";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: 24000 });
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class RealtimeChat {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;

  constructor(private onMessage: (message: any) => void) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  private encodeAudioData(float32Array: Float32Array): string {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(binary);
  }

  async init() {
    try {
      console.log("Initializing RealtimeChat...");
      
      // Get ephemeral token from our backend function
      console.log("Requesting ephemeral token from edge function...");
      const { data, error } = await supabase.functions.invoke("realtime-session", {
        body: {},
      });
      
      console.log("Edge function response:", { error, hasData: !!data });
      
      if (error) {
        console.error("Edge function error:", error);
        throw new Error(`Failed to get session: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("No data received from edge function");
      }
      
      if (data.error) {
        throw new Error(`Edge function returned error: ${data.error}`);
      }
      
      const EPHEMERAL_KEY = data?.client_secret?.value as string | undefined;
      if (!EPHEMERAL_KEY) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid session response - missing client_secret");
      }
      
      console.log("Ephemeral key received successfully");

      // Create peer connection
      console.log("Creating peer connection...");
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = (e) => {
        console.log("Received remote audio track");
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      console.log("Requesting microphone access...");
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pc.addTrack(ms.getTracks()[0]);
      console.log("Local audio track added");

      // Set up data channel
      this.dc = this.pc.createDataChannel("oai-events");
      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
        this.onMessage(event);
      });

      // Create and set local description
      console.log("Creating WebRTC offer...");
      const offer = await this.pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false });
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API via WebRTC
      console.log("Connecting to OpenAI Realtime API...");
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp || "",
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error("OpenAI Realtime API error:", sdpResponse.status, errorText);
        throw new Error(`Failed to connect to OpenAI: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };

      await this.pc.setRemoteDescription(answer);
      console.log("WebRTC connection established successfully");

      // Start recording and stream audio buffers as needed via data channel
      console.log("Starting audio recorder...");
      this.recorder = new AudioRecorder((audioData) => {
        if (this.dc?.readyState === "open") {
          this.dc.send(
            JSON.stringify({
              type: "input_audio_buffer.append",
              audio: this.encodeAudioData(audioData),
            })
          );
        }
      });
      await this.recorder.start();
      console.log("RealtimeChat initialized successfully!");
    } catch (error) {
      console.error("Error initializing realtime chat:", error);
      if (error instanceof Error) {
        throw new Error(`Connection failed: ${error.message}`);
      }
      throw error;
    }
  }

  async sendMessage(text: string) {
    if (!this.dc || this.dc.readyState !== "open") {
      throw new Error("Data channel not ready");
    }

    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text,
          },
        ],
      },
    };

    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({ type: "response.create" }));
  }

  disconnect() {
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
  }
}
