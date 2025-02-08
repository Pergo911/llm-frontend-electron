import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Prompt } from '@/common/types';
import { setWindowTitle } from '../utils/utils';

export default function PromptPage() {
  const { id } = useParams();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (prompt) {
      setWindowTitle(prompt.title);
    }
  }, [prompt]);

  useEffect(() => {
    const getPrompt = async () => {
      if (!id) return;

      const { prompt, folder, error } =
        await window.electron.fileOperations.getPromptById(id);

      if (!prompt) {
        nav('/');
      }

      setPrompt(prompt);
      setFolderName(folder?.title ?? null);
      setError(error);
    };

    getPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-t-xl bg-background p-4">
      {error ? <div>ERROR: {error}</div> : null}
      {prompt ? <div>PROMPT:{JSON.stringify(prompt, null, 2)}</div> : null}
    </div>
  );
}
