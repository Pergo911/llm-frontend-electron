import { renderMatches, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Check,
  CheckCheck,
  CircleAlert,
  Copy,
  Edit3,
  Folder as FolderIcon,
  Notebook,
  SquareTerminal,
  Trash2,
  TriangleAlert,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { PopoverClose } from "@radix-ui/react-popover";
import { ResolvedFolder, ResolvedPrompt, SaveFileController } from "@/utils/types";
import { formatTimestamp, setWindowTitle } from "../utils/utils";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { FolderSelectModal, FolderSelectModalRef } from "./modal-folder-select";
import { RenameModal, RenameModalRef } from "./modal-rename";
import { TextareaWithContextMenu } from "./textarea-context-menu";

export default function PromptPage({
  prompt,
  folders,
  controller,
}: {
  prompt: ResolvedPrompt;
  folders: ResolvedFolder[];
  controller: SaveFileController;
}) {
  const [error, setError] = useState<string | null>(null);
  const folderSelectModalRef = useRef<FolderSelectModalRef>(null);
  const renameModalRef = useRef<RenameModalRef>(null);

  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(true);

  // Runs on nav
  useEffect(() => {
    setWindowTitle(prompt.title);
    setContent(prompt.content);
    setIsSaved(true);
  }, [prompt]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  const handleFolderSelect = useCallback(async () => {
    if (!folderSelectModalRef.current) return;

    const res = await folderSelectModalRef.current.promptUser(prompt.folderId);

    if (!res) return;

    if ("folderId" in res) {
      // User selected an existing folder
      const { error } = controller.prompts.changeFolder(prompt.id, res.folderId);
      if (error) setError(error);
    } else if ("newFolderName" in res) {
      // User wants to create a new folder
      const { error, newId } = controller.folders.add(res.newFolderName);
      if (error || !newId) {
        setError(error || "Couldn't create new folder");
        return;
      }

      const { error: changeFolderError } = controller.prompts.changeFolder(prompt.id, newId);

      if (changeFolderError) setError(changeFolderError);
    }
  }, [controller.folders, controller.prompts, prompt.folderId, prompt.id]);

  const handleSetType = useCallback(
    (newType: "user-prompt" | "system-prompt") => {
      const { error } = controller.prompts.changeType(prompt.id, newType);
      if (error) setError(error);
    },
    [controller.prompts, prompt.id]
  );

  const handleDeletePrompt = useCallback(() => {
    const { error } = controller.prompts.delete(prompt.id);
    if (error) setError(error);
  }, [controller.prompts, prompt.id]);

  const handleRename = useCallback(async () => {
    if (!renameModalRef.current) {
      setError("Couldn't get rename modal.");
      return;
    }

    // Prompt user for new name
    const newName = await renameModalRef.current.promptUser("prompt", prompt.title);

    if (newName) {
      const { error } = controller.prompts.rename(prompt.id, newName);
      if (error) setError(error);
    }
  }, [controller.prompts, prompt.id, prompt.title]);

  const handleSave = useCallback(() => {
    const { error } = controller.prompts.editContent(prompt.id, content);
    if (error) setError(error);
  }, [content, controller.prompts, prompt.id]);

  // Register CTRL + S
  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "s" && e.ctrlKey) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleSaveShortcut);

    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [handleSave]);

  return (
    <div className="flex flex-1 flex-col items-center gap-4 rounded-t-3xl bg-background p-4">
      {/* Use this to adjust max width */}
      <div className="flex h-full w-full max-w-[800px] flex-col gap-4">
        <div className="flex items-center gap-2 px-4 text-sm text-muted-foreground @container">
          <span className="hidden whitespace-nowrap @[500px]:inline">Folder</span>
          <Button variant="outline" className="group w-44 justify-start" onClick={handleFolderSelect}>
            {prompt.folder ? (
              <FolderIcon className="inline h-4 w-4 flex-shrink-0 group-hover:hidden" />
            ) : (
              <TriangleAlert className="inline h-4 w-4 flex-shrink-0 group-hover:hidden" />
            )}
            <Edit3 className="hidden h-4 w-4 flex-shrink-0 group-hover:inline" />
            <span className="truncate">{prompt.folder ? prompt.folder.name : "No folder"}</span>
          </Button>
          <span>
            <Separator orientation="vertical" className="mx-2 hidden h-9 @[500px]:block" />
          </span>
          <span className="hidden whitespace-nowrap @[500px]:inline">Send as</span>
          <Select value={prompt.type} onValueChange={(v) => handleSetType(v as ResolvedPrompt["type"])}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user-prompt">
                <Notebook className="-mt-0.5 mr-2 inline h-4 w-4" />
                User
              </SelectItem>
              <SelectItem value="system-prompt">
                <SquareTerminal className="-mt-0.5 mr-2 inline h-4 w-4" />
                System
              </SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button variant="actionButton" size="icon" className="ml-auto hover:text-red-500 focus:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Delete prompt</TooltipContent>
              <PopoverContent side="top" align="end" className="border-[0.5px] border-border bg-background-dim p-4 text-xs drop-shadow-md">
                <div>
                  <div className="text-lg font-bold">Delete?</div>
                  <div className="text-muted-foreground">Deletes this prompt permanently. References in chats will be retained.</div>
                </div>
                <div className="h-4" />
                <div className="flex w-full justify-end gap-2">
                  <PopoverClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </PopoverClose>
                  <Button variant="destructive" onClick={handleDeletePrompt}>
                    Confirm
                  </Button>
                </div>
              </PopoverContent>
            </Tooltip>
          </Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="actionButton"
                size="icon"
                onClick={(e) => {
                  navigator.clipboard.writeText(prompt.id);
                  e.currentTarget.blur();
                }}
              >
                <Tag className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Copy ID</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" className="" disabled={isSaved} onClick={handleSave}>
                {isSaved ? <CheckCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              {isSaved ? "Saved." : "Save"}
            </TooltipContent>
          </Tooltip>
        </div>
        {/* Prompt content area */}
        <div className="flex h-full w-full flex-col overflow-y-auto rounded-3xl border border-border bg-background-dim">
          <div className="relative flex items-start px-4 pt-4 text-xl font-bold leading-none">
            {prompt.type === "user-prompt" ? (
              <Notebook className="mr-4 h-6 w-6 flex-shrink-0" />
            ) : (
              <SquareTerminal className="mr-4 h-6 w-6 flex-shrink-0" />
            )}
            <div className="mr-10 mt-0.5 w-fit">{prompt.title}</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button className="absolute right-4 top-4 text-muted-foreground" size="icon" variant="actionButton" onClick={handleRename}>
                  <Edit3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Rename</TooltipContent>
            </Tooltip>
          </div>
          <div className="m-0 ml-14 mt-0.5 p-0 text-xs text-muted-foreground">
            <span>Created </span>
            <span className="font-bold">{formatTimestamp(prompt.created)}</span>
            <span> • Modified </span>
            <span className="font-bold">{formatTimestamp(prompt.modified)}</span>
          </div>
          <TextareaWithContextMenu
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setIsSaved(false);
            }}
            onValueChange={(next) => {
              setContent(next);
              setIsSaved(false);
            }}
            placeholder="Start typing here..."
            spellCheck={false}
            className="m-0 h-full w-full resize-none overflow-y-auto rounded-none border-none p-4 text-base tracking-[0.02em] focus-visible:ring-0"
          />
        </div>
      </div>
      <FolderSelectModal ref={folderSelectModalRef} folders={folders} />
      <RenameModal ref={renameModalRef} />
    </div>
  );
}
