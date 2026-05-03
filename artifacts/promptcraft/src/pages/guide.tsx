import { motion } from "framer-motion";
import { BookOpen, Zap, List, GitBranch, User, Tag, Image as ImageIcon, Video } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const techniques = [
  {
    id: "zero-shot",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10 border-primary/20",
    title: "Zero-Shot",
    description: "Direct instruction with no examples. The model uses its pre-trained knowledge to complete the task.",
    when: "Clear, well-defined tasks where the format is obvious.",
    example: `You are an expert technical writer. Write a concise API documentation for a function that accepts a list of integers and returns their median value. Include: function signature, parameters, return value, edge cases, and a code example.`,
    tips: ["Be specific and precise", "Define the exact output format", "Include constraints and edge cases"],
  },
  {
    id: "few-shot",
    icon: List,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10 border-chart-1/20",
    title: "Few-Shot",
    description: "Include 2-5 examples to set the expected pattern, tone, and output format before the actual task.",
    when: "Formatting tasks, style matching, classification, or when consistency matters.",
    example: `Classify the sentiment of each review as Positive, Negative, or Neutral.

Review: "The product arrived on time and works perfectly!"
Sentiment: Positive

Review: "Terrible quality, broke after one day."
Sentiment: Negative

Review: "It's okay, nothing special."
Sentiment: Neutral

Review: "Best purchase I've made this year, highly recommend!"
Sentiment:`,
    tips: ["Use 2-5 examples (more isn't always better)", "Examples should cover edge cases", "Maintain consistent formatting"],
  },
  {
    id: "chain-of-thought",
    icon: GitBranch,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10 border-chart-3/20",
    title: "Chain-of-Thought (CoT)",
    description: "Ask the model to reason step-by-step before giving the final answer. Dramatically improves accuracy on complex tasks.",
    when: "Math problems, logical reasoning, multi-step analysis, debugging, planning.",
    example: `You are a senior software architect. A user reports their React app becomes slow after 50+ items are added to a list. 

Think through this step by step:
1. First, identify the most likely root causes of this symptom
2. For each cause, explain what's happening technically
3. Rank the causes by likelihood
4. Propose a concrete solution for the top cause with code

Reasoning:`,
    tips: ["Use 'Think step by step' or 'Let's reason through this'", "Add explicit checkpoints", "Works best with capable models"],
  },
  {
    id: "role",
    icon: User,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10 border-chart-4/20",
    title: "Role Prompting",
    description: "Assign a specific expert persona to activate deep domain knowledge, vocabulary, and reasoning patterns.",
    when: "Domain-specific tasks requiring expert-level knowledge.",
    example: `You are Dr. Sarah Chen, a computational neuroscientist with 15 years of experience in machine learning and neural plasticity research. You've published 40+ papers on synaptic learning rules and have consulted for leading AI labs.

A student asks you to explain the biological inspiration behind transformer attention mechanisms, and how it relates to actual neural circuits in the brain. Give a technically accurate but pedagogically clear explanation.`,
    tips: ["Be hyper-specific about the role (not just 'expert')", "Include relevant credentials", "The role shapes vocabulary and depth"],
  },
  {
    id: "xml-tags",
    icon: Tag,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10 border-chart-5/20",
    title: "XML Tags (Structured)",
    description: "Use XML-style tags to clearly separate different parts of the prompt. Best practice recommended by Anthropic for Claude.",
    when: "Complex prompts with multiple distinct sections, RAG applications, structured output.",
    example: `<role>
You are an expert business analyst specializing in SaaS metrics and growth strategy.
</role>

<context>
A B2B SaaS company has the following metrics:
- MRR: $450,000
- Churn rate: 3.2%/month
- CAC: $2,400
- Average contract: $800/month
</context>

<task>
Analyze these metrics and identify the top 3 areas of concern. For each concern, provide:
1. The metric that indicates the problem
2. Industry benchmark for comparison
3. One actionable recommendation
</task>

<output_format>
Respond in a structured format with clear headers for each concern.
</output_format>`,
    tips: ["Claude models respond especially well to XML tags", "Use tags to separate context, instructions, and format", "Consistent tag naming improves reliability"],
  },
];

