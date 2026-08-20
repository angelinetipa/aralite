// src/App.tsx
// Router shell. Two areas:
//   /       the dashboard — the argument, the charts, and the tools
//   /admin  data management — upload, clean, publish, remove
//
// There was briefly an /explore page holding the school finder and the
// ask-the-data box. It split one filter into two and pushed the tools
// somewhere nobody would look. Both now live on the dashboard, driven by
// the same single filter as everything else.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}