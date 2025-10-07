import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Sparkles } from "lucide-react";

const CreateFriend = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    personality: "",
    tone: "",
    age: "",
    occupation: "",
    background: "",
    dream: "",
    family_info: "",
    story: "",
    daily_message_time: "18:00"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("ai_friends")
        .insert([{
          ...formData,
          age: parseInt(formData.age)
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "AI ami créé !",
        description: `${formData.name} est prêt à discuter avec vous.`,
      });

      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error("Error creating AI friend:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer votre ami IA.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <Card className="p-6 md:p-8 shadow-soft animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full gradient-warm flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Créer votre AI Friend</h1>
              <p className="text-muted-foreground">Personnalisez votre compagnon virtuel</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Prénom *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Âge *</Label>
                <Input
                  id="age"
                  type="number"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="17"
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation *</Label>
              <Input
                id="occupation"
                required
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Lycéen, étudiant, développeur..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="personality">Personnalité *</Label>
              <Textarea
                id="personality"
                required
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                placeholder="Enthousiaste, curieux, drôle..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Ton de conversation *</Label>
              <Input
                id="tone"
                required
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                placeholder="Amical, décontracté, enjoué..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="background">Background / Histoire *</Label>
              <Textarea
                id="background"
                required
                value={formData.background}
                onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                placeholder="Décrivez son parcours, ses passions, ce qui le définit..."
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dream">Rêve / Ambition</Label>
                <Textarea
                  id="dream"
                  value={formData.dream}
                  onChange={(e) => setFormData({ ...formData, dream: e.target.value })}
                  placeholder="Ses aspirations pour l'avenir..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="family_info">Famille</Label>
                <Textarea
                  id="family_info"
                  value={formData.family_info}
                  onChange={(e) => setFormData({ ...formData, family_info: e.target.value })}
                  placeholder="Parents, frères et sœurs..."
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="story">Histoire personnelle</Label>
              <Textarea
                id="story"
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                placeholder="Événements marquants, anecdotes..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_message_time">Heure préférée pour les messages</Label>
              <Input
                id="daily_message_time"
                type="time"
                value={formData.daily_message_time}
                onChange={(e) => setFormData({ ...formData, daily_message_time: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Votre ami vous contactera autour de cette heure
              </p>
            </div>

            <Button
              type="submit"
              className="w-full gradient-warm text-white font-semibold py-6"
              disabled={loading}
            >
              {loading ? "Création en cours..." : "Créer mon AI Friend"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateFriend;
