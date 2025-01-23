import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import './App.global.css';
import 'tailwindcss/tailwind.css';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { ThemeProvider } from './components/theme-provider';
import HomePage from './components/home-page';
import ChatPage from './components/chat-page';
import PromptPage from './components/prompt-page';

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Alt + Left/Right Arrow for navigation
      if (e.altKey) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            navigate(-1);
            break;
          case 'ArrowRight':
            e.preventDefault();
            navigate(1);
            break;
          default:
            break;
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Handle mouse back/forward buttons for navigation
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        if (e.button === 3) {
          navigate(-1); // Back
        } else {
          navigate(1); // Forward
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/c">
        <Route path=":id" element={<ChatPage />} />
      </Route>
      <Route path="/p">
        <Route path=":id" element={<PromptPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-sidebar">
            <AppRoutes />
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
      <Toaster />
    </MemoryRouter>
  );
}
