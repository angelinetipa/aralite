// src/App.tsx
// Router shell. Three areas, split by what each one is for:
//   /         the dashboard — makes one argument and supports it
//   /explore  the tools — look up a school, ask your own question
//   /admin    data management — upload, clean, publish, remove
//
// Explore is public rather than part of /admin: managing the dataset is
// an operator's job, but searching it is something any visitor wants.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ExplorePage from './pages/ExplorePage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}