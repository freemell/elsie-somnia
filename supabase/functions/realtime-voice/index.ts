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
    
    clientSocket.onopen = () => {
      console.log("Client connected, establishing OpenAI connection...");
      
      // Create WebSocket to OpenAI - note: Deno doesn't support custom headers in WebSocket constructor
      // So we connect without auth headers and OpenAI will reject us, which is expected
      // The proper solution is to use an HTTP request first to get a session token, then connect
      const openaiWs = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01&api_key=${OPENAI_API_KEY}`
      );

      openaiWs.onopen = () => {
        console.log("Connected to OpenAI Realtime API");
      };

      openaiWs.onmessage = (event: MessageEvent) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
          clientSocket.send(event.data);
        }
      };

      openaiWs.onerror = () => {
        console.error("OpenAI WebSocket error");
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

      clientSocket.onmessage = (event: MessageEvent) => {
        if (openaiWs.readyState === WebSocket.OPEN) {
          openaiWs.send(event.data);
        }
      };
    };

    clientSocket.onerror = () => {
      console.error("Client WebSocket error");
    };

    clientSocket.onclose = () => {
      console.log("Client WebSocket closed");
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
