import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Prompt } from '@/common/types';
import { Folder, Notebook, SquareTerminal } from 'lucide-react';
import TitleBar from './ui/title-bar';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbItem,
} from './ui/breadcrumb';

export default function PromptPage() {
  const { id } = useParams();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getPrompt = async () => {
      if (!id) return;

      const { prompt, folder, error } =
        await window.electron.fileOperations.getPromptById(id);

      setPrompt(prompt);
      setFolderName(folder?.title ?? null);
      setError(error);
    };

    getPrompt();
  }, [id]);

  return (
    <>
      <TitleBar>
        <Breadcrumb className="h-full flex items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Folder className="h-4 w-4" />
              {folderName ?? ''}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {prompt?.type === 'user' ? (
                <Notebook className="h-4 w-4" />
              ) : (
                <SquareTerminal className="h-4 w-4" />
              )}
              {prompt?.title ?? 'Prompt'}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </TitleBar>
      <div className="p-4 rounded-xl bg-background flex flex-col gap-4 items-center justify-center h-full">
        {error ? <div>ERROR: {error}</div> : null}
        {prompt ? <div>PROMPT:{JSON.stringify(prompt, null, 2)}</div> : null}
      </div>
    </>
  );
}
