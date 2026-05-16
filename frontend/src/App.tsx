import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import MovieDetail from "./pages/MovieDetail.tsx";
import Lists from "./pages/Lists.tsx";
import ListDetail from "./pages/ListDetail.tsx";
import Profile from "./pages/Profile.tsx";
import Register from "./pages/Register.tsx";
import Login from "./pages/Login.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import RatedMovies from "./pages/RatedMovies.tsx";
import UserComments from "./pages/UserComments.tsx";
import NotFound from "./pages/NotFound.tsx";
import UserLists from "./pages/UserLists.tsx";
import UserListDetail from "./pages/UserListDetails.tsx";
import UserRatedMovies from "./pages/UserRatedMovies.tsx";
import UserCommentsPage from "./pages/UserCommentsPage.tsx";
import ProtectedRoute from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/listas" element={<ProtectedRoute><Lists /></ProtectedRoute>} />
          <Route path="/listas/:id" element={<ProtectedRoute><ListDetail /></ProtectedRoute>} />
          <Route path="/filmes-avaliados" element={<ProtectedRoute><RatedMovies /></ProtectedRoute>} />
          <Route path="/comentarios" element={<ProtectedRoute><UserComments /></ProtectedRoute>} />
          <Route path="/usuario/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/usuario/:username/filmes-avaliados" element={<ProtectedRoute><UserRatedMovies /></ProtectedRoute>} />
          <Route path="/usuario/:username/listas" element={<ProtectedRoute><UserLists /></ProtectedRoute>} />
          <Route path="/usuario/:username/listas/:id" element={<ProtectedRoute><UserListDetail /></ProtectedRoute>} />
          <Route path="/usuario/:username/comentarios" element={<ProtectedRoute><UserCommentsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;