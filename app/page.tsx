"use client";

import { MemoryRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./globals.css";
import "tailwindcss/tailwind.css";
import { toast, Toaster } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModelsController, OpenRouterModel, ResolvedChat, ResolvedFolder, ResolvedPrompt, SaveFileController } from "@/utils/types";
import { LoaderCircle, LoaderIcon } from "lucide-react";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function AppRoutes({
  chats,
  prompts,
  folders,
  controller,
  modelSelection,
  modelsController,
  isStreaming,
  setIsStreaming,
}: {
  chats: ResolvedChat[];
  prompts: ResolvedPrompt[];
  folders: ResolvedFolder[];
  controller: SaveFileController;
  modelSelection: OpenRouterModel[] | null;
  modelsController: ModelsController;
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const id = pathname.split("/").pop();

  const chat = useMemo(() => (id ? chats.find((c) => c.id === id) : undefined), [id, chats]);
  const prompt = useMemo(() => (id ? prompts.find((p) => p.id === id) : undefined), [id, prompts]);

  useEffect(() => {
    if (!chat && !prompt) {
      // If no chat or prompt is found, navigate to home
      navigate("/");
    }
  }, [chat, prompt, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Alt + Left/Right Arrow for navigation
      if (e.altKey) {
        switch (e.key) {
          case "ArrowLeft":
            e.preventDefault();
            if (isStreaming) {
              toast.warning("Can't navigate while generating.");
            } else {
              navigate(-1);
            }
            break;
          case "ArrowRight":
            e.preventDefault();
            if (isStreaming) {
              toast.warning("Can't navigate while generating.");
            } else {
              navigate(1);
            }
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
          if (isStreaming) {
            toast.warning("Can't navigate while generating.");
          } else {
            navigate(-1); // Back
          }
        } else if (isStreaming) {
          toast.warning("Can't navigate while generating.");
        } else {
          navigate(1); // Forward
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    const nativeNavEvent = window.electron.onNavigateCommand((direction) => {
      if (isStreaming) {
        toast.warning("Can't navigate while generating.");
        return;
      }
      if (direction === "back") {
        // Use React Router's navigation
        navigate(-1);
      } else if (direction === "forward") {
        navigate(1);
      }
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
      nativeNavEvent();
    };
  }, [navigate, isStreaming]);

  return (
    <Routes>
      <Route path="/" element={<HomePage controller={controller} folders={folders} />} />
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
                toggleReasoningPreference={modelsController.toggleReasoningPreference}
                isStreaming={isStreaming}
                setIsStreaming={setIsStreaming}
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
              <PromptPage prompt={prompt} folders={folders} controller={controller} />
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
  const { models, modelSelection, controller: modelsController, error: modelsError, loading: modelsLoading } = useModels();

  // Global streaming state to disable sidebar actions during generation
  const [isStreaming, setIsStreaming] = useState(false);

  const [welcomeScreenSettingsOpen, setWelcomeScreenSettingsOpen] = useState(false);

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
          {/* {error || loading || saveFileMissing ? ( */}
          <>
            {/* Temporary drag handle bar until real titlebar not shown */}
            <div className="draggable pointer-events-auto fixed left-0 right-0 top-0 z-50 h-[48px] bg-transparent" />
            {/* Welcome screen shown when saveFile is loading or errored out */}
            <div className="fixed inset-0 z-50 flex items-center justify-around bg-background">
              <div>
                {loading ? (
                  <h2 className="animate-pulse text-3xl text-foreground">Loading your savefile...</h2>
                ) : (
                  <>
                    <h2 className="text-3xl font-bold text-foreground">Welcome!</h2>
                    <p className="my-2">We couldn&apos;t load a savefile. Please check your settings.</p>
                  </>
                )}
              </div>
              <Dialog open={welcomeScreenSettingsOpen} onOpenChange={setWelcomeScreenSettingsOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">Open Settings</Button>
                </DialogTrigger>
                {/* <SettingsModal
                  triggerRefresh={controller.saveFile.reload}
                  onSetOpen={setWelcomeScreenSettingsOpen}
                  open={welcomeScreenSettingsOpen}
                /> */}
              </Dialog>
            </div>
          </>
          {/* ) : (
            <SidebarProvider>
              <AppSidebar
                chats={chats}
                prompts={prompts}
                folders={folders}
                controller={controller}
                modelsController={modelsController}
                isStreaming={isStreaming}
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
                  isStreaming={isStreaming}
                />
                <AppRoutes
                  chats={chats}
                  prompts={prompts}
                  controller={controller}
                  folders={folders}
                  modelSelection={modelSelection}
                  modelsController={modelsController}
                  isStreaming={isStreaming}
                  setIsStreaming={setIsStreaming}
                />
              </SidebarInset>
            </SidebarProvider>
          )} */}
        </TooltipProvider>
        <Toaster position="bottom-center" />
      </ThemeProvider>
    </MemoryRouter>
  );
}
