import { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import { NavBar } from '../components/NavBar';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bookmark, Scale, ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import { getMotorcycleImage } from '../utils/motorcycleImages';

export const ResultsPage = () => {
  const { response, request, loading } = useSearch();
  const navigate = useNavigate();

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    if (!response && !loading) {
      navigate('/finder');
      return;
    }

    try {
      const saved = JSON.parse(localStorage.getItem('savedMotorcycles') || '[]');
      setSavedIds(Array.isArray(saved) ? saved : []);
      const compare = JSON.parse(localStorage.getItem('compareList') || '[]');
      setCompareIds(Array.isArray(compare) ? compare : []);
    } catch {
      // ignore
    }
  }, [response, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0d10] text-[#f2f3f5] flex flex-col">
        <NavBar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-8 h-8 border-2 border-[#ff5a1f]/20 border-t-[#ff5a1f] rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-bold text-white">Synthesizing Road Test Intelligence</h2>
          <p className="text-xs text-[#8e95a5] mt-2 max-w-sm">
            Scanning 4,600+ real motorcycle review transcripts and fusing citations...
          </p>
        </div>
      </div>
    );
  }

  if (!response) {
    return null;
  }

  const toggleSave = (id: string) => {
    let next: string[];
    if (savedIds.includes(id)) {
      next = savedIds.filter((item) => item !== id);
    } else {
      next = [...savedIds, id];
    }
    setSavedIds(next);
    localStorage.setItem('savedMotorcycles', JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  };

  const toggleCompare = (id: string) => {
    let next: string[];
    if (compareIds.includes(id)) {
      next = compareIds.filter((item) => item !== id);
    } else {
      next = [...compareIds, id];
    }
    setCompareIds(next);
    localStorage.setItem('compareList', JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f2f3f5]">
      <NavBar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Navigation & Query Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#222630]">
          <div>
            <Link
              to="/finder"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8e95a5] hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Refine Query</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Test Ride Analysis & Recommendations
            </h1>
            {request?.question && (
              <p className="text-xs text-[#8e95a5] mt-1 max-w-2xl italic">
                &ldquo;{request.question}&rdquo;
              </p>
            )}
          </div>

          {compareIds.length > 0 && (
            <Link
              to="/compare"
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff5a1f] hover:bg-[#e04b16] rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Compare Selected ({compareIds.length})</span>
            </Link>
          )}
        </div>

        {/* Grounded AI Synthesis Callout */}
        <section className="bg-[#14161e] border border-[#262a38] rounded-2xl p-6 sm:p-8 mb-10 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ff5a1f] mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Reviewer Consensus & Verdict</span>
          </div>

          <div className="prose prose-invert max-w-none text-sm text-[#d4d8e2] leading-relaxed whitespace-pre-wrap">
            {response.answer}
          </div>
        </section>

        {/* Source Transcripts Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Reviewed Motorcycles & Evidence Excerpts</h2>
              <p className="text-xs text-[#8e95a5] mt-1">
                Direct road test quotes from motorcycle reviews and dynamometer benchmarks.
              </p>
            </div>
            <span className="text-xs font-mono text-[#8e95a5] tabular-nums">
              {response.sources.length} sources matched
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {response.sources.map((src, index) => {
              const isSaved = savedIds.includes(src.chunk_id);
              const isComparing = compareIds.includes(src.chunk_id);
              const bikeId = src.motorcycle_id || src.chunk_id;
              const specs = src.specs;

              return (
                <motion.div
                  key={src.chunk_id}
                  className="bg-[#14161e] border border-[#242835] rounded-xl p-5 flex flex-col justify-between hover:border-[#ff5a1f]/40 transition-colors shadow-lg"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-[11px] font-semibold text-[#8e95a5] uppercase tracking-wider">
                          Excerpt [{index + 1}] · {src.brand}
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          {src.model} {src.variant ? `(${src.variant})` : ''}
                        </h3>
                      </div>
                      {specs?.ex_showroom_price_inr && (
                        <div className="text-right">
                          <div className="text-[10px] text-[#687082]">Ex-Showroom</div>
                          <div className="text-xs font-bold text-white font-mono tabular-nums">
                            ₹{specs.ex_showroom_price_inr.toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Studio Image */}
                    <div className="relative aspect-[16/9] bg-[#0c0d11] rounded-lg overflow-hidden border border-[#222634] my-2 flex items-center justify-center p-2">
                      <img
                        src={getMotorcycleImage(src.brand, src.model, specs?.body_type)}
                        alt={`${src.brand} ${src.model}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Quick Specs Strip if available */}
                    {specs && (
                      <div className="grid grid-cols-3 gap-2 py-2.5 my-3 border-y border-[#20242e] text-[11px]">
                        <div>
                          <span className="text-[#687082] block">Engine</span>
                          <span className="font-semibold text-white font-mono tabular-nums">
                            {specs.engine_cc ? `${specs.engine_cc} cc` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#687082] block">Power</span>
                          <span className="font-semibold text-white font-mono tabular-nums">
                            {specs.power_bhp ? `${specs.power_bhp} BHP` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#687082] block">Mileage</span>
                          <span className="font-semibold text-white font-mono tabular-nums">
                            {specs.mileage_kmpl ? `${specs.mileage_kmpl} kmpl` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* YouTube Review Embed */}
                    {src.youtube_url && (
                      <div className="relative aspect-video rounded-lg overflow-hidden my-3 border border-[#222634] bg-black">
                        <iframe
                          src={src.youtube_url}
                          title={`Review video for ${src.brand} ${src.model}`}
                          allowFullScreen
                          className="w-full h-full"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Reviewer Transcript Quote */}
                    <div className="bg-[#181b24] border border-[#262a36] rounded-lg p-3 my-2">
                      <div className="text-[11px] font-semibold text-[#ff5a1f] mb-1">
                        Reviewer Road Impression:
                      </div>
                      <p className="text-xs text-[#c2c7d4] leading-relaxed italic">
                        &ldquo;{src.snippet}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t border-[#20242e]">
                    <Link
                      to={`/details/${bikeId}`}
                      className="px-3 py-1.5 text-xs font-semibold text-[#ff5a1f] hover:text-white hover:bg-[#ff5a1f] border border-[#ff5a1f] rounded-lg transition-colors flex items-center gap-1"
                    >
                      <span>Full Specs</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCompare(src.chunk_id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${
                          isComparing
                            ? 'bg-[#ff5a1f] text-white border-[#ff5a1f]'
                            : 'bg-[#1a1d26] text-[#8e95a5] border-[#292d3a] hover:text-white'
                        }`}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>{isComparing ? 'Comparing' : 'Compare'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleSave(src.chunk_id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isSaved
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-[#1a1d26] text-[#8e95a5] border-[#292d3a] hover:text-white'
                        }`}
                        title={isSaved ? 'Saved in Garage' : 'Save to Garage'}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResultsPage;