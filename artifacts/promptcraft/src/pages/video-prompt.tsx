import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Video, Sparkles, AlertCircle, Camera, Clock, Film } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useGenerateVideoPrompt } from "@workspace/api-client-react";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  description: z.string().min(5, "Describe your video concept"),
  targetTool: z.string().min(1, "Select a video tool"),
  duration: z.string().optional(),
  cameraStyle: z.string().optional(),
  language: z.string().default("auto"),
});

type FormValues = z.infer<typeof formSchema>;

const videoTools = [
  { id: "sora", name: "Sora", color: "text-chart-1", desc: "OpenAI · Cinematic quality" },
  { id: "runway", name: "Runway Gen-3", color: "text-chart-4", desc: "Pro camera control" },
  { id: "kling", name: "Kling AI", color: "text-chart-3", desc: "Physics realism" },
  { id: "pika", name: "Pika 2.0", color: "text-chart-5", desc: "Creative & artistic" },
  { id: "luma", name: "Luma Dream Machine", color: "text-chart-2", desc: "Photorealistic" },
  { id: "hailuo", name: "Hailuo (MiniMax)", color: "text-primary", desc: "Fast generation" },
];

const cameraStyles = [
  "Cinematic", "Handheld / Documentary", "Aerial / Drone", "Slow Motion",
  "Time-lapse", "Tracking Shot", "Static / Locked", "POV",
];

export default function VideoPromptPage() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedCamera, setCopiedCamera] = useState(false);
  const [mobileTab, setMobileTab] = useState<"input" | "output">("input");

  const generateMutation = useGenerateVideoPrompt();
  const result = generateMutation.data;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: "", targetTool: "", duration: "", cameraStyle: "", language: "auto" },
  });

  const hasSettings = settings.apiKey && settings.provider && settings.model;

  const onSubmit = (values: FormValues) => {
    if (!hasSettings) {
      toast({ title: "API key required", description: "Configure your API key in Settings first.", variant: "destructive" });
      return;
    }
    generateMutation.mutate({
      data: {
        description: values.description,
        targetTool: values.targetTool as "sora" | "runway" | "kling" | "pika" | "luma" | "hailuo",
        duration: values.duration || undefined,
        cameraStyle: values.cameraStyle || undefined,
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

  const copy = (text: string, which: "main" | "camera") => {
    navigator.clipboard.writeText(text);
    if (which === "main") { setCopiedMain(true); setTimeout(() => setCopiedMain(false), 2000); }
    else { setCopiedCamera(true); setTimeout(() => setCopiedCamera(false), 2000); }
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
          <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">Video Prompt Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate cinematic prompts for Sora, Runway, Kling, and more</p>
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
            <Label className="text-sm font-medium">Scene / Concept</Label>
            <Textarea
              data-testid="input-video-description"
              placeholder="Describe the video scene, mood, subjects, and action. The AI will translate it into a cinematic prompt optimized for your chosen tool..."
              className="min-h-[130px] font-mono text-sm resize-none bg-muted/40 border-border focus:border-primary/60"
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Video tools */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Tool</Label>
            <div className="grid grid-cols-2 gap-2">
              {videoTools.map((tool) => {
                const selected = form.watch("targetTool") === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    data-testid={`video-tool-${tool.id}`}
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
              <Label className="text-sm font-medium">Duration</Label>
              <Input
                data-testid="input-duration"
                placeholder="e.g. 5s, 10s, 30s"
                className="bg-muted/40 border-border text-sm font-mono"
                {...form.register("duration")}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Camera Style</Label>
              <Select onValueChange={(v) => form.setValue("cameraStyle", v)}>
                <SelectTrigger data-testid="select-camera-style" className="bg-muted/40 border-border">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  {cameraStyles.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Tips Language</Label>
            <Select onValueChange={(v) => form.setValue("language", v)} defaultValue="auto">
              <SelectTrigger data-testid="select-video-language" className="bg-muted/40 border-border">
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
            data-testid="button-generate-video"
            disabled={generateMutation.isPending || !hasSettings}
            className="w-full gap-2 font-mono"
          >
            {generateMutation.isPending ? (
              <><div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Crafting...</>
            ) : (
              <><Sparkles className="w-4 h-4" />Generate Video Prompt</>
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
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-24 w-full" />
            </motion.div>
          ) : result ? (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-5">
              {/* Main prompt */}
              <Card className="border-primary/20 bg-card">
                <CardHeader className="pb-2 flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-mono text-primary">Video Prompt</CardTitle>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copy(result.prompt, "main")} data-testid="button-copy-video" className="gap-1.5 text-xs font-mono h-7">
                    {copiedMain ? <><Check className="w-3 h-3 text-chart-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                  </Button>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed" data-testid="text-video-prompt">{result.prompt}</pre>
                </CardContent>
              </Card>

              {/* Camera directions */}
              {result.cameraDirections && (
                <Card className="border-chart-4/20 bg-card">
                  <CardHeader className="pb-2 flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-chart-4" />
                      <CardTitle className="text-sm font-mono text-chart-4">Camera Directions</CardTitle>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copy(result.cameraDirections, "camera")} className="gap-1.5 text-xs font-mono h-7">
                      {copiedCamera ? <><Check className="w-3 h-3 text-chart-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm font-mono text-muted-foreground leading-relaxed">{result.cameraDirections}</pre>
                  </CardContent>
                </Card>
              )}

              {/* Technical spec */}
              {result.technicalSpec && (
                <Card className="border-chart-2/20 bg-card">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-chart-2" />
                      <CardTitle className="text-sm font-mono text-chart-2">Technical Spec</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap text-sm font-mono text-muted-foreground leading-relaxed">{result.technicalSpec}</pre>
                  </CardContent>
                </Card>
              )}

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <Card className="border-border bg-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-mono text-muted-foreground">Tool Tips & Limitations</CardTitle>
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
              <div className="w-16 h-16 rounded-2xl bg-chart-1/10 border border-chart-1/20 flex items-center justify-center">
                <Video className="w-7 h-7 text-chart-1" />
              </div>
              <div>
                <h3 className="font-mono font-semibold text-foreground">Video prompt generator</h3>
                <p className="text-sm text-muted-foreground mt-1">Select a tool and describe your scene to get a cinematic prompt</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
