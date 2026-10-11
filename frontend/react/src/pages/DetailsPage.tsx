import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { useSearch } from '../context/SearchContext';
import { motion } from 'framer-motion';

export const DetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { response } = useSearch();
  const [source, setSource] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    // Try to find source in current response
    if (response?.sources) {
      const found = response.sources.find((s) => s.chunk_id === id);
      if (found) {
        setSource(found);
        return;
      }
    }
    // Fallback: look in localStorage saved list
    const saved = JSON.parse(localStorage.getItem('savedMotorcycles') || '[]');
    if (saved.includes(id)) {
      // No detailed data available – show placeholder
      setSource({ chunk_id: id, brand: '', model: '', variant: '', snippet: 'Details not available.' });
    }
  }, [id, response]);

  if (!source) {
    return (
      <div className="min-h-screen bg-primaryBg text-textPrimary flex items-center justify-center">
        <NavBar />
        <p className="text-lg">Loading details…</p>
      </div>
    );
  }

  const handleBack = () => navigate('/results');

  return (
    <div className="min-h-screen bg-primaryBg text-textPrimary font-sans">
      <NavBar />
      <section className="max-w-3xl mx-auto p-6">
        <button onClick={handleBack} className="mb-4 text-accent hover:underline">
          ← Back to results
        </button>
        <motion.div
          className="bg-cardBg rounded-lg p-6 shadow-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h2 className="text-2xl font-bold mb-4">
            {source.brand} {source.model} {source.variant}
          </h2>
          {source.youtube_url && (
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <iframe
                src={source.youtube_url}
                title="YouTube video"
                allowFullScreen
                className="w-full h-full rounded"
              />
            </div>
          )}
          <p className="whitespace-pre-wrap">{source.snippet}</p>
        </motion.div>
      </section>
    </div>
  );
};

export default DetailsPage;