import { Button } from './ui/button';
import { SidebarTrigger } from './ui/sidebar';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <SidebarTrigger className="absolute top-2 left-2" />
      <div className="text-3xl font-bold">Welcome!</div>
      <div className="flex flex-col gap-2 w-44">
        <Button className="rounded-md">New Chat</Button>
        <Button variant="outline">Prompts</Button>
      </div>
    </div>
  );
}
