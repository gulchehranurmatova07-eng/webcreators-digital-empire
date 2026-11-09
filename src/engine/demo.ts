// Demo website generator: turns a business brand into a complete, polished website.
// Three visual styles × several copy variants, all built from category-specific content.
import { LOCATIONS, CITY_NAME } from './config';
import { contrastRatio, siteBackground } from './website';
import type { Business, CategoryId, SectionData, SectionType, SiteItem, SiteTheme } from './types';

export type DemoStyle = 'signature' | 'bold' | 'luxe';

export const DEMO_STYLES: { id: DemoStyle; name: string; description: string }[] = [
  { id: 'signature', name: 'Signature', description: 'Dark, centered and confident.' },
  { id: 'bold', name: 'Bold', description: 'Bright, split layout, modern type.' },
  { id: 'luxe', name: 'Luxe', description: 'Elegant serif, gallery-first, premium.' },
];

interface Copy {
  heroes: string[];
  subs: string[];
  cta: string[];
  aboutTitle: string;
  about: string[];
  itemsTitle: string;
  items: SiteItem[];
  galleryTitle: string;
  images: string[];
  hero: string;
  ctaHeading: string[];
  hours: string;
}

const COPY: Record<CategoryId, Copy> = {
  restaurant: {
    heroes: ['Welcome to {name}', 'Fresh food, made with heart', 'Your table is waiting'],
    subs: ['Seasonal dishes cooked from scratch every day in {district}.', 'Hand-made pasta, wood-fired mains and desserts worth saving room for.', 'Real ingredients, warm service and a room full of good conversations.'],
    cta: ['Book a table', 'Reserve now', 'See the menu'],
    aboutTitle: 'Our kitchen', about: ['{name} started with one simple idea: cook the food we love, for the people we love. Our chefs shop the market every morning and the menu changes with the seasons.', 'We believe a great meal is about more than food. It is the light, the music, the people and the care in every plate. Come hungry, leave happy.'],
    itemsTitle: 'Menu', items: [
      { name: 'Burrata & tomatoes', price: '9', description: 'Heirloom tomatoes, basil oil' },
      { name: 'Truffle tagliatelle', price: '16', description: 'Fresh pasta, parmesan, black truffle' },
      { name: 'Grilled sea bass', price: '19', description: 'Lemon butter, herb potatoes' },
      { name: 'Wood-fired pizza', price: '13', description: 'San Marzano, mozzarella, basil' },
      { name: 'Tiramisu', price: '7', description: 'Our grandmother’s recipe' },
      { name: 'Chocolate fondant', price: '8', description: 'Molten centre, vanilla ice cream' },
    ],
    galleryTitle: 'Inside {name}', images: ['dining', 'dish', 'city'], hero: 'dining', ctaHeading: ['Hungry yet?', 'Tonight’s table is yours'], hours: 'Daily 12:00–23:00',
  },
  coffee: {
    heroes: ['Good mornings start at {name}', 'Coffee worth waking up for', 'Your daily ritual'],
    subs: ['Specialty coffee, fresh pastries and a seat by the window.', 'Single-origin beans roasted in small batches.', 'The calm corner of {district}.'],
    cta: ['Order ahead', 'Visit us', 'See the menu'],
    aboutTitle: 'Our beans', about: ['We work directly with small farms and roast every week, so each cup tastes the way it should. Our baristas will happily help you find your new favourite.', '{name} is a place to slow down. Bring a book, meet a friend, or just enjoy ten quiet minutes with a perfect flat white.'],
    itemsTitle: 'Coffee & treats', items: [
      { name: 'Flat white', price: '4', description: 'Double ristretto, silky milk' },
      { name: 'Cold brew', price: '4.5', description: 'Steeped for 18 hours' },
      { name: 'Oat latte', price: '4.5', description: 'Creamy and smooth' },
      { name: 'Butter croissant', price: '3', description: 'Baked every morning' },
      { name: 'Cardamom bun', price: '3.5', description: 'Our bestseller' },
    ],
    galleryTitle: 'The café', images: ['coffee', 'nature', 'city'], hero: 'coffee', ctaHeading: ['Your cup is ready', 'See you tomorrow morning?'], hours: 'Mon–Sun 7:00–19:00',
  },
  hotel: {
    heroes: ['{name}', 'Stay somewhere unforgettable', 'Rest in the heart of {city}'],
    subs: ['Bright rooms, a calm spa and breakfast with a view.', 'Boutique comfort in {district}, steps from everything.', 'Wake up to the sound of the bay.'],
    cta: ['Check availability', 'Book your stay', 'View rooms'],
    aboutTitle: 'Your stay', about: ['Every room at {name} is designed for deep sleep and slow mornings: soft linens, blackout curtains and rain showers. Our concierge knows every secret spot in the city.', 'Whether you are here for business or a weekend away, we take care of the details so you can enjoy the moment.'],
    itemsTitle: 'Rooms & suites', items: [
      { name: 'Classic room', price: '95', description: 'Queen bed, city view' },
      { name: 'Deluxe room', price: '140', description: 'King bed, private balcony' },
      { name: 'Bay suite', price: '230', description: 'Living room, panoramic bay view' },
      { name: 'Spa package', price: '60', description: 'Massage and thermal pools' },
    ],
    galleryTitle: 'Moments', images: ['room', 'pool', 'city'], hero: 'room', ctaHeading: ['Your room is waiting', 'Plan your escape'], hours: 'Reception open 24/7',
  },
  clothing: {
    heroes: ['New season. New you.', '{name}', 'Made to be worn'],
    subs: ['Discover the latest {name} collection.', 'Timeless pieces, designed in {city}.', 'Quality fabrics, honest prices.'],
    cta: ['Shop now', 'Explore the collection', 'Find your fit'],
    aboutTitle: 'Our story', about: ['{name} designs clothes that last. We pick every fabric by hand and work with small workshops that pay fair wages.', 'Less but better: a wardrobe of pieces you will reach for again and again.'],
    itemsTitle: 'Bestsellers', items: [
      { name: 'Oversized blazer', price: '89', description: 'Wool blend, relaxed fit' },
      { name: 'Linen shirt', price: '45', description: 'Breathable summer classic' },
      { name: 'Wide-leg trousers', price: '65', description: 'High waist, soft drape' },
      { name: 'Knit sweater', price: '59', description: 'Merino, five colours' },
      { name: 'Leather tote', price: '120', description: 'Fits a laptop' },
    ],
    galleryTitle: 'The collection', images: ['fashion', 'store', 'city'], hero: 'fashion', ctaHeading: ['Find your new favourite', 'Free returns on every order'], hours: 'Mon–Sat 10:00–20:00',
  },
  agency: {
    heroes: ['We build digital products people love.', 'Websites that win customers', 'Design. Code. Growth.'],
    subs: ['{name} designs websites, brands and apps for ambitious businesses.', 'Strategy, design and development under one roof in {district}.', 'Fast, beautiful websites that turn visitors into clients.'],
    cta: ['Start a project', 'Book a free call', 'See our work'],
    aboutTitle: 'Who we are', about: ['A small team of designers and developers who care about craft, clear communication and measurable results.', 'We have launched websites for restaurants, hotels, shops and startups across {city}. Every project starts with listening.'],
    itemsTitle: 'Services', items: [
      { name: 'Website design', price: '1200', description: 'Responsive, fast, beautiful' },
      { name: 'Brand identity', price: '800', description: 'Logo, colours, typography' },
      { name: 'SEO audit', price: '400', description: 'Get found on search engines' },
      { name: 'Online store', price: '2000', description: 'Sell 24/7' },
    ],
    galleryTitle: 'Recent work', images: ['workspace', 'team', 'launch'], hero: 'workspace', ctaHeading: ['Have a project in mind?', 'Let’s build something great'], hours: 'Mon–Fri 9:00–18:00',
  },
  startup: {
    heroes: ['Meet {name}', 'Work smarter, not harder', 'The future, simplified'],
    subs: ['The all-in-one app that saves your team hours every week.', 'Built in {district} for teams that move fast.', 'Join thousands of happy users.'],
    cta: ['Start free trial', 'Get early access', 'Watch the demo'],
    aboutTitle: 'Why {name}', about: ['We started {name} because we were tired of juggling ten tools. Now everything lives in one place: simple, fast and secure.', 'Our small team ships improvements every week, guided by feedback from people like you.'],
    itemsTitle: 'Pricing', items: [
      { name: 'Starter', price: '0', description: 'For individuals' },
      { name: 'Team', price: '12', description: 'Per user / month' },
      { name: 'Business', price: '29', description: 'Advanced security & support' },
    ],
    galleryTitle: 'Product tour', images: ['launch', 'workspace', 'team'], hero: 'launch', ctaHeading: ['Ready to get started?', 'Try it free for 14 days'], hours: 'Support 24/7',
  },
};

