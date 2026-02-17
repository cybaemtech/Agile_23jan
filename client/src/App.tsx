import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetails from "@/pages/project-details";
import Teams from "@/pages/teams";
import TeamDetails from "@/pages/team-details";
import Timeline from "@/pages/timeline";
import Reports from "@/pages/reports";
import ReportBug from "@/pages/report-bug";
import ProjectBugReports from "@/pages/project-bug-reports";
import DailyStandup from "@/pages/standup";
import LoginPage from "@/pages/login";
import Register from "@/pages/register";
import StrategicRoadmap from "@/pages/strategic-roadmap";
import { useAuth } from "./hooks/useAuth";
import { useSessionHeartbeat } from "./hooks/useSessionHeartbeat";
import { useSessionWarning } from "./hooks/useSessionWarning";
import { useEffect } from "react";


function Routes() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading, isError, isUnauthenticated } = useAuth();
  
  // Keep session alive during user activity
  useSessionHeartbeat(isAuthenticated);
  
  // Warn user about session expiry
  useSessionWarning(isAuthenticated, user);

  console.log('[Routes] Auth state:', { isAuthenticated, isUnauthenticated, isLoading, location });

  // TEMPORARY: Login bypass - redirect root to dashboard
  useEffect(() => {
    if (location === "/") {
      setLocation("/dashboard");
    }
  }, [location, setLocation]);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={Register} />

      {/* All routes accessible without login (TEMPORARY BYPASS) */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetails} />
      <Route path="/teams" component={Teams} />
      <Route path="/teams/:id" component={TeamDetails} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/calendar" component={Timeline} />
      <Route path="/reports" component={Reports} />
      <Route path="/report-bug" component={ReportBug} />
      <Route path="/project-bug-reports" component={ProjectBugReports} />
      <Route path="/standup" component={DailyStandup} />
      <Route path="/roadmap" component={StrategicRoadmap} />

      {/* Catch all */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const base = '/';
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen">
          <Toaster />
          <WouterRouter base={base}>
            <Routes />
          </WouterRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
