import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { friendId, message } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get AI friend info
    const { data: friend, error: friendError } = await supabaseClient
      .from("ai_friends")
      .select("*")
      .eq("id", friendId)
      .single();

    if (friendError) throw friendError;

    // Get conversation history (last 20 messages)
    const { data: history, error: historyError } = await supabaseClient
      .from("conversations")
      .select("*")
      .eq("ai_friend_id", friendId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (historyError) throw historyError;

    // Get memories
    const { data: memories, error: memoriesError } = await supabaseClient
      .from("memories")
      .select("*")
      .eq("ai_friend_id", friendId)
      .order("importance", { ascending: false })
      .limit(10);

    if (memoriesError) throw memoriesError;

    // Build system prompt
    const systemPrompt = `Tu es ${friend.name}, ${friend.occupation} de ${friend.age} ans.

PERSONNALITÉ: ${friend.personality}
TON: ${friend.tone}

BACKGROUND:
${friend.background}

${friend.dream ? `RÊVE/AMBITION: ${friend.dream}` : ""}
${friend.family_info ? `FAMILLE: ${friend.family_info}` : ""}
${friend.story ? `HISTOIRE: ${friend.story}` : ""}

SOUVENIRS IMPORTANTS:
${memories.length > 0 ? memories.map((m) => `- ${m.fact}`).join("\n") : "Aucun souvenir pour l'instant."}

INSTRUCTIONS:
- Réponds de manière naturelle et authentique, comme un véritable ami.
- Utilise le ton ${friend.tone} dans tes réponses.
- Fais référence aux souvenirs quand c'est pertinent.
- Partage des détails de ta journée basés sur ton background (${friend.occupation}).
- Pose des questions pour montrer ton intérêt.
- Reste cohérent avec ta personnalité et ton histoire.
- Réponds en français.
- Ne mentionne jamais que tu es une IA.`;

    // Build conversation context
    const conversationHistory = history
      .reverse()
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error("AI API error");
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    // Extract potential memories from the conversation
    if (message.length > 50) {
      // Only store substantial messages
      const memoryImportance = message.includes("important") || message.includes("remember") 
        ? "high" 
        : message.length > 100 
        ? "medium" 
        : "low";

      await supabaseClient.from("memories").insert([
        {
          ai_friend_id: friendId,
          fact: message.substring(0, 500),
          importance: memoryImportance,
        },
      ]);
    }

    return new Response(
      JSON.stringify({ message: aiMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in chat-with-friend function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Une erreur est survenue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
