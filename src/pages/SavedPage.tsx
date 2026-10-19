import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import {
  getMotorcycleDetail,
  getChunkDetails,
  type MotorcycleBrief,
} from '../services/api';
import { getMotorcycleImage } from '../utils/motorcycleImages';
import {
  Bookmark,
  Scale,
  Trash2,
  ExternalLink,
  Compass,
  Gauge,
  Zap,
  Fuel,
} from 'lucide-react';

export const SavedPage = () => {
  const navigate = useNavigate();
  const [savedBikes, setSavedBikes] = useState<MotorcycleBrief[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = async () => {
    setLoading(true);
    try {
      const ids: string[] = JSON.parse(
        localStorage.getItem('savedMotorcycles') || '[]'
      );
      if (ids.length === 0) {
        setSavedBikes([]);
        setLoading(false);
        return;
      }

      const fetched: MotorcycleBrief[] = [];
      for (const id of ids) {
        let b = await getMotorcycleDetail(id);
        if (!b) {
          const chunk = await getChunkDetails(id);
          if (chunk) {
            b = {
              motorcycle_id: chunk.motorcycle_id || chunk.chunk_id,
              brand: chunk.brand,
              model: chunk.model,
              variant: chunk.variant,
              specs: chunk.specs,
              engine_cc: chunk.specs?.engine_cc,
              power_bhp: chunk.specs?.power_bhp,
              mileage_kmpl: chunk.specs?.mileage_kmpl,
              ex_showroom_price_inr: chunk.specs?.ex_showroom_price_inr,
            };
          }
        }
        if (b) fetched.push(b);
      }
      setSavedBikes(fetched);
    } catch {
      setSavedBikes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaved();
  }, []);

  const removeSaved = (id: string) => {
    const ids: string[] = JSON.parse(
      localStorage.getItem('savedMotorcycles') || '[]'
    );
    const next = ids.filter((item) => item !== id);
    localStorage.setItem('savedMotorcycles', JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
    setSavedBikes((prev) => prev.filter((b) => b.motorcycle_id !== id));
  };

  const addToCompare = (id: string) => {
    const compare: string[] = JSON.parse(
      localStorage.getItem('compareList') || '[]'
    );
    if (!compare.includes(id)) {
      compare.push(id);
      localStorage.setItem('compareList', JSON.stringify(compare));
      window.dispatchEvent(new Event('storage'));
    }
    navigate('/compare');
  };

  const clearAll = () => {
    localStorage.setItem('savedMotorcycles', JSON.stringify([]));
    window.dispatchEvent(new Event('storage'));
    setSavedBikes([]);
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f2f3f5]">
      <NavBar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#222630]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#ff5a1f] mb-1">
              <Bookmark className="w-4 h-4" />
              <span>Personal Shortlist</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Motorcycle Garage
            </h1>
            <p className="text-xs text-[#8e95a5] mt-1">
              Saved contenders and bookmarked road tests for easy reference and side-by-side comparison.
            </p>
          </div>

          {savedBikes.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="px-3 py-2 text-xs font-semibold text-[#8e95a5] hover:text-white bg-[#191c24] rounded-lg transition-colors self-start sm:self-auto"
            >
              Clear Garage
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#ff5a1f]/20 border-t-[#ff5a1f] rounded-full animate-spin" />
          </div>
        ) : savedBikes.length === 0 ? (
          <div className="bg-[#14161e] border border-[#242835] rounded-2xl p-12 text-center max-w-xl mx-auto my-12">
            <Bookmark className="w-10 h-10 text-[#687082] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Your Garage is Empty</h2>
            <p className="text-xs text-[#8e95a5] mb-6 leading-relaxed">
              Bookmark motorcycles while exploring reviews, querying the AI Matchmaker, or browsing the catalog.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                to="/finder"
                className="px-5 py-2.5 bg-[#ff5a1f] hover:bg-[#e04b16] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors inline-flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Launch AI Finder</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {savedBikes.map((bike) => {
              const price = bike.ex_showroom_price_inr
                ? `₹${bike.ex_showroom_price_inr.toLocaleString('en-IN')}`
                : 'Price on request';

              return (
                <div
                  key={bike.motorcycle_id}
                  className="bg-[#14161e] border border-[#242835] rounded-xl p-5 hover:border-[#ff5a1f]/40 transition-colors flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="text-[11px] font-semibold text-[#8e95a5] uppercase tracking-wider">
                          {bike.brand}
                        </div>
                        <h3 className="text-lg font-bold text-white">
                          {bike.model} {bike.variant ? `(${bike.variant})` : ''}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSaved(bike.motorcycle_id)}
                        className="text-[#687082] hover:text-red-400 p-1 transition-colors"
                        title="Remove from Garage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Studio Image */}
                    <div className="relative aspect-[16/9] bg-[#0c0d11] rounded-lg overflow-hidden border border-[#222634] my-2 flex items-center justify-center p-2">
                      <img
                        src={getMotorcycleImage(bike.brand, bike.model, bike.body_type)}
                        alt={`${bike.brand} ${bike.model}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Specs Row */}
                    <div className="grid grid-cols-3 gap-2 py-3 my-3 border-y border-[#20242e] text-xs">
                      <div>
                        <div className="text-[#687082] flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-[#ff5a1f]" />
                          <span>Engine</span>
                        </div>
                        <div className="font-semibold text-white font-mono tabular-nums mt-0.5">
                          {bike.engine_cc ? `${bike.engine_cc} cc` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#687082] flex items-center gap-1">
                          <Zap className="w-3 h-3 text-[#ff5a1f]" />
                          <span>Power</span>
                        </div>
                        <div className="font-semibold text-white font-mono tabular-nums mt-0.5">
                          {bike.power_bhp ? `${bike.power_bhp} BHP` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#687082] flex items-center gap-1">
                          <Fuel className="w-3 h-3 text-[#ff5a1f]" />
                          <span>Mileage</span>
                        </div>
                        <div className="font-semibold text-white font-mono tabular-nums mt-0.5">
                          {bike.mileage_kmpl ? `${bike.mileage_kmpl} kmpl` : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className="text-[10px] text-[#687082]">Ex-Showroom</div>
                      <div className="text-sm font-bold text-white font-mono tabular-nums">
                        {price}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addToCompare(bike.motorcycle_id)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#8e95a5] hover:text-white bg-[#191c25] rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span>Compare</span>
                      </button>

                      <Link
                        to={`/details/${bike.motorcycle_id}`}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#ff5a1f] hover:bg-[#e04b16] text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        <span>Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SavedPage;