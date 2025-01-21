import { Home } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from './ui/breadcrumb';
import { Button } from './ui/button';
import TitleBar from './ui/title-bar';

export default function HomePage() {
  return (
    <>
      <TitleBar>
        <Breadcrumb className="h-full flex items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Home className="h-4 w-4" />
              Home
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </TitleBar>
      <div className="p-4 rounded-xl flex flex-col gap-4 items-center justify-center h-full bg-background">
        <div className="text-3xl font-bold">Welcome!</div>
        <div className="flex flex-col gap-2 w-44">
          <Button className="rounded-md">New Chat</Button>
          <Button variant="outline">Prompts</Button>
        </div>
      </div>
    </>
  );
}
