import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import './App.global.css';

import 'tailwindcss/tailwind.css';
import { Toaster } from 'sonner';
import { Button } from './components/ui/button';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from './components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { ThemeProvider } from './components/theme-provider';

function HomePage() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <SidebarTrigger className="absolute top-2 left-2" />
      <div className="text-3xl font-bold">Welcome!</div>
      <div className="flex flex-col gap-2 w-44">
        <Button className="rounded-md" asChild>
          <Link to="/chat">New Chat</Link>
        </Button>
        <Button variant="outline">Prompts</Button>
      </div>
    </div>
  );
}

function ChatPage() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <SidebarTrigger className="absolute top-2 left-2" />
      <div className="text-3xl font-bold">Chat</div>
    </div>
  );
}

export default function App() {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Routes>
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
      <Toaster />
    </MemoryRouter>
  );
}
