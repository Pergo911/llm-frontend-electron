import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Prompt } from '@/common/types';
import { SidebarTrigger } from './ui/sidebar';

export default function PromptPage() {
  const { id } = useParams();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getPrompt = async () => {
      if (!id) return;

      const { prompt, error } =
        await window.electron.fileOperations.getPromptById(id);

      setPrompt(prompt);
      setError(error);
    };

    getPrompt();
  }, [id]);

  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <SidebarTrigger className="absolute top-2 left-2" />
      {error ? <div>ERROR: {error}</div> : null}
      {prompt ? <div>PROMPT:{JSON.stringify(prompt, null, 2)}</div> : null}
    </div>
  );
}
