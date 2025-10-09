import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const upgrade = req.headers.get("upgrade") || "";
    if (upgrade.toLowerCase() !== "websocket") {
      return new Response("Expected WebSocket connection", { status: 426 });
    }

    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    let openaiWs: WebSocket | null = null;

    clientSocket.onopen = async () => {
      console.log("Client WebSocket connected");
      
      const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
      const headers = new Headers();
      headers.set("Authorization", `Bearer ${OPENAI_API_KEY}`);
      headers.set("OpenAI-Beta", "realtime=v1");
      
      openaiWs = new WebSocket(url);

      openaiWs.onopen = () => {
        console.log("Connected to OpenAI Realtime API");
        // Send authorization after connection
        if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.send(JSON.stringify({
            type: "session.update",
            session: {
              modalities: ["text", "audio"],
              instructions: "You are Elsie, an AI assistant specialized in creating Solidity smart contracts.",
            }
          }));
        }
      };

      openaiWs.onmessage = (event) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(event.data);
        }
      };

      openaiWs.onerror = (error) => {
        console.error("OpenAI WebSocket error:", error);
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(JSON.stringify({ type: "error", message: "OpenAI connection error" }));
        }
      };

      openaiWs.onclose = () => {
        console.log("OpenAI WebSocket closed");
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.close();
        }
      };
    };

    clientSocket.onmessage = (event) => {
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.send(event.data);
      }
    };

    clientSocket.onerror = (error) => {
      console.error("Client WebSocket error:", error);
    };

    clientSocket.onclose = () => {
      console.log("Client WebSocket closed");
      if (openaiWs && openaiWs.readyState === WebSocket.OPEN) {
        openaiWs.close();
      }
    };

    return response;
  } catch (error) {
    console.error("Error in realtime-voice function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
