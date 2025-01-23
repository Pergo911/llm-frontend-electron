import { Home } from 'lucide-react';
import { useEffect } from 'react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from './ui/breadcrumb';
import { Button } from './ui/button';
import TitleBar from './ui/title-bar';
import { setWindowTitle } from '../utils/utils';

export default function HomePage() {
  useEffect(() => {
    setWindowTitle();
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <TitleBar>
        <Breadcrumb className="flex h-full items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Home className="h-4 w-4" />
              Home
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </TitleBar>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-t-xl bg-background p-4">
        <div className="text-3xl font-bold">Welcome!</div>
        <div className="flex w-44 flex-col gap-2">
          <Button className="rounded-md">New Chat</Button>
          <Button variant="outline">Prompts</Button>
        </div>
      </div>
    </div>
  );
}
