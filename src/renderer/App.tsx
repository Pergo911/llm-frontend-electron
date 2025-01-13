import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.global.css';

import 'tailwindcss/tailwind.css';

function MainPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-3xl font-bold">Hello world</div>
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
