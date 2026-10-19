import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import { HomePage } from './pages/HomePage';
import { FinderPage } from './pages/FinderPage';
import { ResultsPage } from './pages/ResultsPage';
import { DetailsPage } from './pages/DetailsPage';
import { ComparePage } from './pages/ComparePage';
import { SavedPage } from './pages/SavedPage';

export function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/finder" element={<FinderPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/details/:id" element={<DetailsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SearchProvider>
    </BrowserRouter>
  );
}

export default App;
