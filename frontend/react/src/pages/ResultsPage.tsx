import { useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import { NavBar } from '../components/NavBar';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export const ResultsPage = () => {
  const { response, loading } = useSearch();
  const navigate = useNavigate();

  // Redirect to finder if no response (e.g., direct access)
  useEffect(() => {
    if (!response && !loading) {
      navigate('/finder');
    }
  }, [response, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primaryBg text-textPrimary flex items-center justify-center">
        <NavBar />
        <p className="text-xl">Generating recommendations…</p>
      </div>
    );
  }

  if (!response) {
    return null; // redirect handled above
  }

  const handleDetails = (sourceId: string) => {
    localStorage.setItem('selectedSource', sourceId);
    navigate(`/details/${sourceId}`);
  };

  const handleSave = (sourceId: string) => {
    const saved = JSON.parse(localStorage.getItem('savedMotorcycles') || '[]');
    if (!saved.includes(sourceId)) {
      saved.push(sourceId);
      localStorage.setItem('savedMotorcycles', JSON.stringify(saved));
    }
  };

  const handleCompare = (sourceId: string) => {
    const compare = JSON.parse(localStorage.getItem('compareList') || '[]');
    if (!compare.includes(sourceId)) {
      compare.push(sourceId);
      localStorage.setItem('compareList', JSON.stringify(compare));
    }
  };

  return (
    <div className="min-h-screen bg-primaryBg text-textPrimary font-sans">
      <NavBar />
      <section className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-accent">Your Recommendations</h1>
        <p className="mb-4 whitespace-pre-wrap">{response.answer}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {response.sources.map((src) => (
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
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => handleDetails(src.chunk_id)}
                  className="px-3 py-1 bg-accent text-white rounded hover:bg-orange-600 transition"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleCompare(src.chunk_id)}
                  className="px-3 py-1 bg-secondaryAccent text-white rounded hover:bg-gray-600 transition"
                >
                  Compare
                </button>
                <button
                  onClick={() => handleSave(src.chunk_id)}
                  className="px-3 py-1 bg-success text-white rounded hover:bg-green-600 transition"
                >
                  Save
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ResultsPage;