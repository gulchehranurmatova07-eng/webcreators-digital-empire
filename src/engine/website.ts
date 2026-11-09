// Website Creator model: templates, assets, section factories and the Website Quality Score.
import type { Section, SectionData, SectionType, SiteTheme, Website } from './types';

export interface AssetDef {
  id: string;
  label: string;
  icon: string;
  from: string;
  to: string;
  /** Illustrated scene drawn for this image (see src/art). */
  scene: { category: import('./types').CategoryId; color: string; name: string } | 'city';
}

/** Built-in image assets (drawn as gradient art + icon so the game ships no heavy photos). */
export const ASSETS: AssetDef[] = [
  { id: 'dining', label: 'Dining room', icon: 'utensils', from: '#7c2d12', to: '#f59e0b', scene: { category: 'restaurant', color: '#F97316', name: 'Bistro' } },
  { id: 'dish', label: 'Signature dish', icon: 'chef', from: '#14532d', to: '#84cc16', scene: { category: 'restaurant', color: '#22C55E', name: 'Kitchen' } },
  { id: 'coffee', label: 'Coffee bar', icon: 'coffee', from: '#3b2416', to: '#c08457', scene: { category: 'coffee', color: '#C08457', name: 'Café' } },
  { id: 'room', label: 'Hotel suite', icon: 'bed', from: '#1e3a8a', to: '#60a5fa', scene: { category: 'hotel', color: '#F5B942', name: 'Grand Hotel' } },
  { id: 'pool', label: 'Pool & spa', icon: 'waves', from: '#0e7490', to: '#5eead4', scene: { category: 'hotel', color: '#14B8A6', name: 'Spa' } },
  { id: 'fashion', label: 'Collection', icon: 'shirt', from: '#701a75', to: '#f472b6', scene: { category: 'clothing', color: '#EC4899', name: 'Atelier' } },
  { id: 'store', label: 'Storefront', icon: 'store', from: '#312e81', to: '#a78bfa', scene: { category: 'clothing', color: '#A78BFA', name: 'Boutique' } },
  { id: 'workspace', label: 'Workspace', icon: 'monitor', from: '#0f172a', to: '#1E6BFF', scene: { category: 'agency', color: '#1E6BFF', name: 'Studio' } },
  { id: 'team', label: 'Team', icon: 'users', from: '#1f2937', to: '#58A6FF', scene: { category: 'agency', color: '#58A6FF', name: 'Our Team' } },
  { id: 'city', label: 'City view', icon: 'building', from: '#111827', to: '#6366f1', scene: 'city' },
  { id: 'nature', label: 'Bay at night', icon: 'leaf', from: '#064e3b', to: '#34d399', scene: 'city' },
  { id: 'launch', label: 'Launch', icon: 'rocket', from: '#4c1d95', to: '#1E6BFF', scene: { category: 'startup', color: '#A855F7', name: 'Launch' } },
];

export const assetById = (id: string) => ASSETS.find((a) => a.id === id) ?? ASSETS[0];

export const SITE_COLORS = ['#1E6BFF', '#0EA5E9', '#14B8A6', '#22C55E', '#F5B942', '#F97316', '#EF4444', '#EC4899', '#A855F7', '#0B1F44', '#111111', '#FFFFFF'];

export const FONTS: Record<SiteTheme['font'], { label: string; css: string }> = {
  modern: { label: 'Modern', css: "'Inter Variable', system-ui, sans-serif" },
  grotesk: { label: 'Grotesk', css: "'Space Grotesk Variable', system-ui, sans-serif" },
  serif: { label: 'Elegant', css: "Georgia, 'Times New Roman', serif" },
  mono: { label: 'Technical', css: "ui-monospace, 'SFMono-Regular', Menlo, monospace" },
};

export const SECTION_META: Record<SectionType, { label: string; icon: string; description: string }> = {
  nav: { label: 'Navigation', icon: 'menu', description: 'Logo and links to your sections' },
  hero: { label: 'Hero', icon: 'sparkles', description: 'Big first impression with a button' },
  about: { label: 'About', icon: 'info', description: 'Tell your story' },
  items: { label: 'Menu / Products', icon: 'list', description: 'What you sell, with prices' },
  gallery: { label: 'Gallery', icon: 'image', description: 'Show off with images' },
  cta: { label: 'Call to action', icon: 'pointer', description: 'Ask visitors to act' },
  contact: { label: 'Contact', icon: 'map', description: 'Address, hours, phone' },
  footer: { label: 'Footer', icon: 'footer', description: 'Closing line and copyright' },
};

export const SECTION_ORDER: SectionType[] = ['nav', 'hero', 'about', 'items', 'gallery', 'cta', 'contact', 'footer'];

const DEFAULTS: { [K in SectionType]: SectionData[K] } = {
  nav: { brand: 'My Business' },
  hero: { heading: 'Welcome', subheading: 'Tell visitors what makes you special.', buttonText: 'Get started', image: 'city', align: 'center' },
  about: { title: 'About us', text: 'Write a few sentences about who you are and why customers love you.' },
  items: { title: 'What we offer', items: [{ name: 'First item', price: '10', description: 'Short description' }] },
  gallery: { title: 'Gallery', images: ['city', 'team', 'workspace'] },
  cta: { heading: 'Ready to visit?', buttonText: 'Contact us' },
  contact: { title: 'Find us', address: '', hours: '', phone: '' },
  footer: { text: '© My Business' },
};

