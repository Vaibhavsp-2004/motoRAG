import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { useSearch } from '../context/SearchContext';
import { askQuestion, listMotorcycles } from '../services/api';
import { Sparkles, Compass, Check, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { label: 'Any Style', value: '' },
  { label: 'Adventure / Tourer', value: 'Adventure' },
  { label: 'Naked / Streetfighter', value: 'Naked' },
  { label: 'Sport / Track', value: 'Sport' },
  { label: 'Cruiser / Retro', value: 'Cruiser' },
  { label: 'Commuter / Daily', value: 'Commuter' },
  { label: 'Maxi / Urban Scooter', value: 'Scooter' },
];

const BUDGET_OPTIONS = [
  { label: 'Any Budget', maxPrice: undefined },
  { label: 'Under ₹1.5 Lakh', maxPrice: 150000 },
  { label: '₹1.5L – ₹3 Lakh', maxPrice: 300000 },
  { label: '₹3L – ₹6 Lakh', maxPrice: 600000 },
  { label: 'Above ₹6 Lakh', maxPrice: undefined },
];

const RIDER_PREFERENCES = [
  'Comfortable upright ergonomics',
  'Pillion rider comfort for touring',
  'Low seat height (< 800mm)',
  'High fuel economy (> 40 kmpl)',
  'Dual-channel ABS & safety tech',
  'Lightweight & easy in city traffic',
  'Smooth highway cruising at 110+ km/h',
  'Tractable low-end torque for daily commute',
];

const SAMPLE_SCENARIOS = [
  {
    title: 'Daily City Commuter + Weekend Getaways',
    query: 'Looking for a reliable motorcycle under 2.5 lakhs with comfortable suspension for potholes, good pillion seat, and easy handling in dense Bangalore traffic.',
  },
  {
    title: 'Mid-Weight Highway Tourer',
    query: 'Need an adventure or sports-tourer between 3 to 5 lakhs that can cruise comfortably at 110-120 km/h on highways with minimal vibrations and luggage space.',
  },
  {
    title: 'Beginner Track & Corner Carver',
    query: 'Recommend an engaging, agile sportbike for occasional track days and canyon carving with precise front-end feel and forgiving power delivery.',
  },
  {
    title: 'Relaxed Retro Cruiser for Solo Cruising',
    query: 'Want a classic roadster with rich exhaust thump, low seat height, and laid-back seating for relaxed evening rides and weekend breakfasts.',
  },
];

export const FinderPage = () => {
  const { setRequest, setResponse, setLoading, loading } = useSearch();
  const navigate = useNavigate();

  const [question, setQuestion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBudget, setSelectedBudget] = useState<number | undefined>(undefined);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    listMotorcycles().then((bikes) => {
      const uniqueBrands = Array.from(new Set(bikes.map((b) => b.brand).filter(Boolean) as string[])).sort();
      setBrands(uniqueBrands);
    });
  }, []);

  const togglePriority = (p: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      setFormError('Please enter what you are looking for, or pick a sample scenario below.');
      return;
    }

    setFormError('');
    setLoading(true);

    // Build enriched query incorporating selected priorities
    let enrichedQuery = question.trim();
    if (selectedPriorities.length > 0) {
      enrichedQuery += ` Specific rider priorities: ${selectedPriorities.join(', ')}.`;
    }

    const payload = {
      question: enrichedQuery,
      brand: selectedBrand || undefined,
      body_type: selectedCategory || undefined,
      top_k: 5,
    };

    try {
      const resp = await askQuestion(payload);
      setRequest(payload);
      setResponse(resp);
      navigate('/results');
    } catch (err: any) {
      console.error('Finder submit error:', err);
      setFormError(
        err?.message || 'Failed to retrieve recommendations. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f2f3f5]">
      <NavBar />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#ff5a1f] mb-2">
            <Compass className="w-4 h-4" />
            <span>AI Motorcycle Matchmaker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Find the Exact Motorcycle for Your Riding Life
          </h1>
          <p className="text-sm text-[#9aa1b0] mt-2 max-w-2xl leading-relaxed">
            Specify your riding routine, physical height/build, budget constraints, or highway expectations. Our retrieval engine scans thousands of test ride transcripts to recommend the closest matches.
          </p>
        </div>

        {/* Finder Form */}
        <form onSubmit={handleSubmit} className="space-y-8 bg-[#14161d] border border-[#242833] rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Main Query Area */}
          <div>
            <label htmlFor="question" className="block text-sm font-semibold text-white mb-2">
              Describe Your Requirements & Riding Style
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              placeholder="e.g. I am 5'7&quot;, daily office commute is 25km in heavy traffic with terrible potholes. On weekends I want to ride to the hills with my spouse. Budget is 2.5 to 3.5 lakhs. Looking for comfortable suspension and good low-end torque."
              className="w-full bg-[#1b1e27] border border-[#2b303e] rounded-xl p-4 text-sm text-white placeholder-[#687082] focus:outline-none focus:border-[#ff5a1f] transition-colors resize-y"
            />
            {formError && <p className="text-xs text-red-400 mt-2">{formError}</p>}
          </div>

          {/* Quick Priority Checklist */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#8e95a5] mb-3">
              Rider Priority Tags (Click to include)
            </label>
            <div className="flex flex-wrap gap-2">
              {RIDER_PREFERENCES.map((pref) => {
                const active = selectedPriorities.includes(pref);
                return (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => togglePriority(pref)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#ff5a1f]/20 border-[#ff5a1f] text-white font-medium'
                        : 'bg-[#181a22] border-[#292d38] text-[#8e95a5] hover:text-white hover:border-[#383d4c]'
                    }`}
                  >
                    {active && <Check className="w-3 h-3 text-[#ff5a1f]" />}
                    <span>{pref}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters Row: Category, Brand, Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#20242e]">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-semibold text-[#8e95a5] mb-2">
                Body / Category Style
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#1b1e27] border border-[#2b303e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5a1f]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.label} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Preference */}
            <div>
              <label htmlFor="brand" className="block text-xs font-semibold text-[#8e95a5] mb-2">
                Brand Filter (Optional)
              </label>
              <select
                id="brand"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-[#1b1e27] border border-[#2b303e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5a1f]"
              >
                <option value="">Any Manufacturer</option>
                {brands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <label htmlFor="budget" className="block text-xs font-semibold text-[#8e95a5] mb-2">
                Price Target
              </label>
              <select
                id="budget"
                value={selectedBudget ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedBudget(val ? Number(val) : undefined);
                }}
                className="w-full bg-[#1b1e27] border border-[#2b303e] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ff5a1f]"
              >
                {BUDGET_OPTIONS.map((b) => (
                  <option key={b.label} value={b.maxPrice ?? ''}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#ff5a1f] hover:bg-[#e04b16] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-[#ff5a1f]/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing 4,600+ Reviews...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Synthesize Recommendations</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Sample Scenarios */}
        <section className="mt-14">
          <h2 className="text-base font-bold text-white mb-4">Sample Real-World Scenarios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SAMPLE_SCENARIOS.map((sc) => (
              <div
                key={sc.title}
                onClick={() => {
                  setQuestion(sc.query);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className="bg-[#14161d] border border-[#242833] hover:border-[#ff5a1f]/40 rounded-xl p-4 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white group-hover:text-[#ff5a1f] transition-colors">
                    {sc.title}
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-[#687082] group-hover:text-[#ff5a1f] transition-colors" />
                </div>
                <p className="text-xs text-[#8e95a5] mt-2 line-clamp-2 leading-relaxed">
                  {sc.query}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default FinderPage;
