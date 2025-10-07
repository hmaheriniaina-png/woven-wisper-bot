import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, User, Bot } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AIFriend = Database['public']['Tables']['ai_friends']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];

const Chat = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [friend, setFriend] = useState<AIFriend | null>(null);
  const [messages, setMessages] = useState<Conversation[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!friendId) return;
    loadFriend();
    loadMessages();
    subscribeToMessages();
  }, [friendId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadFriend = async () => {
    const { data, error } = await supabase
      .from("ai_friends")
      .select("*")
      .eq("id", friendId)
      .single();

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger votre ami.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setFriend(data);
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("ai_friend_id", friendId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`conversations:${friendId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversations",
          filter: `ai_friend_id=eq.${friendId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Conversation]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !friendId || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      // Save user message
      await supabase.from("conversations").insert([
        {
          ai_friend_id: friendId,
          role: "user",
          content: userMessage,
        },
      ]);

      // Call AI function
      const { data, error } = await supabase.functions.invoke("chat-with-friend", {
        body: {
          friendId,
          message: userMessage,
        },
      });

      if (error) throw error;

      // Save AI response
      await supabase.from("conversations").insert([
        {
          ai_friend_id: friendId,
          role: "assistant",
          content: data.message,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!friend) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full gradient-warm flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">{friend.name}</h2>
              <p className="text-sm text-muted-foreground">
                {friend.occupation}, {friend.age} ans
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <Card className="p-8 text-center gradient-card shadow-soft">
              <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">
                Commencez la conversation !
              </h3>
              <p className="text-muted-foreground">
                {friend.name} est impatient de discuter avec vous.
              </p>
            </Card>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-fade-in ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-accent"
                    : "gradient-warm"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>
              <Card
                className={`p-4 max-w-[80%] ${
                  message.role === "user"
                    ? "bg-accent text-accent-foreground"
                    : "gradient-card shadow-soft"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <span className="text-xs opacity-60 mt-2 block">
                  {new Date(message.created_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </Card>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-card/50 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Écrivez votre message..."
              disabled={loading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="gradient-warm text-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
