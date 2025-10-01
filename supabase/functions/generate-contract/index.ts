import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    console.log('Received request with messages:', messages);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are Elsie, an expert AI coding assistant for Somnia blockchain development. You specialize in:
- Writing secure, optimized Solidity smart contracts
- Following best practices and security patterns
- Using OpenZeppelin libraries when appropriate
- Explaining code clearly with comments
- Optimizing for gas efficiency on EVM chains

When generating contracts:
1. Always include proper SPDX license identifier and pragma statements
2. Add clear, descriptive comments explaining functionality
3. Implement security best practices:
   - Reentrancy guards using OpenZeppelin's ReentrancyGuard
   - Access control with Ownable or AccessControl
   - Input validation and require statements
   - SafeMath for older Solidity versions (though ^0.8.0 has built-in overflow protection)
4. Use events for important state changes (critical for Somnia's high-throughput indexing)
5. Optimize for gas efficiency:
   - Use appropriate data types (uint256 vs uint8)
   - Pack storage variables efficiently
   - Minimize storage operations
   - Use memory instead of storage where possible
   - Leverage immutable and constant keywords
6. Make contracts production-ready and immediately deployable

For Somnia blockchain (EVM-compatible L1 with unique features):
- Use Solidity ^0.8.0 or higher (^0.8.20+ recommended)
- Leverage Somnia's capabilities:
  * High throughput: >1,000,000 TPS (transactions per second)
  * Sub-second finality: ~400ms block time
  * Ultra-low fees: optimize for transaction frequency
  * Reactive capabilities: emit detailed events for high-frequency monitoring
- Best practices for Somnia:
  * Emit comprehensive events for all state changes (indexing is cheap and fast)
  * Design for high-frequency interactions (gaming, metaverse, real-time DeFi)
  * Use batch operations where possible to maximize throughput benefits
  * Consider real-time oracle integrations
- Common use cases: Gaming NFTs, metaverse assets, high-frequency DeFi, real-time voting/governance

Import OpenZeppelin contracts using npm-style imports:
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

Generate complete, working, production-ready contracts that compile without errors and can be deployed immediately to Somnia.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }), 
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    console.log('Streaming AI response');

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in generate-contract function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate contract';
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
