import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NavBar } from '../components/NavBar';

const SavedPage = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    try {
      const ids: unknown = JSON.parse(
        localStorage.getItem('savedMotorcycles') || '[]'
      );

      if (Array.isArray(ids)) {
        setSaved(
          ids.filter((id): id is string => typeof id === 'string')
        );
      }
    } catch {
      setSaved([]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-primaryBg text-textPrimary">
      <NavBar />

      <section className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-accent">
          Saved Motorcycles
        </h1>

        {saved.length === 0 ? (
          <p className="text-lg">No motorcycles saved yet.</p>
        ) : (
          <ul className="space-y-3">
            {saved.map((id) => (
              <motion.li
                key={id}
                className="bg-cardBg rounded p-4 shadow"
                whileHover={{ scale: 1.02 }}
              >
                <span>ID: {id}</span>

                <button
                  onClick={() => navigate(`/details/${id}`)}
                  className="ml-4 px-3 py-2 bg-accent text-white rounded"
                >
                  View Details
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SavedPage;