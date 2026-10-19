// src/utils/motorcycleImages.ts

const HIMALAYAN_IMG = '/src/assets/images/bikewale_himalayan_450_1791707309883.jpg';
const APRILIA_IMG = '/src/assets/images/bikewale_aprilia_rs_457_1791707325473.jpg';
const DUKE_IMG = '/src/assets/images/bikewale_ktm_duke_390_1791707340715.jpg';
const SPEED400_IMG = '/src/assets/images/bikewale_triumph_speed_400_1791707354221.jpg';
const ADVENTURE_IMG = '/src/assets/images/moto_adventure_trail_1791706004672.jpg';
const SPORT_IMG = '/src/assets/images/moto_sport_apex_1791706016325.jpg';
const ROADSTER_IMG = '/src/assets/images/moto_classic_roadster_1791706029378.jpg';

export function getMotorcycleImage(brand?: string, model?: string, bodyType?: string): string {
  const combined = `${brand || ''} ${model || ''}`.toLowerCase();
  const type = (bodyType || '').toLowerCase();

  // Exact model matches
  if (combined.includes('himalayan')) return HIMALAYAN_IMG;
  if (combined.includes('rs 457') || combined.includes('rs457')) return APRILIA_IMG;
  if (combined.includes('duke') || combined.includes('ktm 390') || combined.includes('ktm 250')) return DUKE_IMG;
  if (combined.includes('speed 400') || combined.includes('scrambler 400') || combined.includes('triumph speed')) return SPEED400_IMG;

  // Brand / category based studio shots
  if (combined.includes('aprilia') || combined.includes('panigale') || combined.includes('ninja') || combined.includes('r15') || combined.includes('rr 310') || combined.includes('rc 390') || type.includes('sport')) {
    return APRILIA_IMG;
  }

  if (combined.includes('adventure') || combined.includes('v-strom') || combined.includes('xpulse') || combined.includes('tiger') || combined.includes('gs') || type.includes('adventure')) {
    return HIMALAYAN_IMG;
  }

  if (combined.includes('pulsar') || combined.includes('mt-15') || combined.includes('gixxer') || combined.includes('hornet') || combined.includes('street') || type.includes('naked')) {
    return DUKE_IMG;
  }

  if (combined.includes('classic') || combined.includes('bullet') || combined.includes('meteor') || combined.includes('hunter') || combined.includes('jawa') || combined.includes('yezdi') || combined.includes('interceptor') || type.includes('cruiser') || type.includes('roadster')) {
    return SPEED400_IMG;
  }

  // Fallbacks by body type
  if (type.includes('adventure') || type.includes('tourer')) return ADVENTURE_IMG;
  if (type.includes('sport') || type.includes('superbike')) return SPORT_IMG;
  if (type.includes('cruiser') || type.includes('retro')) return ROADSTER_IMG;

  return DUKE_IMG;
}
