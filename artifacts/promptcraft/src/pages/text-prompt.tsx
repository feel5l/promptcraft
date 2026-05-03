import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Sparkles, Clock, ChevronDown, ChevronUp, AlertCircle, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGenerateTextPrompt } from "@workspace/api-client-react";
import { useSettings } from "@/hooks/use-settings";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  task: z.string().min(10, "Please describe your task in at least 10 characters"),
  domain: z.string().min(1, "Please select a domain"),
  technique: z.string().min(1, "Please select a technique"),
  language: z.string().default("auto"),
});

type FormValues = z.infer<typeof formSchema>;

const domains = [
  "Software Development", "Creative Writing", "Data Analysis", "Marketing & Copywriting",
  "Research & Academic", "Business Strategy", "Customer Support", "Education & Teaching",
  "Legal & Compliance", "Healthcare & Medical", "Design & UX", "Product Management",
  "Finance & Accounting", "Human Resources", "Content Creation", "Translation",
  "Image Generation", "Video Production", "Music & Audio", "Other",
];

const techniques = [
  { id: "auto", label: "Auto (AI Selects Best)", color: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  { id: "zero-shot", label: "Zero-Shot", color: "bg-primary/20 text-primary border-primary/30" },
  { id: "few-shot", label: "Few-Shot", color: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
  { id: "chain-of-thought", label: "Chain-of-Thought", color: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  { id: "role", label: "Role Prompting", color: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
  { id: "xml-tags", label: "XML Tags", color: "bg-chart-5/20 text-chart-5 border-chart-5/30" },
];

interface HistoryItem {
  id: string;
  task: string;
  prompt: string;
  technique: string;
  score: number;
}

function isHistoryItem(item: unknown): item is HistoryItem {
  if (!item || typeof item !== "object") return false;
  const h = item as Record<string, unknown>;
  return (
    typeof h.id === "string" &&
    typeof h.task === "string" &&
    typeof h.prompt === "string" &&
    typeof h.technique === "string" &&
    typeof h.score === "number"
  );
}

function loadHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem("promptcraft_history");
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryItem);
  } catch {
    return [];
  }
}

export default function TextPromptPage() {
  const { settings } = useSettings();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [mobileTab, setMobileTab] = useState<"input" | "output">("input");
  const [result, setResult] = useState<{
    prompt: string;
    technique: string;
    explanation: { label: string; content: string; purpose: string }[];
    qualityScore: { clarity: number; detail: number; actionability: number; overall: number; feedback: string };
    tokensUsed?: number;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem("promptcraft_history", JSON.stringify(history));
    } catch {
      // ignore quota errors
    }
  }, [history]);

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const generateMutation = useGenerateTextPrompt();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { task: "", domain: "", technique: "auto", language: "auto" },
  });

  const hasSettings = settings.apiKey && settings.provider && settings.model;

  const onSubmit = (values: FormValues) => {
    if (!hasSettings) {
      toast({ title: "API key required", description: "Configure your API key in Settings first.", variant: "destructive" });
      return;
    }
    generateMutation.mutate(
      {
        data: {
          task: values.task,
          domain: values.domain,
          technique: values.technique as "zero-shot" | "few-shot" | "chain-of-thought" | "role" | "xml-tags" | "auto",
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.apiKey,
          language: values.language as "ar" | "en" | "auto",
        },
      },
      {
        onSuccess: (data) => {
          setResult(data);
          setHistory((prev) => [
            { id: Date.now().toString(), task: values.task, prompt: data.prompt, technique: data.technique, score: data.qualityScore.overall },
            ...prev.slice(0, 9),
          ]);
        },
        onError: (err: Error) => {
          toast({ title: "Generation failed", description: err.message, variant: "destructive" });
        },
      }
    );
  };

  useEffect(() => {
    if (generateMutation.isPending || result) setMobileTab("output");
  }, [generateMutation.isPending, result]);

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
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
      {/* Left panel — input */}
      <div className={`w-full lg:w-[420px] lg:max-w-[420px] flex flex-col lg:border-r border-border overflow-y-auto ${mobileTab === "output" ? "hidden lg:flex" : ""}`}>
        <div className="p-6 border-b border-border">
          <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">Text Prompt Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate expert-quality prompts using modern techniques</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5 p-6">
          {!hasSettings && (
            <div className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-destructive-foreground">
                API key not set.{" "}
                <Link href="/settings" className="underline text-primary">Configure in Settings</Link>
              </span>
            </div>
          )}

          {/* Task */}
          <div className="space-y-2">
            <Label htmlFor="task" className="text-sm font-medium text-foreground">Task Description</Label>
            <Textarea
              id="task"
              data-testid="input-task"
              placeholder="Describe what you want the AI to do. Be specific about the goal, context, and desired output..."
              className="min-h-[120px] font-mono text-sm resize-none bg-muted/40 border-border focus:border-primary/60"
              {...form.register("task")}
            />
            {form.formState.errors.task && (
              <p className="text-xs text-destructive">{form.formState.errors.task.message}</p>
            )}
          </div>

          {/* Domain */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Domain</Label>
            <Select onValueChange={(v) => form.setValue("domain", v)} defaultValue="">
              <SelectTrigger data-testid="select-domain" className="bg-muted/40 border-border">
                <SelectValue placeholder="Select a domain..." />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.domain && (
              <p className="text-xs text-destructive">{form.formState.errors.domain.message}</p>
            )}
          </div>

          {/* Technique */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Technique</Label>
            <div className="flex flex-wrap gap-2">
              {techniques.map((t) => {
                const selected = form.watch("technique") === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    data-testid={`technique-${t.id}`}
                    onClick={() => form.setValue("technique", t.id)}
                    className={`px-3 py-1.5 rounded-md border text-xs font-mono font-medium transition-all ${
                      selected ? t.color : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Output Language</Label>
            <Select onValueChange={(v) => form.setValue("language", v)} defaultValue="auto">
              <SelectTrigger data-testid="select-language" className="bg-muted/40 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (detect from input)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            data-testid="button-generate"
            disabled={generateMutation.isPending || !hasSettings}
            className="w-full gap-2 font-mono"
          >
            {generateMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Prompt
              </>
            )}
          </Button>
        </form>

        {/* History */}
        {history.length > 0 && (
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">History</span>
            </div>
            <div className="space-y-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="w-full text-left rounded-md bg-muted/40 hover:bg-muted/70 transition-colors border border-border/50 group"
                >
                  <div className="flex items-start px-3 py-2">
                    <button
                      data-testid={`history-item-${item.id}`}
                      onClick={() => setResult({ prompt: item.prompt, technique: item.technique, explanation: [], qualityScore: { clarity: item.score, detail: item.score, actionability: item.score, overall: item.score, feedback: "" } })}
                      className="flex-1 min-w-0 text-left"
                    >
                      <p className="text-xs font-mono text-foreground truncate">{item.task}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{item.technique}</span>
                        <span className="text-xs text-primary">Score: {item.score}/10</span>
                      </div>
                    </button>
                    <button
                      data-testid={`history-delete-${item.id}`}
                      onClick={() => deleteHistoryItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-destructive p-1 rounded hover:bg-destructive/20 hover:text-destructive focus:bg-destructive/20 focus:text-destructive text-muted-foreground transition-all shrink-0 mt-0.5"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right panel — output */}
      <div className={`flex flex-1 flex-col overflow-y-auto ${mobileTab === "input" ? "hidden lg:flex" : "flex"}`}>
        <AnimatePresence mode="wait">
          {generateMutation.isPending ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-40 w-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-6 space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="font-mono text-xs" variant="outline">{result.technique}</Badge>
                  {result.tokensUsed && (
                    <span className="text-xs text-muted-foreground font-mono">{result.tokensUsed} tokens</span>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={copyToClipboard} data-testid="button-copy" className="gap-2 font-mono text-xs">
                  {copied ? <><Check className="w-3.5 h-3.5 text-chart-3" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </Button>
              </div>

              {/* Prompt output */}
              <Card className="border-primary/20 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono text-primary">Generated Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm font-mono text-foreground leading-relaxed" data-testid="text-generated-prompt">
                    {result.prompt}
                  </pre>
                </CardContent>
              </Card>

              {/* Quality score */}
              {result.qualityScore && (
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-mono text-muted-foreground">Quality Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { label: "Clarity", value: result.qualityScore.clarity },
                      { label: "Detail", value: result.qualityScore.detail },
                      { label: "Actionability", value: result.qualityScore.actionability },
                      { label: "Overall", value: result.qualityScore.overall },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-24">{label}</span>
                        <Progress value={value * 10} className="flex-1 h-1.5" />
                        <span className="text-xs font-mono text-primary w-8 text-right">{value}/10</span>
                      </div>
                    ))}
                    {result.qualityScore.feedback && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                        {result.qualityScore.feedback}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Explanation */}
              {result.explanation && result.explanation.length > 0 && (
                <Card className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-mono text-muted-foreground">Prompt Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.explanation.map((section, idx) => (
                      <div key={idx} className="border border-border/50 rounded-md overflow-hidden">
                        <button
                          onClick={() => toggleSection(idx)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                        >
                          <span className="text-xs font-mono font-medium text-foreground">{section.label}</span>
                          {expandedSections.has(idx) ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </button>
                        {expandedSections.has(idx) && (
                          <div className="px-3 pb-3 space-y-2 border-t border-border/50 bg-muted/20">
                            <p className="text-xs font-mono text-foreground mt-2 leading-relaxed">{section.content}</p>
                            <p className="text-xs text-muted-foreground italic">{section.purpose}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-mono font-semibold text-foreground">Ready to generate</h3>
                <p className="text-sm text-muted-foreground mt-1">Fill in the form and click Generate to create your expert prompt</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
