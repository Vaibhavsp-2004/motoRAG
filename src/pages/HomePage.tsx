import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { useSearch } from '../context/SearchContext';
import { askQuestion, listMotorcycles, type MotorcycleBrief } from '../services/api';
import { getMotorcycleImage } from '../utils/motorcycleImages';
import { Search, ArrowRight, Gauge, Fuel, Zap } from 'lucide-react';

const HERO_IMAGE = '/src/assets/images/hero_motorcycle_showcase_1791705992085.jpg';
const ADVENTURE_IMAGE = '/src/assets/images/moto_adventure_trail_1791706004672.jpg';
const SPORT_IMAGE = '/src/assets/images/moto_sport_apex_1791706016325.jpg';
const ROADSTER_IMAGE = '/src/assets/images/moto_classic_roadster_1791706029378.jpg';

const QUICK_PROMPTS = [
  'Royal Enfield Himalayan 450 vs Triumph Scrambler 400X for touring',
  'Best comfortable bike for daily Bangalore traffic and bad roads under 2.5 lakhs',
  'TVS Apache RR 310 vs Yamaha R15 V4 for track day beginner',
  'Lightweight low seat height bike with dual-channel ABS for city commute',
];

export const HomePage = () => {
  const navigate = useNavigate();
  const { setRequest, setResponse, setLoading, loading } = useSearch();
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<MotorcycleBrief[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    listMotorcycles().then((data) => {
      setCatalog(data);
    });
  }, []);

  const handleAsk = async (textToAsk: string) => {
    if (!textToAsk.trim() || loading) return;
    setLoading(true);
    const payload = { question: textToAsk.trim(), top_k: 5 };
    setRequest(payload);
    try {
      const resp = await askQuestion(payload);
      setResponse(resp);
      navigate('/results');
    } catch (err) {
      console.error(err);
      navigate('/finder');
    } finally {
      setLoading(false);
    }
  };

  const filteredBikes = catalog.filter((b) => {
    const matchCat =
      activeCategory === 'All' ||
      b.body_type?.toLowerCase().includes(activeCategory.toLowerCase()) ||
      b.specs?.body_type?.toLowerCase().includes(activeCategory.toLowerCase());
    const matchSearch =
      !searchFilter ||
      `${b.brand} ${b.model}`.toLowerCase().includes(searchFilter.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f2f3f5]">
      <NavBar />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[#222630]">
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMAGE}
            alt="Performance motorcycle on coastal highway at dusk"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-[#0c0d10]/70 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#ff5a1f] mb-4">
              <span>Grounded Motorcycle Intelligence</span>
              <span aria-hidden="true">·</span>
              <span>4,600+ Verified Video Transcripts</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
              Real rider consensus.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-200 to-[#ff5a1f]">
                No marketing fluff.
              </span>
            </h1>

            <p className="text-lg text-[#9aa1b0] mb-8 leading-relaxed max-w-2xl">
              Ask anything about ride ergonomics, real-world mileage, heating in traffic, or highway stability. Grounded directly in professional road test transcripts across 250+ motorcycles.
            </p>

            {/* Direct Ask Input */}
            <div className="bg-[#14161c]/90 border border-[#2b303d] rounded-xl p-2 shadow-2xl backdrop-blur-md mb-4 max-w-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk(query);
                }}
                className="flex items-center gap-2"
              >
                <Search className="w-5 h-5 text-[#8e95a5] ml-3 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question or compare bikes (e.g. Scrambler 400X vs Himalayan 450)..."
                  className="w-full bg-transparent text-white placeholder-[#687082] px-2 py-2.5 text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-5 py-2.5 bg-[#ff5a1f] text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#e04b16] transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                >
                  {loading ? (
                    <span>Synthesizing...</span>
                  ) : (
                    <>
                      <span>Ask AI</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#8e95a5]">
              <span className="text-[#687082]">Try:</span>
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setQuery(prompt);
                    handleAsk(prompt);
                  }}
                  className="text-left bg-[#181b22] hover:bg-[#232732] hover:text-white border border-[#262b36] rounded-md px-2.5 py-1 transition-colors truncate max-w-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Proof & Metrics Strip */}
      <section className="border-b border-[#222630] bg-[#101217]">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-2xl font-bold text-white tabular-nums font-mono">4,672</div>
            <div className="text-xs text-[#8e95a5] mt-1">Review excerpts indexed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tabular-nums font-mono">254</div>
            <div className="text-xs text-[#8e95a5] mt-1">Motorcycles with OEM specs</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tabular-nums font-mono">100%</div>
            <div className="text-xs text-[#8e95a5] mt-1">Source-grounded citations</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tabular-nums font-mono">BM25 + LLM</div>
            <div className="text-xs text-[#8e95a5] mt-1">Hybrid neural retrieval</div>
          </div>
        </div>
      </section>

      {/* Featured Rider Categories Bento */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Explore by Riding Discipline</h2>
            <p className="text-sm text-[#8e95a5] mt-1">
              Curated motorcycle segments tested under Indian terrain and riding conditions.
            </p>
          </div>
          <Link
            to="/finder"
            className="text-xs font-semibold uppercase tracking-wider text-[#ff5a1f] hover:text-[#ff7847] flex items-center gap-1"
          >
            <span>Open Custom Finder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Adventure & Touring */}
          <div
            onClick={() => {
              setActiveCategory('Adventure');
              const el = document.getElementById('catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative overflow-hidden rounded-xl bg-[#14161c] border border-[#262a36] hover:border-[#ff5a1f]/50 transition-all cursor-pointer h-72 flex flex-col justify-end p-6"
          >
            <img
              src={ADVENTURE_IMAGE}
              alt="Adventure motorcycle"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-[#0c0d10]/40 to-transparent" />
            <div className="relative z-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#ff5a1f]">Off-road & Highway</span>
              <h3 className="text-xl font-bold text-white mt-1">Adventure & Tourers</h3>
              <p className="text-xs text-[#9aa1b0] mt-1">High ground clearance, upright ergonomics, luggage capability.</p>
            </div>
          </div>

          {/* Card 2: Performance Sport */}
          <div
            onClick={() => {
              setActiveCategory('Sport');
              const el = document.getElementById('catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative overflow-hidden rounded-xl bg-[#14161c] border border-[#262a36] hover:border-[#ff5a1f]/50 transition-all cursor-pointer h-72 flex flex-col justify-end p-6"
          >
            <img
              src={SPORT_IMAGE}
              alt="Sport motorcycle"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-[#0c0d10]/40 to-transparent" />
            <div className="relative z-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#ff5a1f]">Track & Cornering</span>
              <h3 className="text-xl font-bold text-white mt-1">Sport & Track Machines</h3>
              <p className="text-xs text-[#9aa1b0] mt-1">Aggressive clip-ons, aerodynamic fairings, high-rev powerbands.</p>
            </div>
          </div>

          {/* Card 3: Modern Classic / Roadster */}
          <div
            onClick={() => {
              setActiveCategory('Cruiser');
              const el = document.getElementById('catalog-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative overflow-hidden rounded-xl bg-[#14161c] border border-[#262a36] hover:border-[#ff5a1f]/50 transition-all cursor-pointer h-72 flex flex-col justify-end p-6"
          >
            <img
              src={ROADSTER_IMAGE}
              alt="Classic roadster motorcycle"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-45 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10] via-[#0c0d10]/40 to-transparent" />
            <div className="relative z-10">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#ff5a1f]">Torque & Heritage</span>
              <h3 className="text-xl font-bold text-white mt-1">Roadsters & Cruisers</h3>
              <p className="text-xs text-[#9aa1b0] mt-1">Low-end grunt, relaxed seating, timeless neo-retro aesthetics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Motorcycle Catalog & Specification Hub */}
      <section id="catalog-section" className="border-t border-[#222630] bg-[#0f1116] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Motorcycle Specification & Review Library</h2>
              <p className="text-sm text-[#8e95a5] mt-1">
                Browse detailed technical specs and reviewer impressions from 250+ motorcycles.
              </p>
            </div>

            {/* Search within catalog */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-[#8e95a5] absolute left-3 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search model or brand..."
                className="w-full bg-[#161820] border border-[#2b303d] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#687082] focus:outline-none focus:border-[#ff5a1f]"
              />
            </div>
          </div>

          {/* Interactive Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-[#20242e]">
            {['All', 'Sport', 'Adventure', 'Naked', 'Cruiser', 'Commuter', 'Scooter'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeCategory === cat
                    ? 'bg-[#ff5a1f] text-white'
                    : 'bg-[#181b22] text-[#8e95a5] hover:text-white hover:bg-[#232732]'
                }`}
              >
                {cat === 'Naked' ? 'Naked / Street' : cat}
              </button>
            ))}
          </div>

          {/* Catalog Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBikes.slice(0, 18).map((bike) => {
              const price = bike.ex_showroom_price_inr
                ? `₹${bike.ex_showroom_price_inr.toLocaleString('en-IN')}`
                : 'Price on request';

              return (
                <div
                  key={bike.motorcycle_id}
                  className="bg-[#14161d] border border-[#242833] rounded-xl overflow-hidden hover:border-[#ff5a1f]/40 transition-colors flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] bg-[#0c0d11] border-b border-[#20242e] flex items-center justify-center p-3">
                    <img
                      src={getMotorcycleImage(bike.brand, bike.model, bike.body_type)}
                      alt={`${bike.brand} ${bike.model}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 right-2.5 bg-black/75 backdrop-blur-sm text-[10px] font-semibold text-[#ff5a1f] px-2 py-0.5 rounded border border-[#ff5a1f]/30">
                      {bike.body_type || 'Motorcycle'}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-semibold text-[#8e95a5] uppercase tracking-wider">
                            {bike.brand}
                          </span>
                          <h4 className="text-lg font-bold text-white group-hover:text-[#ff5a1f] transition-colors">
                            {bike.model}
                          </h4>
                        </div>
                      </div>

                    {/* Spec Indicators */}
                    <div className="grid grid-cols-3 gap-2 my-4 py-3 border-y border-[#20242e] text-xs">
                      <div>
                        <div className="text-[#687082] flex items-center gap-1">
                          <Gauge className="w-3 h-3 text-[#ff5a1f]" />
                          <span>Displacement</span>
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

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <div className="text-[11px] text-[#687082]">Ex-Showroom</div>
                      <div className="text-sm font-bold text-white font-mono tabular-nums">
                        {price}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const compare = JSON.parse(localStorage.getItem('compareList') || '[]');
                          if (!compare.includes(bike.motorcycle_id)) {
                            compare.push(bike.motorcycle_id);
                            localStorage.setItem('compareList', JSON.stringify(compare));
                            window.dispatchEvent(new Event('storage'));
                          }
                          navigate('/compare');
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium text-[#8e95a5] hover:text-white bg-[#1a1d25] rounded-md transition-colors"
                      >
                        Compare
                      </button>

                      <Link
                        to={`/details/${bike.motorcycle_id}`}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#ff5a1f] hover:bg-[#e04b16] text-white rounded-md transition-colors"
                      >
                        Reviews
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

          {filteredBikes.length === 0 && (
            <div className="text-center py-12 text-[#8e95a5]">
              No motorcycles matched your search criteria.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;