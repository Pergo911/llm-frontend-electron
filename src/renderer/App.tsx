import {
  MemoryRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import './App.global.css';
import 'tailwindcss/tailwind.css';
import { toast, Toaster } from 'sonner';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ModelsController,
  OpenRouterModel,
  ResolvedChat,
  ResolvedFolder,
  ResolvedPrompt,
  SaveFileController,
} from '@/common/types';
import { LoaderCircle, LoaderIcon } from 'lucide-react';
import { SidebarInset, SidebarProvider } from './components/ui/sidebar';
import { AppSidebar } from './components/app-sidebar';
import { ThemeProvider } from './components/theme-provider';
import HomePage from './components/home-page';
import ChatPage from './components/chat-page';
import PromptPage from './components/prompt-page';
import TitleBar from './components/title-bar';
import { TooltipProvider } from './components/ui/tooltip';

import useSaveFile from './hooks/use-savefile';
import { Button } from './components/ui/button';
import { useModels } from './hooks/use-models';
import { Dialog, DialogTrigger } from './components/ui/dialog';
import { SettingsModal } from './components/modal-settings';

function AppRoutes({
  chats,
  prompts,
  folders,
  controller,
  modelSelection,
  modelsController,
}: {
  chats: ResolvedChat[];
  prompts: ResolvedPrompt[];
  folders: ResolvedFolder[];
  controller: SaveFileController;
  modelSelection: OpenRouterModel[] | null;
  modelsController: ModelsController;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const id = pathname.split('/').pop();

  const chat = useMemo(
    () => (id ? chats.find((c) => c.id === id) : undefined),
    [id, chats],
  );
  const prompt = useMemo(
    () => (id ? prompts.find((p) => p.id === id) : undefined),
    [id, prompts],
  );

  useEffect(() => {
    if (!chat && !prompt) {
      // If no chat or prompt is found, navigate to home
      navigate('/');
    }
  }, [chat, prompt, navigate]);

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
      <Route
        path="/"
        element={<HomePage controller={controller} folders={folders} />}
      />
      <Route path="/c">
        <Route
          path=":id"
          element={
            chat ? (
              <ChatPage
                chat={chat}
                prompts={prompts}
                folders={folders}
                controller={controller}
                modelSelection={modelSelection}
                toggleReasoningPreference={
                  modelsController.toggleReasoningPreference
                }
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-t-3xl bg-background">
                <LoaderCircle className="animate-spin text-foreground" />
              </div>
            )
          }
        />
      </Route>
      <Route path="/p">
        <Route
          path=":id"
          element={
            prompt ? (
              <PromptPage
                prompt={prompt}
                folders={folders}
                controller={controller}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-t-3xl bg-background">
                <LoaderCircle className="animate-spin text-foreground" />
              </div>
            )
          }
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  const { loading, chats, prompts, folders, controller, error } = useSaveFile();
  const {
    models,
    modelSelection,
    controller: modelsController,
    error: modelsError,
    loading: modelsLoading,
  } = useModels();

  const [welcomeScreenSettingsOpen, setWelcomeScreenSettingsOpen] =
    useState(false);

  useEffect(() => {
    if (error) {
      toast.error(`Error loading savefile: ${error}`);
    }
  }, [error]);

  // Let's satisfy TypeScript
  const saveFileMissing = !chats || !prompts || !folders;

  return (
    <MemoryRouter>
      <ThemeProvider>
        <TooltipProvider skipDelayDuration={0}>
          {/* Invisible drag handle */}
          <div className="draggable pointer-events-auto fixed left-0 right-0 top-0 z-50 h-[48px] bg-transparent" />
          {error || loading || saveFileMissing ? (
            // Welcome screen if savefile is missing or loading
            <div className="fixed inset-0 z-50 flex items-center justify-around bg-background">
              <div>
                {loading ? (
                  <h2 className="animate-pulse text-3xl text-foreground">
                    Loading your savefile...
                  </h2>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-foreground">
                      Welcome!
                    </h2>
                    <p className="my-2">
                      We couldn&apos;t load a savefile. Please check your
                      settings.
                    </p>
                  </>
                )}
              </div>
              <Dialog
                open={welcomeScreenSettingsOpen}
                onOpenChange={setWelcomeScreenSettingsOpen}
              >
                <DialogTrigger asChild>
                  <Button size="lg">Open Settings</Button>
                </DialogTrigger>
                <SettingsModal
                  triggerRefresh={controller.saveFile.reload}
                  onSetOpen={setWelcomeScreenSettingsOpen}
                  open={welcomeScreenSettingsOpen}
                />
              </Dialog>
            </div>
          ) : (
            <SidebarProvider>
              <AppSidebar
                chats={chats}
                prompts={prompts}
                folders={folders}
                controller={controller}
                modelsController={modelsController}
              />
              <SidebarInset className="min-w-0 bg-background-dim">
                <TitleBar
                  chats={chats}
                  prompts={prompts}
                  folders={folders}
                  modelsController={modelsController}
                  saveFileController={controller}
                  loading={modelsLoading}
                  modelsError={modelsError}
                  models={models}
                />
                <AppRoutes
                  chats={chats}
                  prompts={prompts}
                  controller={controller}
                  folders={folders}
                  modelSelection={modelSelection}
                  modelsController={modelsController}
                />
              </SidebarInset>
            </SidebarProvider>
          )}
        </TooltipProvider>
        <Toaster position="bottom-center" />
      </ThemeProvider>
    </MemoryRouter>
  );
}
