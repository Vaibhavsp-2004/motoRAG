import { useEffect, useState } from 'react';
import { NavBar } from '../components/NavBar';
import { useSearch } from '../context/SearchContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const ComparePage = () => {
  const { response } = useSearch();
  const navigate = useNavigate();
  const [compareItems, setCompareItems] = useState<any[]>([]);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('compareList') || '[]');
    if (response?.sources) {
      const items = response.sources.filter((src) => ids.includes(src.chunk_id));
      setCompareItems(items);
    }
  }, [response]);

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen bg-primaryBg text-textPrimary flex items-center justify-center">
        <NavBar />
        <p className="text-lg">No motorcycles selected for comparison.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primaryBg text-textPrimary font-sans">
      <NavBar />
      <section className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-accent">Compare Motorcycles</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {compareItems.map((src) => (
            <motion.div
              key={src.chunk_id}
              className="bg-cardBg rounded-lg p-4 shadow-md"
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-lg font-semibold mb-2">
                {src.brand ?? ''} {src.model ?? ''} {src.variant ?? ''}
              </h2>
              {src.youtube_url && (
                <div className="aspect-w-16 aspect-h-9 mb-2">
                  <iframe
                    src={src.youtube_url}
                    title="YouTube video"
                    allowFullScreen
                    className="w-full h-full rounded"
                  />
                </div>
              )}
              <p className="text-sm mb-2 line-clamp-3">{src.snippet}</p>
              <button
                onClick={() => navigate(`/details/${src.chunk_id}`)}
                className="px-3 py-1 bg-accent text-white rounded hover:bg-orange-600 transition"
              >
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ComparePage;