/** Shift a color lighter/darker until it reads on the background (contrast ≥ 3). */
export function ensureContrast(hex: string, mode: SiteTheme['mode']) {
  const bg = siteBackground(mode);
  let [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (let i = 0; i < 12 && contrastRatio(toHex(r, g, b), bg) < 3; i++) {
    if (mode === 'dark') { r += (255 - r) * 0.2; g += (255 - g) * 0.2; b += (255 - b) * 0.2; }
    else { r *= 0.8; g *= 0.8; b *= 0.8; }
  }
  return toHex(r, g, b);
}
const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();

const FONT_FOR: Record<CategoryId, SiteTheme['font']> = { restaurant: 'serif', hotel: 'serif', coffee: 'modern', clothing: 'grotesk', agency: 'grotesk', startup: 'grotesk' };

export function demoSite(b: Business, style: DemoStyle, variant: number): { theme: SiteTheme; sections: [SectionType, Partial<SectionData[SectionType]>][] } {
  const c = COPY[b.category];
  const v = Math.abs(Math.floor(variant));
  const pick = <T,>(arr: T[], o = 0) => arr[(v + o) % arr.length];
  const fill = (s: string) => s.replaceAll('{name}', b.name).replaceAll('{district}', LOCATIONS[b.location].name).replaceAll('{city}', CITY_NAME);
  const mode: SiteTheme['mode'] = style === 'bold' ? 'light' : 'dark';
  const theme: SiteTheme = {
    primary: ensureContrast(b.color.toUpperCase(), mode),
    mode,
    font: style === 'luxe' ? 'serif' : style === 'bold' ? 'grotesk' : FONT_FOR[b.category],
    radius: style === 'bold' ? 'sharp' : style === 'luxe' ? 'round' : 'soft',
  };
  const items = Array.from({ length: Math.min(c.items.length, style === 'bold' ? 4 : 3) }, (_, i) => c.items[(v + i) % c.items.length]);
  const hero = { heading: fill(pick(c.heroes)), subheading: fill(b.tagline || pick(c.subs, 1)), buttonText: pick(c.cta, 2), image: c.hero, align: (style === 'bold' ? 'left' : 'center') as 'left' | 'center' };
  const about = { title: fill(c.aboutTitle), text: fill(pick(c.about)) };
  const list = { title: c.itemsTitle, items };
  const gallery = { title: fill(c.galleryTitle), images: c.images };
  const contact = { title: 'Visit us', address: `${LOCATIONS[b.location].name}, ${CITY_NAME}`, hours: c.hours, phone: '+00 555 0' + (100 + (v % 900)) };
  const cta = { heading: pick(c.ctaHeading), buttonText: pick(c.cta) };
  const nav = { brand: b.name };
  const footer = { text: `© ${b.name} · ${CITY_NAME}` };
  const order: [SectionType, object][] =
    style === 'bold' ? [['nav', nav], ['hero', hero], ['items', list], ['gallery', gallery], ['cta', cta], ['contact', contact], ['footer', footer]]
      : style === 'luxe' ? [['nav', nav], ['hero', hero], ['about', about], ['gallery', gallery], ['items', list], ['cta', cta], ['contact', contact], ['footer', footer]]
        : [['nav', nav], ['hero', hero], ['about', about], ['items', list], ['gallery', gallery], ['contact', contact], ['footer', footer]];
  return { theme, sections: order as [SectionType, Partial<SectionData[SectionType]>][] };
}
