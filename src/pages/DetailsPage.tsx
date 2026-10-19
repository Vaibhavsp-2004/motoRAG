import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { getMotorcycleDetail, getChunkDetails, type MotorcycleBrief, type Source } from '../services/api';
import { getMotorcycleImage } from '../utils/motorcycleImages';
import {
  ArrowLeft,
  Gauge,
  Zap,
  Fuel,
  Weight,
  Ruler,
  ShieldCheck,
  Check,
  X,
  Scale,
  Bookmark,
  Youtube,
  Sparkles,
} from 'lucide-react';

export const DetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [bike, setBike] = useState<MotorcycleBrief | null>(null);
  const [chunkSource, setChunkSource] = useState<Source | null>(null);
  const [loading, setLoading] = useState(true);

  const [isSaved, setIsSaved] = useState(false);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const checkSaved = () => {
      try {
        const saved = JSON.parse(localStorage.getItem('savedMotorcycles') || '[]');
        setIsSaved(saved.includes(id));
        const compare = JSON.parse(localStorage.getItem('compareList') || '[]');
        setIsComparing(compare.includes(id));
      } catch {
        // ignore
      }
    };
    checkSaved();

    // First try loading as motorcycle_id
    getMotorcycleDetail(id).then((data) => {
      if (data) {
        setBike(data);
        setLoading(false);
      } else {
        // Fallback: try loading as chunk_id
        getChunkDetails(id).then((src) => {
          if (src) {
            setChunkSource(src);
            if (src.motorcycle_id) {
              getMotorcycleDetail(src.motorcycle_id).then((m) => {
                if (m) setBike(m);
              });
            }
          }
          setLoading(false);
        });
      }
    });
  }, [id]);

  const toggleSave = () => {
    if (!id) return;
    const saved = JSON.parse(localStorage.getItem('savedMotorcycles') || '[]');
    let next: string[];
    if (saved.includes(id)) {
      next = saved.filter((item: string) => item !== id);
      setIsSaved(false);
    } else {
      next = [...saved, id];
      setIsSaved(true);
    }
    localStorage.setItem('savedMotorcycles', JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  };

  const toggleCompare = () => {
    if (!id) return;
    const compare = JSON.parse(localStorage.getItem('compareList') || '[]');
    let next: string[];
    if (compare.includes(id)) {
      next = compare.filter((item: string) => item !== id);
      setIsComparing(false);
    } else {
      next = [...compare, id];
      setIsComparing(true);
    }
    localStorage.setItem('compareList', JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0d10] text-[#f2f3f5] flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#ff5a1f]/20 border-t-[#ff5a1f] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const specs = bike?.specs || chunkSource?.specs;
  const brand = bike?.brand || chunkSource?.brand || 'Motorcycle';
  const model = bike?.model || chunkSource?.model || 'Model';
  const variant = bike?.variant || chunkSource?.variant;
  const youtubeUrl =
    bike?.youtube_url ||
    (bike?.chunks && bike.chunks[0]?.youtube_url) ||
    chunkSource?.youtube_url;

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f2f3f5]">
      <NavBar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8e95a5] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>

        {/* Hero Specs Header */}
        <div className="bg-[#14161e] border border-[#242835] rounded-2xl p-6 sm:p-8 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#20242e]">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8e95a5] uppercase tracking-wider mb-1">
                <span>{brand}</span>
                {specs?.body_type && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#ff5a1f]">{specs.body_type}</span>
                  </>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {model} {variant ? <span className="text-lg font-normal text-[#8e95a5]">({variant})</span> : ''}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {specs?.ex_showroom_price_inr && (
                <div className="mr-4 text-left sm:text-right">
                  <div className="text-[11px] text-[#687082]">Ex-Showroom Price</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-white font-mono tabular-nums">
                    ₹{specs.ex_showroom_price_inr.toLocaleString('en-IN')}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={toggleCompare}
                className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-colors flex items-center gap-1.5 ${
                  isComparing
                    ? 'bg-[#ff5a1f] text-white border-[#ff5a1f]'
                    : 'bg-[#1b1e27] text-[#9aa1b0] border-[#2c313f] hover:text-white'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>{isComparing ? 'Comparing' : 'Compare'}</span>
              </button>

              <button
                type="button"
                onClick={toggleSave}
                className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-colors flex items-center gap-1.5 ${
                  isSaved
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-[#1b1e27] text-[#9aa1b0] border-[#2c313f] hover:text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{isSaved ? 'In Garage' : 'Save to Garage'}</span>
              </button>
            </div>
          </div>

          {/* BikeWale Studio Showcase Image */}
          <div className="relative aspect-[21/9] sm:aspect-[24/9] bg-[#0c0d11] rounded-xl overflow-hidden border border-[#232733] my-6 flex items-center justify-center p-4">
            <img
              src={getMotorcycleImage(brand, model, specs?.body_type)}
              alt={`${brand} ${model}`}
              referrerPolicy="no-referrer"
              className="h-full object-contain"
            />
          </div>

          {/* Key Metric Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
            <div className="bg-[#191c25] rounded-xl p-3 border border-[#232733]">
              <div className="text-[11px] text-[#687082] flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-[#ff5a1f]" />
                <span>Engine</span>
              </div>
              <div className="text-base font-bold text-white font-mono tabular-nums mt-1">
                {specs?.engine_cc ? `${specs.engine_cc} cc` : 'N/A'}
              </div>
            </div>

            <div className="bg-[#191c25] rounded-xl p-3 border border-[#232733]">
              <div className="text-[11px] text-[#687082] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#ff5a1f]" />
                <span>Peak Power</span>
              </div>
              <div className="text-base font-bold text-white font-mono tabular-nums mt-1">
                {specs?.power_bhp ? `${specs.power_bhp} BHP` : 'N/A'}
              </div>
            </div>

            <div className="bg-[#191c25] rounded-xl p-3 border border-[#232733]">
              <div className="text-[11px] text-[#687082] flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-[#ff5a1f]" />
                <span>Torque</span>
              </div>
              <div className="text-base font-bold text-white font-mono tabular-nums mt-1">
                {specs?.torque_nm ? `${specs.torque_nm} Nm` : 'N/A'}
              </div>
            </div>

            <div className="bg-[#191c25] rounded-xl p-3 border border-[#232733]">
              <div className="text-[11px] text-[#687082] flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5 text-[#ff5a1f]" />
                <span>Mileage</span>
              </div>
              <div className="text-base font-bold text-white font-mono tabular-nums mt-1">
                {specs?.mileage_kmpl ? `${specs.mileage_kmpl} kmpl` : 'N/A'}
              </div>
            </div>

            <div className="bg-[#191c25] rounded-xl p-3 border border-[#232733]">
              <div className="text-[11px] text-[#687082] flex items-center gap-1">
                <Weight className="w-3.5 h-3.5 text-[#ff5a1f]" />
                <span>Kerb Weight</span>
              </div>
              <div className="text-base font-bold text-white font-mono tabular-nums mt-1">
                {specs?.kerb_weight_kg ? `${specs.kerb_weight_kg} kg` : 'N/A'}
              </div>
            </div>

            <div className="bg-[#191c25] rounded-xl p-3 border border-[#232733]">
              <div className="text-[11px] text-[#687082] flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-[#ff5a1f]" />
                <span>Seat Height</span>
              </div>
              <div className="text-base font-bold text-white font-mono tabular-nums mt-1">
                {specs?.seat_height_mm ? `${specs.seat_height_mm} mm` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Video & Features 2-Column Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* YouTube Review Section */}
          <section className="bg-[#14161e] border border-[#242835] rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ff5a1f] mb-3">
                <Youtube className="w-4 h-4" />
                <span>Verified Test Ride Review Video</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-4">
                Watch Expert Ride Evaluation
              </h2>

              {youtubeUrl ? (
                <div className="aspect-video rounded-xl overflow-hidden border border-[#262a38] bg-black shadow-inner">
                  <iframe
                    src={youtubeUrl}
                    title={`Review video for ${brand} ${model}`}
                    allowFullScreen
                    className="w-full h-full"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl border border-dashed border-[#2b3040] bg-[#101217] flex items-center justify-center text-xs text-[#8e95a5]">
                  Test ride video coming soon.
                </div>
              )}
            </div>

            {specs?.warranty && (
              <div className="mt-4 pt-4 border-t border-[#20242e] flex items-center justify-between text-xs text-[#8e95a5]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Factory Warranty:</span>
                </span>
                <span className="font-semibold text-white">{specs.warranty}</span>
              </div>
            )}
          </section>

          {/* Technical Specs Breakdown */}
          <section className="bg-[#14161e] border border-[#242835] rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">Detailed Technical Specifications</h2>

            <dl className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#20242e]">
                <dt className="text-[#8e95a5]">Top Speed</dt>
                <dd className="font-semibold text-white font-mono tabular-nums">
                  {specs?.top_speed_kmph ? `${specs.top_speed_kmph} km/h` : 'N/A'}
                </dd>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#20242e]">
                <dt className="text-[#8e95a5]">Transmission</dt>
                <dd className="font-semibold text-white">{specs?.transmission || 'Manual'}</dd>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#20242e]">
                <dt className="text-[#8e95a5]">Ground Clearance</dt>
                <dd className="font-semibold text-white font-mono tabular-nums">
                  {specs?.ground_clearance_mm ? `${specs.ground_clearance_mm} mm` : 'N/A'}
                </dd>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#20242e]">
                <dt className="text-[#8e95a5]">Fuel Tank Capacity</dt>
                <dd className="font-semibold text-white font-mono tabular-nums">
                  {specs?.fuel_tank_l ? `${specs.fuel_tank_l} L` : 'N/A'}
                </dd>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#20242e]">
                <dt className="text-[#8e95a5]">Braking System</dt>
                <dd className="font-semibold text-white">
                  {specs?.braking_front || 'Disc'} (Front) / {specs?.braking_rear || 'Disc'} (Rear)
                </dd>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#20242e]">
                <dt className="text-[#8e95a5]">ABS Configuration</dt>
                <dd className="font-semibold text-white">{specs?.abs_channels || 'Standard'}</dd>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-[#20242e]">
                <dt className="text-[#8e95a5]">Suspension Setup</dt>
                <dd className="font-semibold text-white text-right max-w-xs truncate">
                  {specs?.suspension_front || 'Telescopic'} / {specs?.suspension_rear || 'Monoshock'}
                </dd>
              </div>
            </dl>

            {/* Convenience Features Checklist */}
            <div className="mt-6 pt-4 border-t border-[#20242e]">
              <div className="text-xs font-semibold text-[#8e95a5] uppercase tracking-wider mb-3">
                Features & Connectivity
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Digital TFT/LCD Cluster', active: specs?.digital_cluster_yn === 'Yes' },
                  { label: 'Bluetooth Connectivity', active: specs?.bluetooth_yn === 'Yes' },
                  { label: 'USB Phone Charger', active: specs?.usb_charging_yn === 'Yes' },
                  { label: 'All-LED Lighting', active: specs?.led_lighting_yn === 'Yes' },
                  { label: 'Keyless Ignition', active: specs?.keyless_start_yn === 'Yes' },
                ].map((feat) => (
                  <div
                    key={feat.label}
                    className="flex items-center gap-2 p-2 bg-[#191c25] rounded-lg border border-[#232733]"
                  >
                    {feat.active ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-[#687082] shrink-0" />
                    )}
                    <span className={feat.active ? 'text-white' : 'text-[#687082]'}>
                      {feat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Reviewer Transcripts Section */}
        <section className="bg-[#14161e] border border-[#242835] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#ff5a1f] mb-3">
            <Sparkles className="w-4 h-4" />
            <span>Indexed Road Test Transcripts</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-6">
            Reviewer Impressions & Road Findings
          </h2>

          <div className="space-y-4">
            {bike?.chunks && bike.chunks.length > 0 ? (
              bike.chunks.map((ch, idx) => (
                <div
                  key={ch.chunk_id || idx}
                  className="bg-[#191c25] border border-[#252936] rounded-xl p-4"
                >
                  <div className="text-[11px] font-semibold text-[#8e95a5] mb-1">
                    Road Observation #{idx + 1}
                  </div>
                  <p className="text-xs text-[#d2d6e3] leading-relaxed italic">
                    &ldquo;{ch.text}&rdquo;
                  </p>
                </div>
              ))
            ) : chunkSource?.snippet ? (
              <div className="bg-[#191c25] border border-[#252936] rounded-xl p-4">
                <div className="text-[11px] font-semibold text-[#8e95a5] mb-1">
                  Road Observation
                </div>
                <p className="text-xs text-[#d2d6e3] leading-relaxed italic">
                  &ldquo;{chunkSource.snippet}&rdquo;
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#8e95a5]">
                No review excerpts directly linked for this model.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DetailsPage;