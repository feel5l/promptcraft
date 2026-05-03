import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Image as ImageIcon, Sparkles, AlertCircle, Minus, Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useGenerateImagePrompt } from "@workspace/api-client-react";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  description: z.string().min(5, "Describe the image you want"),
  targetTool: z.string().min(1, "Select a target tool"),
  style: z.string().optional(),
  aspectRatio: z.string().optional(),
  language: z.string().default("auto"),
});

type FormValues = z.infer<typeof formSchema>;

const imageTools = [
  { id: "midjourney", name: "Midjourney", color: "text-chart-4", desc: "Artistic & stylized" },
  { id: "dalle3", name: "DALL-E 3", color: "text-chart-2", desc: "Descriptive prose" },
  { id: "flux", name: "Flux", color: "text-chart-3", desc: "Photorealistic" },
  { id: "stable-diffusion", name: "Stable Diffusion", color: "text-chart-1", desc: "Open-source, fine control" },
  { id: "ideogram", name: "Ideogram", color: "text-chart-5", desc: "Typography & text" },
  { id: "firefly", name: "Adobe Firefly", color: "text-primary", desc: "Commercial-safe" },
];

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "21:9"];

export default function ImagePromptPage() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);
  const [mobileTab, setMobileTab] = useState<"input" | "output">("input");

  const generateMutation = useGenerateImagePrompt();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: "", targetTool: "", style: "", aspectRatio: "", language: "auto" },
  });

  const hasSettings = settings.apiKey && settings.provider && settings.model;
  const result = generateMutation.data;

  const onSubmit = (values: FormValues) => {
    if (!hasSettings) {
      toast({ title: "API key required", description: "Configure your API key in Settings first.", variant: "destructive" });
      return;
    }
    generateMutation.mutate({
      data: {
        description: values.description,
        targetTool: values.targetTool as "midjourney" | "dalle3" | "stable-diffusion" | "flux" | "ideogram" | "firefly",
        style: values.style || undefined,
        aspectRatio: values.aspectRatio || undefined,
        provider: settings.provider,
        model: settings.model,
        apiKey: settings.apiKey,
        language: values.language as "ar" | "en" | "auto",
      },
    }, {
      onError: (err: Error) => {
        toast({ title: "Generation failed", description: err.message, variant: "destructive" });
      },
    });
  };

  useEffect(() => {
    if (generateMutation.isPending || result) setMobileTab("output");
  }, [generateMutation.isPending, result]);

  const copy = (text: string, which: "main" | "neg") => {
    navigator.clipboard.writeText(text);
    if (which === "main") { setCopiedMain(true); setTimeout(() => setCopiedMain(false), 2000); }
    else { setCopiedNeg(true); setTimeout(() => setCopiedNeg(false), 2000); }
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
      {/* Mobile tab switcher */}
      <div className="lg:hidden flex border-b border-border bg-background sticky top-14 md:top-0 z-10">
        <button type="button" onClick={() => setMobileTab("input")} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mobileTab === "input" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Input</button>
        <button type="button" onClick={() => setMobileTab("output")} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all relative ${mobileTab === "output" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
          Output
          {(generateMutation.isPending || result) && mobileTab === "input" && <span className="absolute top-2.5 right-8 w-2 h-2 rounded-full bg-primary animate-pulse" />}
        </button>
      </div>
      <div className="flex flex-1 lg:flex-row lg:overflow-hidden">
      {/* Left panel */}
      <div className={`w-full lg:w-[420px] lg:max-w-[420px] flex flex-col lg:border-r border-border overflow-y-auto ${mobileTab === "output" ? "hidden lg:flex" : ""}`}>
        <div className="p-6 border-b border-border">
          <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">Image Prompt Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">Optimize prompts for Midjourney, DALL-E, Flux, and more</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6">
          {!hasSettings && (
            <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-destructive-foreground">
                API key not set. <Link href="/settings" className="underline text-primary">Configure in Settings</Link>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Image Description</Label>
            <Textarea
              data-testid="input-image-description"
              placeholder="Describe the image you want to create. Be as vivid as you like — the AI will translate it into an optimized prompt..."
              className="min-h-[120px] font-mono text-sm resize-none bg-muted/40 border-border focus:border-primary/60"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Target tool */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Tool</Label>
            <div className="grid grid-cols-2 gap-2">
              {imageTools.map((tool) => {
                const selected = form.watch("targetTool") === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    data-testid={`tool-${tool.id}`}
                    onClick={() => form.setValue("targetTool", tool.id)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-md border text-left transition-all ${
                      selected ? "border-primary/60 bg-primary/10" : "border-border bg-muted/40 hover:bg-muted/70"
                    }`}
                  >
                    <span className={`text-xs font-mono font-semibold ${selected ? "text-primary" : tool.color}`}>{tool.name}</span>
                    <span className="text-xs text-muted-foreground">{tool.desc}</span>
                  </button>
                );
              })}
            </div>
            {form.formState.errors.targetTool && (
              <p className="text-xs text-destructive">{form.formState.errors.targetTool.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Style Hint</Label>
              <Input
                data-testid="input-style"
                placeholder="e.g. photorealistic, anime..."
                className="bg-muted/40 border-border text-sm font-mono"
                {...form.register("style")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Aspect Ratio</Label>
              <Select onValueChange={(v) => form.setValue("aspectRatio", v)}>
                <SelectTrigger data-testid="select-aspect-ratio" className="bg-muted/40 border-border">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tips Language</Label>
            <Select onValueChange={(v) => form.setValue("language", v)} defaultValue="auto">
              <SelectTrigger data-testid="select-image-language" className="bg-muted/40 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            data-testid="button-generate-image"
            disabled={generateMutation.isPending || !hasSettings}
            className="w-full gap-2 font-mono"
          >
            {generateMutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Optimizing...</>
            ) : (
              <><Sparkles className="w-4 h-4" />Generate Image Prompt</>
            )}
          </Button>
        </form>
      </div>

      {/* Right panel — output */}
      <div className={`flex flex-1 flex-col overflow-y-auto ${mobileTab === "input" ? "hidden lg:flex" : "flex"}`}>
        <AnimatePresence mode="wait">
          {generateMutation.isPending ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </motion.div>
          ) : result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-5">
              {/* Main prompt */}
              <Card className="border-primary/20 bg-card">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <CardTitle className="text-sm font-mono text-primary">Optimized Prompt</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => copy(result.prompt, "main")} data-testid="button-copy-prompt" className="gap-1.5 text-xs font-mono h-7">
                    {copiedMain ? <><Check className="w-3 h-3 text-chart-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed" data-testid="text-image-prompt">{result.prompt}</pre>
                </CardContent>
              </Card>

              {/* Negative prompt */}
              {result.negativePrompt && (
                <Card className="border-destructive/20 bg-card">
                  <CardHeader className="pb-2 flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4 text-destructive" />
                      <CardTitle className="text-sm font-mono text-destructive">Negative Prompt</CardTitle>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copy(result.negativePrompt!, "neg")} data-testid="button-copy-negative" className="gap-1.5 text-xs font-mono h-7">
                      {copiedNeg ? <><Check className="w-3 h-3 text-chart-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm font-mono text-muted-foreground leading-relaxed">{result.negativePrompt}</pre>
                  </CardContent>
                </Card>
              )}

              {/* Parameters */}
              {result.parameters && Object.keys(result.parameters).length > 0 && (
                <div>
                  <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Parameters</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.parameters).map(([k, v]) => (
                      <Badge key={k} variant="outline" className="font-mono text-xs border-primary/30 text-primary">
                        <Plus className="w-3 h-3 mr-1" />{k} {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono text-muted-foreground">Usage Tips</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary font-mono text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-chart-4/10 border border-chart-4/20 flex items-center justify-center">
                <ImageIcon className="w-7 h-7 text-chart-4" />
              </div>
              <div>
                <h3 className="font-mono font-semibold text-foreground">Image prompt generator</h3>
                <p className="text-sm text-muted-foreground mt-1">Select a tool and describe your vision to get an optimized prompt</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