export function makeSection<K extends SectionType>(type: K, id: string, data?: Partial<SectionData[K]>): Section {
  return { id, type, data: { ...structuredClone(DEFAULTS[type]), ...data } } as unknown as Section;
}

export interface TemplateDef {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  theme: SiteTheme;
  build: (brand: string) => [SectionType, Partial<SectionData[SectionType]>][];
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: 'starter', name: 'Starter', description: 'A clean blank canvas: navigation, hero and footer.', unlockLevel: 1,
    theme: { primary: '#1E6BFF', mode: 'dark', font: 'modern', radius: 'soft' },
    build: (b) => [['nav', { brand: b }], ['hero', { heading: b, subheading: 'Your story starts here.', buttonText: 'Learn more' }], ['footer', { text: `© ${b}` }]],
  },
  {
    id: 'bistro', name: 'Bistro', description: 'Warm restaurant layout with menu and reservations.', unlockLevel: 1,
    theme: { primary: '#F97316', mode: 'dark', font: 'serif', radius: 'soft' },
    build: (b) => [
      ['nav', { brand: b }],
      ['hero', { heading: `Welcome to ${b}`, subheading: 'Seasonal food, made with care.', buttonText: 'Book a table', image: 'dining' }],
      ['items', { title: 'Our menu', items: [
        { name: 'Garden salad', price: '8', description: 'Crisp greens, lemon dressing' },
        { name: 'Grilled salmon', price: '18', description: 'With herb potatoes' },
        { name: 'Chocolate tart', price: '7', description: 'Dark chocolate, sea salt' },
      ] }],
      ['gallery', { title: 'Inside our kitchen', images: ['dining', 'dish', 'coffee'] }],
      ['contact', { title: 'Visit us', address: '12 Harbor Street, Novara Bay', hours: 'Daily 12:00–22:00', phone: '+00 123 456' }],
      ['footer', { text: `© ${b}` }],
    ],
  },
  {
    id: 'grandstay', name: 'Grand Stay', description: 'Elegant hotel site focused on bookings.', unlockLevel: 1,
    theme: { primary: '#F5B942', mode: 'dark', font: 'serif', radius: 'sharp' },
    build: (b) => [
      ['nav', { brand: b }],
      ['hero', { heading: b, subheading: 'Rest well in the heart of the city.', buttonText: 'Check availability', image: 'room' }],
      ['about', { title: 'Your stay', text: 'Bright rooms, a calm spa and breakfast with a view. Everything you need for a perfect trip.' }],
      ['items', { title: 'Rooms', items: [
        { name: 'Classic room', price: '90', description: 'Queen bed, city view' },
        { name: 'Deluxe room', price: '140', description: 'King bed, balcony' },
        { name: 'Suite', price: '220', description: 'Living room, spa access' },
      ] }],
      ['cta', { heading: 'Your room is waiting', buttonText: 'Book now' }],
      ['footer', { text: `© ${b}` }],
    ],
  },
  {
    id: 'atelier', name: 'Atelier', description: 'Bold fashion layout with collection showcase.', unlockLevel: 1,
    theme: { primary: '#EC4899', mode: 'light', font: 'grotesk', radius: 'sharp' },
    build: (b) => [
      ['nav', { brand: b }],
      ['hero', { heading: 'New season. New you.', subheading: `Discover the latest ${b} collection.`, buttonText: 'Shop now', image: 'fashion', align: 'left' }],
      ['gallery', { title: 'The collection', images: ['fashion', 'store', 'city'] }],
      ['items', { title: 'Bestsellers', items: [
        { name: 'Oversized blazer', price: '79', description: 'Wool blend' },
        { name: 'Linen shirt', price: '39', description: 'Breathable summer fit' },
      ] }],
      ['footer', { text: `© ${b}` }],
    ],
  },
  {
    id: 'studio', name: 'Studio', description: 'Sharp agency / tech layout with services.', unlockLevel: 1,
    theme: { primary: '#1E6BFF', mode: 'dark', font: 'grotesk', radius: 'round' },
    build: (b) => [
      ['nav', { brand: b }],
      ['hero', { heading: 'We build digital products people love.', subheading: `${b} designs websites, brands and apps.`, buttonText: 'Start a project', image: 'workspace', align: 'left' }],
      ['items', { title: 'Services', items: [
        { name: 'Website design', price: '1200', description: 'Responsive, fast, beautiful' },
        { name: 'Brand identity', price: '800', description: 'Logo, colors, typography' },
        { name: 'SEO audit', price: '400', description: 'Get found on search engines' },
      ] }],
      ['about', { title: 'Who we are', text: 'A small team of designers and developers who care about craft, clear communication and results.' }],
      ['contact', { title: "Let's talk", address: 'Tech Quarter, Novara Bay', hours: 'Mon–Fri 9:00–18:00', phone: '' }],
      ['footer', { text: `© ${b}` }],
    ],
  },
  {
    id: 'luxe', name: 'Luxe', description: 'Premium full-page layout. Unlocks at Founder Level 3.', unlockLevel: 3,
    theme: { primary: '#F5B942', mode: 'dark', font: 'serif', radius: 'round' },
    build: (b) => [
      ['nav', { brand: b }],
      ['hero', { heading: b, subheading: 'An experience worth remembering.', buttonText: 'Discover', image: 'pool' }],
      ['about', { title: 'Our philosophy', text: 'Every detail is chosen with intention: the materials, the service, the moments in between. This is quality you can feel.' }],
      ['gallery', { title: 'Moments', images: ['pool', 'room', 'nature'] }],
      ['items', { title: 'Signature offers', items: [
        { name: 'Signature package', price: '250', description: 'Our most loved experience' },
        { name: 'Private session', price: '180', description: 'Tailored just for you' },
        { name: 'Gift card', price: '100', description: 'Share the experience' },
      ] }],
      ['cta', { heading: 'Reserve your experience', buttonText: 'Reserve' }],
      ['contact', { title: 'Contact', address: 'Harbor District, Novara Bay', hours: 'By appointment', phone: '+00 555 010' }],
      ['footer', { text: `© ${b}` }],
    ],
  },
];

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);

