import { useCallback, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';
import { setWindowTitle } from '../utils/utils';
import { Separator } from './ui/separator';
import { NewModal, NewModalRef } from './modal-new';

export default function HomePage() {
  const newModalRef = useRef<NewModalRef>(null);

  useEffect(() => {
    setWindowTitle();
  }, []);

  const handleNew = (preset: 'chat' | 'prompt') => {
    newModalRef.current?.promptUser(preset);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-t-xl bg-background p-4">
      <div className="flex w-fit gap-2">
        <Button variant="ghost" onClick={() => handleNew('chat')}>
          <Plus className="mr-2 h-5 w-5" />
          Chat
        </Button>
        <Separator orientation="vertical" />
        <Button variant="ghost" onClick={() => handleNew('prompt')}>
          <Plus className="mr-2 h-5 w-5" />
          Prompt
        </Button>
      </div>
      <NewModal ref={newModalRef} />
    </div>
  );
}
