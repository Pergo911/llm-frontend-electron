import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.global.css';

import 'tailwindcss/tailwind.css';
import { Button } from './components/ui/button';

function MainPage() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center h-screen">
      <div className="text-3xl font-bold">Hello world</div>
      <Button>Click me</Button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
      </Routes>
    </Router>
  );
}
