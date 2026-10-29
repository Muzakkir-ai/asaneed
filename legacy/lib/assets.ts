import type {Artwork} from './artworkCatalog';
/** Fonts and artwork are not bundled with the site; they load from the admin-configured GitHub repo
 * (expected layout: fonts/*.ttf, svg/*.svg, svg/riwayah-aimma/**) via the jsDelivr CDN (CORS-friendly). */
let base = '';
let artwork:Artwork[]=[];
export const currentArtwork=()=>artwork;
export const currentArtworkBase=()=>base;
export const assetBase = () => base;
export const hasAssets = () => base !== '';

export function cdnBase(repository: string, branch: string) {
  const m = repository.trim().match(/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  return m ? `https://cdn.jsdelivr.net/gh/${m[1]}/${m[2]}@${branch || 'main'}` : '';
}

const FONTS: [string, string, string][] = [
  ['Bahij Muna', 'BahijMuna-Bold.ttf', 'font-weight:400 700'],
  ['Bahij Muna', 'BahijMuna-Black.ttf', 'font-weight:800 900'],
  ['Majalla', 'MAJALLA.TTF', 'font-weight:400'],
  ['Majalla', 'MAJALLAB.TTF', 'font-weight:700'],
  ['Sakkal Kitab', 'SakkalKitab-Regular.ttf', 'font-weight:400'],
  ['Sakkal Kitab', 'SakkalKitab-Bold.ttf', 'font-weight:700'],
  ['KSA Regular', 'KSARegular.ttf', 'font-weight:400'],
  ['KSA Regular', 'KSARegular_B.ttf', 'font-weight:700'],
  ['DigitalKhattV2', 'DigitalKhattV2.ttf', 'font-weight:400'],
  ['QCF2', 'QCF2375.TTF', 'font-weight:400'],
  ['KFGQPC Symbols', 'kfgqpc-arabic-symbols-01-regular_ufonts.com.ttf', 'font-weight:400'],
];

export function applyAssets(repository: string, branch: string, revision = '',catalog:Artwork[] = []) {
  artwork=catalog;
  base = cdnBase(repository, /^[a-f0-9]{40}$/.test(revision)?revision:branch);
  let el = document.getElementById('remote-assets') as HTMLStyleElement | null;
  if (!el) { el = document.createElement('style'); el.id = 'remote-assets'; document.head.appendChild(el); }
  if (!base) { el.textContent = ''; return; }
  const fonts = FONTS.map(([f, file, w]) => `@font-face{font-family:'${f}';src:url('${base}/fonts/${file}') format('truetype');${w};font-display:swap;}`).join('\n');
  const mask = (sel: string, file: string, extra: string) =>
    `${sel}{-webkit-mask-image:url('${base}/svg/${file}');mask-image:url('${base}/svg/${file}');${extra}}`;
  el.textContent = [
    fonts,
    mask('.certificate-ornament', 'border-black.svg', ''),
    mask('.certificate-basmalah-svg', 'basmalah.svg', ''),
    mask('.certificate-ijazah-svg', 'ijazah.svg', ''),
  ].join('\n');
}
