import { MemoryRouter, Routes, Route } from 'react-router-dom';
import './App.global.css';
import 'tailwindcss/tailwind.css';
import { Toaster } from 'sonner';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { ThemeProvider } from './components/theme-provider';
import HomePage from './components/home-page';
import ChatPage from './components/chat-page';
import PromptPage from './components/prompt-page';

export default function App() {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-sidebar">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/c">
                <Route path=":id" element={<ChatPage />} />
              </Route>
              <Route path="/p">
                <Route path=":id" element={<PromptPage />} />
              </Route>
            </Routes>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
      <Toaster />
    </MemoryRouter>
  );
}
