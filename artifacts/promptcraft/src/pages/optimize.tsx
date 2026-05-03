import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy, Check, Wand2, AlertCircle, Plus, Minus, RefreshCw, LayoutList, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOptimizePrompt } from "@workspace/api-client-react";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const formSchema = z.object({
  originalPrompt: z.string().min(10, "Paste a prompt of at least 10 characters"),
  improvementGoal: z.string().min(5, "Describe your improvement goal (at least 5 characters)"),
  context: z.string().optional(),
  language: z.string().default("auto"),
});

type FormValues = z.infer<typeof formSchema>;

const changeTypeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  addition: { label: "Added", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: Plus },
  removal: { label: "Removed", color: "text-red-400 bg-red-400/10 border-red-400/20", icon: Minus },
  modification: { label: "Modified", color: "text-blue-400 bg-blue-400/10 border-blue-400/20", icon: RefreshCw },
  restructure: { label: "Restructured", color: "text-purple-400 bg-purple-400/10 border-purple-400/20", icon: LayoutList },
};

function ScoreBar({ label, before, after }: { label: string; before: number; after: number }) {
  const delta = after - before;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-mono">{before}/10</span>
          <span className="text-muted-foreground">→</span>
          <span className="text-foreground font-mono font-semibold">{after}/10</span>
          {delta > 0 && (
            <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 bg-emerald-400/10 text-[10px] px-1 py-0 h-4">
              +{delta}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 h-1.5">
        <Progress value={before * 10} className="flex-1 h-1.5 opacity-50" />
        <Progress value={after * 10} className="flex-1 h-1.5" />
      </div>
    </div>
  );
}

export default function OptimizePage() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<"input" | "output">("input");
  const [result, setResult] = useState<{
    improvedPrompt: string;
    changes: { type: string; description: string }[];
    beforeScore: { clarity: number; detail: number; actionability: number; overall: number; feedback: string };
    afterScore: { clarity: number; detail: number; actionability: number; overall: number; feedback: string };
  } | null>(null);

  const optimizeMutation = useOptimizePrompt({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Something went wrong";
        toast({ title: "Error", description: msg, variant: "destructive" });
      },
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { originalPrompt: "", improvementGoal: "", context: "", language: "auto" },
  });

  const onSubmit = (values: FormValues) => {
    if (!settings.apiKey || !settings.provider || !settings.model) {
      toast({ title: "API key required", description: "Configure your API key in Settings.", variant: "destructive" });
      return;
    }
    setResult(null);
    optimizeMutation.mutate({
      data: {
        originalPrompt: values.originalPrompt,
        improvementGoal: values.improvementGoal,
        context: values.context || undefined,
        provider: settings.provider,
        model: settings.model,
        apiKey: settings.apiKey,
        language: values.language,
      },
    });
  };

  useEffect(() => {
    if (optimizeMutation.isPending || result) setMobileTab("output");
  }, [optimizeMutation.isPending, result]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.improvedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden">
      {/* Mobile tab switcher */}
      <div className="lg:hidden flex border-b border-border bg-background sticky top-14 md:top-0 z-10">
        <button type="button" onClick={() => setMobileTab("input")} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mobileTab === "input" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Input</button>
        <button type="button" onClick={() => setMobileTab("output")} className={`flex-1 py-3 text-sm font-medium border-b-2 transition-all relative ${mobileTab === "output" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
          Output
          {(optimizeMutation.isPending || result) && mobileTab === "input" && <span className="absolute top-2.5 right-8 w-2 h-2 rounded-full bg-primary animate-pulse" />}
        </button>
      </div>
      <div className="flex flex-1 lg:flex-row lg:overflow-hidden">
      {/* Left panel — input form */}
      <div className={`w-full lg:w-[420px] lg:max-w-[420px] flex flex-col lg:border-r border-border overflow-y-auto ${mobileTab === "output" ? "hidden lg:flex" : ""}`}>
        <div className="p-6 border-b border-border">
          <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">Prompt Optimizer</h1>
          <p className="text-sm text-muted-foreground mt-1">Paste an existing prompt and get an improved version with a detailed changelog</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6 flex-1">
          {!settings.apiKey && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>API key not set. <Link href="/settings" className="underline underline-offset-2">Configure in Settings</Link></span>
            </div>
          )}

          {/* Original Prompt */}
          <div className="space-y-2">
            <Label htmlFor="originalPrompt">Original Prompt</Label>
            <Textarea
              id="originalPrompt"
              data-testid="textarea-original-prompt"
              placeholder="Paste the prompt you want to improve here..."
              rows={7}
              className="font-mono text-sm resize-none"
              {...form.register("originalPrompt")}
            />
            {form.formState.errors.originalPrompt && (
              <p className="text-xs text-destructive">{form.formState.errors.originalPrompt.message}</p>
            )}
          </div>

          {/* Improvement Goal */}
          <div className="space-y-2">
            <Label htmlFor="improvementGoal">What should be improved?</Label>
            <Textarea
              id="improvementGoal"
              data-testid="textarea-improvement-goal"
              placeholder="e.g. Make it more specific, add output format constraints, reduce ambiguity, add a persona..."
              rows={3}
              className="resize-none"
              {...form.register("improvementGoal")}
            />
            {form.formState.errors.improvementGoal && (
              <p className="text-xs text-destructive">{form.formState.errors.improvementGoal.message}</p>
            )}
          </div>

          {/* Optional context */}
          <div className="space-y-2">
            <Label htmlFor="context" className="flex items-center gap-1.5">
              Additional Context <span className="text-muted-foreground text-xs font-normal">(optional)</span>
            </Label>
            <Textarea
              id="context"
              data-testid="textarea-context"
              placeholder="e.g. This prompt is for GPT-4 in a customer support chatbot for a SaaS product..."
              rows={2}
              className="resize-none"
              {...form.register("context")}
            />
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label>Output Language</Label>
            <Select
              value={form.watch("language")}
              onValueChange={(v) => form.setValue("language", v)}
            >
              <SelectTrigger data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (match original)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic (العربية)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={optimizeMutation.isPending}
            className="w-full mt-auto"
            data-testid="button-optimize"
          >
            {optimizeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Wand2 className="w-4 h-4" />
                </motion.div>
                Optimizing…
              </span>
            ) : (
              <span className="flex items-center gap-2"><Wand2 className="w-4 h-4" /> Optimize Prompt</span>
            )}
          </Button>
        </form>
      </div>

      {/* Right panel — output */}
      <div className={`flex flex-1 flex-col overflow-y-auto ${mobileTab === "input" ? "hidden lg:flex" : "flex"}`}>
        <AnimatePresence mode="wait">
          {optimizeMutation.isPending ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
              <Skeleton className="h-5 w-48" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
              </div>
              <Skeleton className="h-5 w-32" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
              </div>
              <Skeleton className="h-5 w-40" />
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-6 w-full rounded" />)}
              </div>
            </motion.div>
          ) : result ? (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 space-y-6">
              {/* Improved Prompt */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-primary" /> Improved Prompt
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    data-testid="button-copy-improved"
                    className="h-7 gap-1.5 text-xs"
                  >
                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </Button>
                </div>
                <div className="relative group">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words bg-muted/40 border border-border rounded-lg p-4 leading-relaxed text-foreground">
                    {result.improvedPrompt}
                  </pre>
                </div>
              </div>

              {/* Changelog */}
              {result.changes.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <LayoutList className="w-4 h-4 text-primary" /> Changelog
                    <Badge variant="outline" className="text-xs ml-1">{result.changes.length} change{result.changes.length !== 1 ? "s" : ""}</Badge>
                  </h2>
                  <div className="space-y-2">
                    {result.changes.map((change, i) => {
                      const cfg = changeTypeConfig[change.type] ?? changeTypeConfig.modification;
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`flex items-start gap-2.5 p-3 rounded-md border text-sm ${cfg.color}`}
                        >
                          <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-[11px] uppercase tracking-wider block mb-0.5 opacity-80">
                              {cfg.label}
                            </span>
                            <span className="text-foreground text-xs leading-relaxed">{change.description}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Score Comparison */}
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Quality Score Comparison
                </h2>

                <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
                  {/* Overall badges */}
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Before</p>
                      <div className="text-2xl font-mono font-bold text-muted-foreground">{result.beforeScore.overall}<span className="text-sm font-normal">/10</span></div>
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="flex-1 text-center">
                      <p className="text-xs text-muted-foreground mb-1">After</p>
                      <div className="text-2xl font-mono font-bold text-primary">{result.afterScore.overall}<span className="text-sm font-normal text-muted-foreground">/10</span></div>
                    </div>
                    {result.afterScore.overall > result.beforeScore.overall && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30 text-xs">
                        +{result.afterScore.overall - result.beforeScore.overall} pts
                      </Badge>
                    )}
                  </div>

                  {/* Dimension bars */}
                  <div className="space-y-3">
                    <ScoreBar label="Clarity" before={result.beforeScore.clarity} after={result.afterScore.clarity} />
                    <ScoreBar label="Detail" before={result.beforeScore.detail} after={result.afterScore.detail} />
                    <ScoreBar label="Actionability" before={result.beforeScore.actionability} after={result.afterScore.actionability} />
                  </div>
                </div>

                {/* Feedback */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/20 border border-border rounded-md p-3">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Before</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{result.beforeScore.feedback}</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-3">
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">After</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{result.afterScore.feedback}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Wand2 className="w-7 h-7 text-primary/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Paste a prompt to improve it</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  The optimizer will critique your prompt, apply targeted improvements, and show you exactly what changed — and why.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
