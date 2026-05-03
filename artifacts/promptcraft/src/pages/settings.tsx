import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Check, AlertCircle, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useGetProviders } from "@workspace/api-client-react";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";

function detectProvider(key: string): string {
  if (key.startsWith("sk-ant-")) return "anthropic";
  if (key.startsWith("sk-or-")) return "openrouter";
  if (key.startsWith("AIza") || key.startsWith("ya29.")) return "gemini";
  if (key.startsWith("sk-")) return "openai";
  return "";
}

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [localKey, setLocalKey] = useState(settings.apiKey);
  const [localProvider, setLocalProvider] = useState(settings.provider);
  const [localModel, setLocalModel] = useState(settings.model);
  const [saved, setSaved] = useState(false);

  const { data: providersData } = useGetProviders();
  const providers = providersData?.providers ?? [];
  const selectedProvider = providers.find((p) => p.id === localProvider);
  const models = selectedProvider?.models ?? [];

  // Auto-detect provider from key
  useEffect(() => {
    if (localKey) {
      const detected = detectProvider(localKey);
      if (detected && detected !== localProvider) {
        setLocalProvider(detected);
        setLocalModel("");
      }
    }
  }, [localKey]);

  // Reset model when provider changes
  useEffect(() => {
    if (localModel && models.length > 0 && !models.find((m) => m.id === localModel)) {
      setLocalModel("");
    }
  }, [localProvider, models]);

  const handleSave = () => {
    if (!localKey) {
      toast({ title: "API key required", description: "Enter your API key to save settings.", variant: "destructive" });
      return;
    }
    if (!localProvider) {
      toast({ title: "Provider required", description: "Select an AI provider.", variant: "destructive" });
      return;
    }
    if (!localModel) {
      toast({ title: "Model required", description: "Select a model.", variant: "destructive" });
      return;
    }
    setSettings({ provider: localProvider, model: localModel, apiKey: localKey });
    setSaved(true);
    toast({ title: "Settings saved", description: "Your API configuration has been saved locally." });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setLocalKey("");
    setLocalProvider("");
    setLocalModel("");
    setSettings({ provider: "", model: "", apiKey: "" });
    toast({ title: "Settings cleared" });
  };

  const isConfigured = settings.apiKey && settings.provider && settings.model;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">API Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your AI provider. Keys are stored only in your browser.</p>
      </div>

      {/* Status banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm ${
          isConfigured
            ? "bg-chart-3/10 border-chart-3/20 text-chart-3"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}
        data-testid="status-api-config"
      >
        {isConfigured ? (
          <><Check className="w-4 h-4 shrink-0" />Connected — {settings.provider} / {settings.model}</>
        ) : (
          <><AlertCircle className="w-4 h-4 shrink-0" />Not configured — prompts cannot be generated</>
        )}
      </motion.div>

      {/* Provider selection */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-mono">Provider</CardTitle>
          <CardDescription className="text-xs">
            Select your AI provider. The provider will be auto-detected from your API key prefix.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {providers.map((provider) => {
              const selected = localProvider === provider.id;
              return (
                <button
                  key={provider.id}
                  type="button"
                  data-testid={`provider-${provider.id}`}
                  onClick={() => { setLocalProvider(provider.id); setLocalModel(""); }}
                  className={`flex flex-col items-start px-4 py-3 rounded-lg border text-left transition-all ${
                    selected ? "border-primary/60 bg-primary/10" : "border-border bg-muted/40 hover:bg-muted/60"
                  }`}
                >
                  <span className={`text-sm font-mono font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                    {provider.name}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5 font-mono">{provider.keyPrefix}...</span>
                </button>
              );
            })}
          </div>

          {/* Model selector */}
          {localProvider && models.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Model</Label>
              <Select value={localModel} onValueChange={setLocalModel}>
                <SelectTrigger data-testid="select-model" className="bg-muted/40 border-border font-mono text-sm">
                  <SelectValue placeholder="Select a model..." />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="font-mono text-sm">{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API key input */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-mono">API Key</CardTitle>
          <CardDescription className="text-xs">
            Your key is stored only in localStorage and forwarded to the app backend for provider calls — never logged or persisted server-side.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Key</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                data-testid="input-api-key"
                placeholder="Paste your API key here..."
                value={localKey}
                onChange={(e) => setLocalKey(e.target.value)}
                className="pr-10 font-mono text-sm bg-muted/40 border-border focus:border-primary/60"
              />
              <button
                type="button"
                data-testid="button-toggle-key-visibility"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {localKey && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary">
                  Detected: {detectProvider(localKey) || "unknown"}
                </Badge>
                {localKey.length > 8 && (
                  <span className="text-xs text-muted-foreground">...{localKey.slice(-4)}</span>
                )}
              </div>
            )}
          </div>

          {/* Key prefix help */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Key formats:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { prefix: "sk-...", provider: "OpenAI" },
                { prefix: "sk-ant-...", provider: "Anthropic" },
                { prefix: "sk-or-...", provider: "OpenRouter" },
                { prefix: "AIza...", provider: "Google Gemini" },
              ].map(({ prefix, provider }) => (
                <div key={provider} className="flex items-center gap-2 text-xs">
                  <code className="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{prefix}</code>
                  <span className="text-muted-foreground">{provider}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              data-testid="button-save-settings"
              className="flex-1 gap-2 font-mono"
            >
              {saved ? <><Check className="w-4 h-4" />Saved</> : <><Zap className="w-4 h-4" />Save Configuration</>}
            </Button>
            {(localKey || localProvider) && (
              <Button variant="outline" onClick={handleClear} data-testid="button-clear-settings" className="font-mono text-xs">
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy note */}
      <p className="text-xs text-muted-foreground text-center font-mono">
        Your API key is forwarded to the app backend to call your chosen provider — it is never logged or stored on the server.
      </p>
    </div>
  );
}
