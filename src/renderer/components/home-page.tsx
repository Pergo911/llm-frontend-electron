import { useEffect } from 'react';
import { Button } from './ui/button';
import { setWindowTitle } from '../utils/utils';

export default function HomePage() {
  useEffect(() => {
    setWindowTitle();
  }, []);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-t-xl bg-background p-4">
      <div className="text-3xl font-bold">Welcome!</div>
      <div className="flex w-44 flex-col gap-2">
        <Button>New Chat</Button>
        <Button variant="outline">Prompts</Button>
      </div>
    </div>
  );
}
