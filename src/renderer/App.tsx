import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import './App.global.css';
import 'tailwindcss/tailwind.css';
import { Toaster } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
import { AppSidebar, RefreshRef } from './components/app-sidebar';
import { ThemeProvider } from './components/theme-provider';
import HomePage from './components/home-page';
import ChatPage from './components/chat-page';
import PromptPage from './components/prompt-page';
import TitleBar from './components/title-bar';
import { TooltipProvider } from './components/ui/tooltip';

import { RefreshContext } from './hooks/use-refresh';

function AppRoutes({ refreshKey }: { refreshKey: number }) {
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
      <Route path="/" element={<HomePage key={refreshKey} />} />
      <Route path="/c">
        <Route path=":id" element={<ChatPage key={refreshKey} />} />
      </Route>
      <Route path="/p">
        <Route path=":id" element={<PromptPage key={refreshKey} />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const sidebarRef = useRef<RefreshRef>(null);
  const titlebarRef = useRef<RefreshRef>(null);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
    sidebarRef.current?.refresh();
    titlebarRef.current?.refresh();
  }, []);

  useEffect(() => {
    const handleRefreshShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
        e.preventDefault();
        refresh();
      }
    };

    window.addEventListener('keydown', handleRefreshShortcut);
    return () => window.removeEventListener('keydown', handleRefreshShortcut);
  }, [refresh]);

  window.addEventListener('beforeunload', (ev) => {
    // Setting any value other than
    // undefined here will prevent the
    // window from closing or reloading
    // https://stackoverflow.com/questions/51187602/electron-js-prevent-refresh-for-created-window
    // ev.returnValue = true;
  });

  return (
    <RefreshContext.Provider value={refresh}>
      <MemoryRouter>
        <ThemeProvider>
          <TooltipProvider skipDelayDuration={0}>
            <SidebarProvider>
              <AppSidebar ref={sidebarRef} />
              <SidebarInset className="min-w-0 bg-sidebar">
                <TitleBar ref={titlebarRef} />
                <AppRoutes refreshKey={refreshKey} />
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster />
        {/* <ScrollRestoration /> */}
      </MemoryRouter>
    </RefreshContext.Provider>
  );
}
