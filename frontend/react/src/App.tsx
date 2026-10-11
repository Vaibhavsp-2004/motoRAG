import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './index.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const FinderPage = lazy(() => import('./pages/FinderPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const DetailsPage = lazy(() => import('./pages/DetailsPage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-primaryBg text-textPrimary font-sans">
        <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/finder" element={<FinderPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/details/:id" element={<DetailsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/saved" element={<SavedPage />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
