import { MemoryRouter, Routes, Route } from 'react-router-dom';
import './App.global.css';

import 'tailwindcss/tailwind.css';
import { Button } from './components/ui/button';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from './components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { ThemeProvider } from './components/theme-provider';

function MainPage() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col gap-4 items-center justify-center h-screen">
            <SidebarTrigger className="absolute top-2 left-2" />
            <div className="text-3xl font-bold">Welcome!</div>
            <div className="flex flex-col gap-2 w-44">
              <Button className="rounded-md">New Chat</Button>
              <Button variant="outline">Prompts</Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
      </Routes>
    </MemoryRouter>
  );
}
