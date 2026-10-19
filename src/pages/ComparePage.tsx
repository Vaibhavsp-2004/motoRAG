import { useEffect, useState } from 'react';
import { NavBar } from '../components/NavBar';
import { Link } from 'react-router-dom';
import {
  listMotorcycles,
  getMotorcycleDetail,
  getChunkDetails,
  type MotorcycleBrief,
} from '../services/api';
import { getMotorcycleImage } from '../utils/motorcycleImages';
import {
  Scale,
  Plus,
  Trash2,
  ExternalLink,
  Check,
  X,
  Search,
} from 'lucide-react';

export const ComparePage = () => {
  const [compareBikes, setCompareBikes] = useState<MotorcycleBrief[]>([]);
  const [allBikes, setAllBikes] = useState<MotorcycleBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchModalQuery, setSearchModalQuery] = useState('');

  // Load all motorcycles for selection
  useEffect(() => {
    listMotorcycles().then((data) => {
      setAllBikes(data);
    });
  }, []);

  // Load bikes currently in compare list
  const loadCompareList = async () => {
    setLoading(true);
    try {
      const ids: string[] = JSON.parse(localStorage.getItem('compareList') || '[]');
      if (ids.length === 0) {
        setCompareBikes([]);
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
              youtube_url: chunk.youtube_url,
              engine_cc: chunk.specs?.engine_cc,
              power_bhp: chunk.specs?.power_bhp,
              mileage_kmpl: chunk.specs?.mileage_kmpl,
              ex_showroom_price_inr: chunk.specs?.ex_showroom_price_inr,
            };
          }
        }
        if (b) fetched.push(b);
      }
      setCompareBikes(fetched);
    } catch {
      setCompareBikes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompareList();
  }, []);

  const removeBike = (id: string) => {
    const ids: string[] = JSON.parse(localStorage.getItem('compareList') || '[]');
    const next = ids.filter((item) => item !== id);
    localStorage.setItem('compareList', JSON.stringify(next));
    window.dispatchEvent(new Event('storage'));
    setCompareBikes((prev) => prev.filter((b) => b.motorcycle_id !== id));
  };

  const addBike = (bike: MotorcycleBrief) => {
    const ids: string[] = JSON.parse(localStorage.getItem('compareList') || '[]');
    if (!ids.includes(bike.motorcycle_id)) {
      ids.push(bike.motorcycle_id);
      localStorage.setItem('compareList', JSON.stringify(ids));
      window.dispatchEvent(new Event('storage'));
      loadCompareList();
    }
    setShowAddModal(false);
  };

  const clearAll = () => {
    localStorage.setItem('compareList', JSON.stringify([]));
    window.dispatchEvent(new Event('storage'));
    setCompareBikes([]);
  };

  const filteredModalBikes = allBikes.filter((b) =>
    `${b.brand} ${b.model}`.toLowerCase().includes(searchModalQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0c0d10] text-[#f2f3f5]">
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#222630]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#ff5a1f] mb-1">
              <Scale className="w-4 h-4" />
              <span>Head-to-Head Specification Matrix</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Compare Motorcycles Side-by-Side
            </h1>
            <p className="text-xs text-[#8e95a5] mt-1">
              Analyze power, torque, curb weight, ergonomics, and reviewer consensus across contenders.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff5a1f] hover:bg-[#e04b16] rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Motorcycle</span>
            </button>

            {compareBikes.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="px-3 py-2 text-xs font-semibold text-[#8e95a5] hover:text-white bg-[#191c24] rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#ff5a1f]/20 border-t-[#ff5a1f] rounded-full animate-spin" />
          </div>
        ) : compareBikes.length === 0 ? (
          <div className="bg-[#14161e] border border-[#242835] rounded-2xl p-12 text-center max-w-xl mx-auto my-12">
            <Scale className="w-10 h-10 text-[#687082] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">No Motorcycles Selected Yet</h2>
            <p className="text-xs text-[#8e95a5] mb-6 leading-relaxed">
              Add motorcycles from the catalog, search results, or click below to pick contenders from over 250 verified models.
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-5 py-2.5 bg-[#ff5a1f] hover:bg-[#e04b16] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Select Contenders</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-6">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-4 text-left font-bold text-[#8e95a5] w-48 bg-[#101218] border-b border-[#222630] sticky left-0 z-20">
                    Attributes
                  </th>
                  {compareBikes.map((bike) => (
                    <th
                      key={bike.motorcycle_id}
                      className="p-4 text-left bg-[#14161e] border-b border-[#222630] min-w-[240px]"
                    >
                      <div className="relative aspect-[16/10] bg-[#0c0d11] rounded-lg overflow-hidden border border-[#222634] mb-3 flex items-center justify-center p-2">
                        <img
                          src={getMotorcycleImage(bike.brand, bike.model, bike.body_type)}
                          alt={`${bike.brand} ${bike.model}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-[10px] text-[#8e95a5] uppercase font-semibold">
                            {bike.brand}
                          </div>
                          <div className="text-base font-bold text-white">{bike.model}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBike(bike.motorcycle_id)}
                          className="text-[#687082] hover:text-red-400 p-1 transition-colors"
                          title="Remove from comparison"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-bold text-[#ff5a1f] font-mono tabular-nums">
                          {bike.ex_showroom_price_inr
                            ? `₹${bike.ex_showroom_price_inr.toLocaleString('en-IN')}`
                            : 'On Request'}
                        </span>
                        <Link
                          to={`/details/${bike.motorcycle_id}`}
                          className="text-[11px] text-[#8e95a5] hover:text-white flex items-center gap-1"
                        >
                          <span>Specs</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#1e222c]">
                {/* Body Type */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Body Style
                  </td>
                  {compareBikes.map((b) => (
                    <td key={b.motorcycle_id} className="p-4 text-white">
                      {b.body_type || b.specs?.body_type || 'Motorcycle'}
                    </td>
                  ))}
                </tr>

                {/* Engine CC */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Engine Displacement
                  </td>
                  {compareBikes.map((b) => (
                    <td key={b.motorcycle_id} className="p-4 font-mono tabular-nums text-white">
                      {b.engine_cc || b.specs?.engine_cc ? `${b.engine_cc || b.specs?.engine_cc} cc` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Power */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Peak Power
                  </td>
                  {compareBikes.map((b) => (
                    <td key={b.motorcycle_id} className="p-4 font-mono tabular-nums text-white">
                      {b.power_bhp || b.specs?.power_bhp ? `${b.power_bhp || b.specs?.power_bhp} BHP` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Torque */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Peak Torque
                  </td>
                  {compareBikes.map((b) => (
                    <td key={b.motorcycle_id} className="p-4 font-mono tabular-nums text-white">
                      {b.specs?.torque_nm ? `${b.specs.torque_nm} Nm` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Mileage */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Claimed Mileage
                  </td>
                  {compareBikes.map((b) => (
                    <td key={b.motorcycle_id} className="p-4 font-mono tabular-nums text-white">
                      {b.mileage_kmpl || b.specs?.mileage_kmpl ? `${b.mileage_kmpl || b.specs?.mileage_kmpl} kmpl` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Kerb Weight */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Kerb Weight
                  </td>
                  {compareBikes.map((b) => (
                    <td key={b.motorcycle_id} className="p-4 font-mono tabular-nums text-white">
                      {b.specs?.kerb_weight_kg ? `${b.specs.kerb_weight_kg} kg` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Power-to-weight */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Power-to-Weight
                  </td>
                  {compareBikes.map((b) => {
                    const power = b.power_bhp || b.specs?.power_bhp;
                    const weight = b.specs?.kerb_weight_kg;
                    const ptw = power && weight ? ((power / weight) * 1000).toFixed(1) : null;
                    return (
                      <td key={b.motorcycle_id} className="p-4 font-mono tabular-nums text-[#ff5a1f] font-semibold">
                        {ptw ? `${ptw} BHP/ton` : 'N/A'}
                      </td>
                    );
                  })}
                </tr>

                {/* Seat Height */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Seat Height
                  </td>
                  {compareBikes.map((b) => (
                    <td key={b.motorcycle_id} className="p-4 font-mono tabular-nums text-white">
                      {b.specs?.seat_height_mm ? `${b.specs.seat_height_mm} mm` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* Ground Clearance */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Ground Clearance
                  </td>
                  {compareBikes.map((b) => (
                    <td key={b.motorcycle_id} className="p-4 font-mono tabular-nums text-white">
                      {b.specs?.ground_clearance_mm ? `${b.specs.ground_clearance_mm} mm` : 'N/A'}
                    </td>
                  ))}
                </tr>

                {/* ABS */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    ABS Safety
                  </td>
                  {compareBikes.map((b) => (
                    <td key={b.motorcycle_id} className="p-4 text-white">
                      {b.specs?.abs_channels || 'Standard'}
                    </td>
                  ))}
                </tr>

                {/* Bluetooth */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    Bluetooth & Nav
                  </td>
                  {compareBikes.map((b) => {
                    const hasBt = b.specs?.bluetooth_yn === 'Yes';
                    return (
                      <td key={b.motorcycle_id} className="p-4">
                        {hasBt ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Yes
                          </span>
                        ) : (
                          <span className="text-[#687082] flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> No
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* USB Charging */}
                <tr className="hover:bg-[#12141a]">
                  <td className="p-4 text-[#8e95a5] font-semibold bg-[#101218] sticky left-0">
                    USB Charging Port
                  </td>
                  {compareBikes.map((b) => {
                    const hasUsb = b.specs?.usb_charging_yn === 'Yes';
                    return (
                      <td key={b.motorcycle_id} className="p-4">
                        {hasUsb ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Yes
                          </span>
                        ) : (
                          <span className="text-[#687082] flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> No
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Add Motorcycle to Compare */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#14161e] border border-[#262a38] rounded-2xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#20242e] mb-4">
                <h3 className="text-base font-bold text-white">Add Motorcycle to Compare</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[#8e95a5] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="w-4 h-4 text-[#8e95a5] absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchModalQuery}
                  onChange={(e) => setSearchModalQuery(e.target.value)}
                  placeholder="Search manufacturer or model..."
                  className="w-full bg-[#1b1e28] border border-[#2b303f] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#687082] focus:outline-none focus:border-[#ff5a1f]"
                  autoFocus
                />
              </div>

              <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                {filteredModalBikes.slice(0, 30).map((bike) => (
                  <div
                    key={bike.motorcycle_id}
                    onClick={() => addBike(bike)}
                    className="p-3 bg-[#191c26] hover:bg-[#222736] rounded-xl border border-[#252936] cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] text-[#8e95a5] uppercase font-semibold">
                        {bike.brand}
                      </div>
                      <div className="text-sm font-bold text-white">{bike.model}</div>
                      <div className="text-[11px] text-[#687082]">
                        {bike.engine_cc ? `${bike.engine_cc}cc · ` : ''}
                        {bike.power_bhp ? `${bike.power_bhp} BHP` : ''}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#ff5a1f]">Add +</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ComparePage;