// ---------- Contrast (WCAG) ----------
function luminance(hex: string) {
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
export const siteBackground = (mode: SiteTheme['mode']) => (mode === 'dark' ? '#0B1220' : '#FFFFFF');
export const readableOn = (bg: string) => (contrastRatio(bg, '#FFFFFF') >= contrastRatio(bg, '#0B1220') ? '#FFFFFF' : '#0B1220');

// ---------- Quality score ----------
export interface QualityCheck {
  id: string;
  label: string;
  tip: string;
  points: number;
  passed: boolean;
}

export function qualityChecks(site: Website): QualityCheck[] {
  const find = <K extends SectionType>(t: K) =>
    site.sections.find((s) => s.type === t) as Extract<Section, { type: K }> | undefined;
  const nav = find('nav');
  const hero = find('hero');
  const items = find('items');
  const about = find('about');
  const contact = find('contact');
  const gallery = find('gallery');
  const footer = find('footer');
  const first = site.sections[0];
  const last = site.sections[site.sections.length - 1];
  const contrast = contrastRatio(site.theme.primary, siteBackground(site.theme.mode));
  return [
    { id: 'nav', label: 'Navigation bar', tip: 'Add a Navigation section so visitors can find their way.', points: 10, passed: !!nav && nav.data.brand.trim().length >= 2 },
    { id: 'hero', label: 'Clear main heading', tip: 'Add a Hero section with a heading of at least 4 characters.', points: 15, passed: !!hero && hero.data.heading.trim().length >= 4 },
    { id: 'cta', label: 'Call-to-action button', tip: 'Give your Hero (or a Call-to-action section) button text like "Book now".', points: 10, passed: (!!hero && hero.data.buttonText.trim().length > 0) || (!!find('cta') && find('cta')!.data.buttonText.trim().length > 0) },
    { id: 'items', label: 'At least 3 products', tip: 'Add a Menu / Products section with 3 or more named items.', points: 15, passed: !!items && items.data.items.filter((i) => i.name.trim()).length >= 3 },
    { id: 'about', label: 'Your story (40+ characters)', tip: 'Add an About section and write a couple of sentences.', points: 10, passed: !!about && about.data.text.trim().length >= 40 },
    { id: 'contact', label: 'Contact details', tip: 'Add a Contact section with an address or phone number.', points: 10, passed: !!contact && (contact.data.address.trim().length > 0 || contact.data.phone.trim().length > 0) },
    { id: 'images', label: 'Visuals', tip: 'Add a Gallery section with at least 2 images.', points: 10, passed: !!gallery && gallery.data.images.length >= 2 },
    { id: 'footer', label: 'Footer', tip: 'End the page with a Footer section.', points: 5, passed: !!footer },
    { id: 'contrast', label: 'Readable brand color', tip: `Your brand color is hard to read on this background (contrast ${contrast.toFixed(1)}:1, need 3:1). Pick another color or switch light/dark.`, points: 10, passed: contrast >= 3 },
    { id: 'order', label: 'Logical layout', tip: 'Keep Navigation first and Footer last.', points: 5, passed: first?.type === 'nav' && last?.type === 'footer' },
  ];
}

export const qualityScore = (site: Website) =>
  qualityChecks(site).reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);

/** How a linked, published website helps a business. */
export function websiteEffects(site: Website | undefined) {
  if (!site || !site.published) return { visibility: 0, conversion: 0, satisfaction: 0 };
  const q = qualityScore(site);
  return {
    visibility: Math.round(q * 0.25),
    conversion: q >= 60 ? 0.1 : 0,
    satisfaction: q >= 75 ? 4 : 0,
  };
}
