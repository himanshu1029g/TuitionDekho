import React from 'react'
// import TeacherProfile from './pages/TeacherProfile'

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import SearchResults from "./pages/SearchResults";
import TeacherProfile from "./pages/TeacherProfile";
import NotFound from "./pages/NotFound";
import { UserProvider } from "./contexts/UserContext";
import TeacherCard from './components/TeacherCard';

const queryClient = new QueryClient();


const Try = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
          {/* <Route path="/teacher/:id" element={<TeacherCard />} /> */}
            <Route path="/student" element={<StudentDashboard />} />
            <Route path="/teacher" element={<TeacherDashboard />} />

          </Routes>
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default Try




































/*
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherDashboard from "./pages/TeacherDashboard";
import SearchResults from "./pages/SearchResults";
import TeacherProfile from "./pages/TeacherProfile";
import NotFound from "./pages/NotFound";
import { UserProvider } from "./contexts/UserContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/student-dashboard" element={<TeacherProfile />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/teacher/:id" element={<TeacherProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
*/