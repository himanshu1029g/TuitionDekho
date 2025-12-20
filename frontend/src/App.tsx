import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import SearchResults from "./pages/SearchResults";
import TeacherProfile from "./pages/TeacherProfile";
import NotFound from "./pages/NotFound";

import ResetPassword from "./reset/ResetPassword";
import ForgotPassword from "./reset/ForgotPassword";
import ChatLayout from "./pages/ChatLayout";

/* ✅ ADD THIS */
import SocketEvents from "@/components/SocketEvents";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      {/* ✅ GLOBAL SOCKET LISTENER (VERY IMPORTANT) */}
      <SocketEvents />

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/teacher/:id" element={<TeacherProfile />} />
        <Route path="/chat/" element={<ChatLayout />} />

        {/* Reset password routes */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
