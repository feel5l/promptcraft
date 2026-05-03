import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import TextPrompt from "@/pages/text-prompt";
import ImagePrompt from "@/pages/image-prompt";
import VideoPrompt from "@/pages/video-prompt";
import OptimizePage from "@/pages/optimize";
import SettingsPage from "@/pages/settings";
import GuidePage from "@/pages/guide";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={TextPrompt} />
        <Route path="/image" component={ImagePrompt} />
        <Route path="/video" component={VideoPrompt} />
        <Route path="/optimize" component={OptimizePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/guide" component={GuidePage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
