import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MessageCircle, Sparkles, Heart } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AIFriend = Database['public']['Tables']['ai_friends']['Row'];

const Index = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<AIFriend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    const { data, error } = await supabase
      .from("ai_friends")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading friends:", error);
    } else {
      setFriends(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-warm opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Votre compagnon IA personnalisé</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Créez votre
            <span className="gradient-warm bg-clip-text text-transparent"> AI Friend</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
            Un ami virtuel unique qui vous parle naturellement, se souvient de vos conversations
            et partage sa vie quotidienne avec vous.
          </p>

          <Button
            onClick={() => navigate("/create")}
            className="gradient-warm text-white font-semibold px-8 py-6 text-lg shadow-hover hover:shadow-soft transition-all animate-fade-in"
          >
            <Plus className="mr-2 h-5 w-5" />
            Créer mon AI Friend
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 gradient-card shadow-soft hover:shadow-hover transition-all animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Conversations naturelles</h3>
            <p className="text-muted-foreground">
              Discutez comme avec un vrai ami, avec une personnalité unique et authentique.
            </p>
          </Card>

          <Card className="p-6 gradient-card shadow-soft hover:shadow-hover transition-all animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Mémoire émotionnelle</h3>
            <p className="text-muted-foreground">
              Votre ami se souvient de vos discussions et fait référence à vos échanges passés.
            </p>
          </Card>

          <Card className="p-6 gradient-card shadow-soft hover:shadow-hover transition-all animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Vie quotidienne</h3>
            <p className="text-muted-foreground">
              Il partage ses expériences quotidiennes basées sur son background personnalisé.
            </p>
          </Card>
        </div>

        {/* Friends List */}
        {friends.length > 0 && (
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">Vos AI Friends</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {friends.map((friend) => (
                <Card
                  key={friend.id}
                  className="p-6 gradient-card shadow-soft hover:shadow-hover transition-all cursor-pointer"
                  onClick={() => navigate(`/chat/${friend.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full gradient-warm flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {friend.name[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1">{friend.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {friend.occupation}, {friend.age} ans
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {friend.personality}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/chat/${friend.id}`);
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Discuter
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center text-muted-foreground">
            Chargement de vos amis...
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