const imageTips = [
  { tool: "Midjourney", tip: "Add --style raw for photorealism, use --chaos for variation. Parameters go at the end." },
  { tool: "DALL-E 3", tip: "Write flowing descriptive prose, not comma-separated keywords. More detail = better results." },
  { tool: "Flux", tip: "Natural language works best. Specify camera settings for photorealism (35mm, f/2.8, ISO 400)." },
  { tool: "Stable Diffusion", tip: "Always include quality tokens (masterpiece, best quality) and use negative prompts aggressively." },
  { tool: "Ideogram", tip: "Ideal for text-in-image. Specify font style, color, and placement explicitly." },
];

const videoTips = [
  { tool: "Sora", tip: "Rich cinematic descriptions work best. Include lighting, atmosphere, and time of day." },
  { tool: "Runway Gen-3", tip: "Structure: [Camera move] [Subject action] [Environment] [Lighting]. Very precise camera control." },
  { tool: "Kling", tip: "Excellent physics — describe material properties. Great for product and liquid shots." },
  { tool: "Pika", tip: "Try the Pika effects: inflate, melt, explode. Keep scenes simple and focused." },
  { tool: "Luma", tip: "Reference cinema styles: 'Shot on ARRI Alexa', 'anamorphic lens'. Photorealism-focused." },
];

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-mono font-bold text-foreground tracking-tight">Prompt Engineering Guide</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Modern techniques for getting the best results from AI systems — covering text, image, and video generation.
        </p>
      </div>

      {/* Text techniques */}
      <section>
        <h2 className="text-sm font-mono font-semibold text-muted-foreground uppercase tracking-wider mb-4">Text Prompt Techniques</h2>
        <div className="space-y-6">
          {techniques.map((tech, idx) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border bg-card ${tech.bgColor}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tech.bgColor}`}>
                      <tech.icon className={`w-4 h-4 ${tech.color}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-sm font-mono ${tech.color}`}>{tech.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{tech.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider">Best for</p>
                    <p className="text-sm text-foreground">{tech.when}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Example</p>
                    <pre className="text-xs font-mono text-foreground bg-background/60 border border-border/50 rounded-md p-3 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                      {tech.example}
                    </pre>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tech.tips.map((tip, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-border/50 text-muted-foreground font-normal">
                        {tip}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Image prompt tips */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="w-4 h-4 text-chart-4" />
          <h2 className="text-sm font-mono font-semibold text-muted-foreground uppercase tracking-wider">Image Prompt Anatomy</h2>
        </div>
        <div className="space-y-3">
          {imageTips.map(({ tool, tip }) => (
            <div key={tool} className="flex gap-3 px-4 py-3 bg-muted/30 border border-border/50 rounded-lg">
              <span className="text-xs font-mono font-semibold text-chart-4 w-32 shrink-0">{tool}</span>
              <span className="text-sm text-muted-foreground">{tip}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-xs font-mono text-primary mb-2 uppercase tracking-wider">Universal Image Formula</p>
          <p className="text-sm font-mono text-foreground leading-relaxed">
            [Subject] + [Action/Pose] + [Environment/Setting] + [Lighting] + [Camera/Lens] + [Style/Mood] + [Tool Parameters]
          </p>
        </div>
      </section>

      {/* Video prompt tips */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-4 h-4 text-chart-1" />
          <h2 className="text-sm font-mono font-semibold text-muted-foreground uppercase tracking-wider">Video Prompt Anatomy</h2>
        </div>
        <div className="space-y-3">
          {videoTips.map(({ tool, tip }) => (
            <div key={tool} className="flex gap-3 px-4 py-3 bg-muted/30 border border-border/50 rounded-lg">
              <span className="text-xs font-mono font-semibold text-chart-1 w-36 shrink-0">{tool}</span>
              <span className="text-sm text-muted-foreground">{tip}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-chart-1/5 border border-chart-1/20 rounded-lg">
          <p className="text-xs font-mono text-chart-1 mb-2 uppercase tracking-wider">Universal Video Formula</p>
          <p className="text-sm font-mono text-foreground leading-relaxed">
            [Camera movement] + [Subject + Action] + [Environment] + [Lighting/Time] + [Mood/Style] + [Duration/FPS]
          </p>
        </div>
      </section>
    </div>
  );
}
