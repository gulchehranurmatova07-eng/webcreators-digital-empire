// Digital Academy content. Answers are graded by the engine (not the UI) so rewards can't be faked.

export type Question =
  | { type: 'choice'; prompt: string; options: string[]; answer: number; explain: string }
  | {
      type: 'code';
      prompt: string;
      lang: 'html' | 'css';
      starter: string;
      placeholder: string;
      /** Regex sources tested against the normalized answer (lowercase, single spaces). All must match. */
      accepts: string[];
      hint: string;
      explain: string;
    };

export interface Lesson {
  id: string;
  track: TrackId;
  title: string;
  minutes: number;
  intro: string[];
  example?: string;
  questions: Question[];
  xp: number;
  coins: number;
}

export type TrackId = 'html' | 'css' | 'business';

export const TRACKS: Record<TrackId, { name: string; icon: string; description: string }> = {
  html: { name: 'HTML Foundations', icon: 'code', description: 'The structure of every web page.' },
  css: { name: 'CSS Styling', icon: 'palette', description: 'Colors, fonts and layouts.' },
  business: { name: 'Entrepreneurship', icon: 'briefcase', description: 'Run smarter businesses.' },
};

export const LESSONS: Lesson[] = [
  // ---------------- HTML ----------------
  {
    id: 'html-1', track: 'html', title: 'Tags & headings', minutes: 3, xp: 60, coins: 30,
    intro: [
      'HTML describes what each piece of a page *is*. You wrap content in tags: an opening tag like <h1> and a closing tag like </h1>.',
      'Headings go from <h1> (the most important, usually the page title) to <h6>. A page should have one clear <h1>.',
    ],
    example: '<h1>Bella Cucina</h1>\n<p>Fresh pasta every day.</p>',
    questions: [
      { type: 'choice', prompt: 'Which tag is used for the main page title?', options: ['<title-big>', '<h1>', '<p>', '<head>'], answer: 1, explain: '<h1> is the top-level heading. <head> holds page settings, not visible content.' },
      { type: 'choice', prompt: 'What does the "/" in </p> mean?', options: ['It is a comment', 'It closes the tag', 'It makes text italic', 'It is a typo'], answer: 1, explain: 'A slash marks a closing tag: everything between <p> and </p> is the paragraph.' },
      {
        type: 'code', lang: 'html', prompt: 'Write a main heading that says: Digital Empire', starter: '', placeholder: '<h1>…</h1>',
        accepts: ['^<h1>\\s*digital empire\\s*</h1>$'], hint: 'Open with <h1>, write the text, close with </h1>.',
        explain: '<h1>Digital Empire</h1> — opening tag, content, closing tag.',
      },
    ],
  },
  {
    id: 'html-2', track: 'html', title: 'Links & buttons', minutes: 3, xp: 60, coins: 30,
    intro: [
      'Links connect pages. The <a> tag needs an href attribute telling the browser where to go: <a href="/menu">Menu</a>.',
      'A <button> is for actions on the page, like "Book now". Good call-to-action buttons use short verbs.',
    ],
    example: '<a href="/menu">See our menu</a>\n<button>Book a table</button>',
    questions: [
      { type: 'choice', prompt: 'Which attribute tells a link where to go?', options: ['src', 'href', 'link', 'go'], answer: 1, explain: 'href (hypertext reference) holds the destination URL.' },
      { type: 'choice', prompt: 'Which button text is the strongest call-to-action?', options: ['Click here', 'Submit', 'Book your table', 'Button'], answer: 2, explain: 'Specific action verbs tell visitors exactly what happens next.' },
      {
        type: 'code', lang: 'html', prompt: 'Create a link to "/contact" with the text: Contact us', starter: '', placeholder: '<a href="…">…</a>',
        accepts: ['^<a href=["\']/contact["\']>\\s*contact us\\s*</a>$'], hint: 'Use <a href="/contact"> … </a>.',
        explain: '<a href="/contact">Contact us</a>',
      },
    ],
  },
  {
    id: 'html-3', track: 'html', title: 'Images & lists', minutes: 4, xp: 70, coins: 35,
    intro: [
      'Images use the <img> tag with src (the file) and alt (a text description). alt text helps blind visitors and search engines.',
      'Lists group items: <ul> is a bulleted list, and each item is an <li>.',
    ],
    example: '<img src="pasta.jpg" alt="Fresh tagliatelle">\n<ul>\n  <li>Pasta</li>\n  <li>Pizza</li>\n</ul>',
    questions: [
      { type: 'choice', prompt: 'Why should every image have alt text?', options: ['It makes images load faster', 'It describes the image for screen readers and SEO', 'It adds a border', 'It is required for colors'], answer: 1, explain: 'alt text is read aloud by screen readers and helps search engines understand images.' },
      { type: 'choice', prompt: 'Which tag is a single item inside a list?', options: ['<item>', '<li>', '<ul>', '<list>'], answer: 1, explain: '<li> means list item. <ul> is the list itself.' },
      {
        type: 'code', lang: 'html', prompt: 'Write a bulleted list (<ul>) with two items: Coffee and Tea', starter: '', placeholder: '<ul><li>…</li>…</ul>',
        accepts: ['^<ul>\\s*<li>\\s*coffee\\s*</li>\\s*<li>\\s*tea\\s*</li>\\s*</ul>$'], hint: 'Wrap two <li> items inside <ul> … </ul>.',
        explain: '<ul><li>Coffee</li><li>Tea</li></ul>',
      },
    ],
  },
  // ---------------- CSS ----------------
  {
    id: 'css-1', track: 'css', title: 'Colors', minutes: 3, xp: 60, coins: 30,
    intro: [
      'CSS styles HTML. A rule has a property and a value: color: blue;',
      'color changes text color, background-color changes the background. Hex codes like #1E6BFF give exact brand colors.',
    ],
    example: 'h1 { color: #1E6BFF; }\nbody { background-color: #050A14; }',
    questions: [
      { type: 'choice', prompt: 'Which property changes the text color?', options: ['font-color', 'text-color', 'color', 'foreground'], answer: 2, explain: 'It is simply color. font-color does not exist in CSS.' },
      { type: 'choice', prompt: 'Why does contrast between text and background matter?', options: ['It does not', 'Low contrast is hard to read for many people', 'It changes the font', 'It speeds up the page'], answer: 1, explain: 'Good contrast makes your site readable for everyone, including people with low vision.' },
      {
        type: 'code', lang: 'css', prompt: 'Write a declaration that makes text the brand blue #1E6BFF', starter: '', placeholder: 'color: …;',
        accepts: ['^color\\s*:\\s*#1e6bff\\s*;?$'], hint: 'property: value;  →  color: #1E6BFF;',
        explain: 'color: #1E6BFF;',
      },
    ],
  },
  {
    id: 'css-2', track: 'css', title: 'Fonts & spacing', minutes: 3, xp: 60, coins: 30,
    intro: [
      'font-size sets text size, font-weight sets boldness (400 normal, 700 bold).',
      'padding is space *inside* an element; margin is space *outside* it. Generous spacing makes designs look premium.',
    ],
    example: 'h1 { font-size: 32px; font-weight: 700; }\n.card { padding: 16px; margin-bottom: 24px; }',
    questions: [
      { type: 'choice', prompt: 'Which adds space inside a card, between its border and content?', options: ['margin', 'padding', 'gap-outside', 'border'], answer: 1, explain: 'padding is inner space; margin pushes other elements away.' },
      { type: 'choice', prompt: 'What does font-weight: 700 do?', options: ['Makes text bold', 'Makes text 700px tall', 'Makes text italic', 'Nothing'], answer: 0, explain: '700 is the standard bold weight.' },
      {
        type: 'code', lang: 'css', prompt: 'Set the font size to 24px', starter: '', placeholder: 'font-size: …;',
        accepts: ['^font-size\\s*:\\s*24px\\s*;?$'], hint: 'font-size: 24px;',
        explain: 'font-size: 24px;',
      },
    ],
  },
  {
    id: 'css-3', track: 'css', title: 'Responsive layouts', minutes: 4, xp: 70, coins: 35,
    intro: [
      'Most visitors use phones. A responsive site adapts its layout to the screen width.',
      'display: flex lines items up in a row. A media query like @media (min-width: 768px) { … } applies styles only on bigger screens.',
    ],
    example: '.menu { display: flex; gap: 16px; }\n@media (min-width: 768px) {\n  .menu { gap: 32px; }\n}',
    questions: [
      { type: 'choice', prompt: 'Why design "mobile first"?', options: ['Phones are the most common way people browse', 'Desktop is illegal', 'It is required by HTML', 'It removes colors'], answer: 0, explain: 'Most traffic is mobile, so start with the small screen and enhance for larger ones.' },
      { type: 'choice', prompt: 'What does @media (min-width: 768px) mean?', options: ['Only on screens 768px wide or wider', 'Only on phones', 'Hide on 768px', 'Make everything 768px'], answer: 0, explain: 'min-width queries apply from that width upwards — tablets and desktops.' },
      {
        type: 'code', lang: 'css', prompt: 'Make an element a flex container', starter: '', placeholder: 'display: …;',
        accepts: ['^display\\s*:\\s*flex\\s*;?$'], hint: 'display: flex;',
        explain: 'display: flex;',
      },
    ],
  },
  // ---------------- Business ----------------
  {
    id: 'biz-1', track: 'business', title: 'Revenue, costs & profit', minutes: 3, xp: 60, coins: 40,
    intro: [
      'Revenue is all the money customers pay you. Costs are what you spend: rent, wages, goods.',
      'Profit = Revenue − Costs. A busy business can still lose money if costs are too high. Watch your daily report!',
    ],
    questions: [
      { type: 'choice', prompt: 'A café earns 300 coins and spends 220. What is the profit?', options: ['520', '80', '220', '300'], answer: 1, explain: '300 − 220 = 80 coins profit.' },
      { type: 'choice', prompt: 'Which is a fixed cost that stays the same no matter how many customers come?', options: ['Coffee beans', 'Rent', 'Takeaway cups', 'Napkins'], answer: 1, explain: 'Rent is fixed. Beans, cups and napkins grow with every customer (variable costs).' },
      { type: 'choice', prompt: 'Your restaurant turns customers away every day. What is the best fix?', options: ['Cut marketing', 'Hire staff or expand capacity', 'Raise rent', 'Close on weekends'], answer: 1, explain: 'Turned-away customers are lost revenue — add capacity when demand exceeds it.' },
    ],
  },
  {
    id: 'biz-2', track: 'business', title: 'Marketing basics', minutes: 3, xp: 60, coins: 40,
    intro: [
      'Marketing increases visibility: how many potential customers know you exist.',
      'But visibility only pays off if visitors convert. A clear website with a strong call-to-action turns attention into customers.',
    ],
    questions: [
      { type: 'choice', prompt: 'What does "conversion" mean?', options: ['Changing currency', 'The share of interested people who actually buy', 'Moving to a new location', 'A type of tax'], answer: 1, explain: 'Conversion = buyers ÷ people who showed interest.' },
      { type: 'choice', prompt: 'Which has the longest-lasting effect?', options: ['One-day flyer', 'SEO (being found on search engines)', 'Shouting on the street', 'A single post'], answer: 1, explain: 'SEO keeps bringing visitors over time.' },
      { type: 'choice', prompt: 'You spent 140 coins on ads and earned 90 extra profit. Was it worth it?', options: ['Yes', 'No — it lost 50 coins', 'It made 230', 'Ads are always worth it'], answer: 1, explain: 'Return = 90 − 140 = −50. Always compare marketing cost to extra profit.' },
    ],
  },
  {
    id: 'biz-3', track: 'business', title: 'Branding', minutes: 3, xp: 70, coins: 40,
    intro: [
      'A brand is the feeling people have about your business: name, colors, voice and promise.',
      'Consistency builds trust. Use the same colors, fonts and tone on your website, shop sign and social media.',
    ],
    questions: [
      { type: 'choice', prompt: 'Which name is strongest for a premium hotel?', options: ['Hotel 123', 'The Azure Harbor', 'Rooms4U Cheap', 'Building B'], answer: 1, explain: 'Memorable, evocative names communicate quality.' },
      { type: 'choice', prompt: 'Why keep brand colors consistent?', options: ['Customers recognise and trust you faster', 'It is cheaper paint', 'It is the law', 'Search engines require it'], answer: 0, explain: 'Repetition builds recognition and trust.' },
      { type: 'choice', prompt: 'What is a tagline?', options: ['A price label', 'A short memorable phrase about your promise', 'A HTML tag', 'A legal document'], answer: 1, explain: 'Like "Build your digital empire." — short and memorable.' },
    ],
  },
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);

export const normalizeCode = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ').replace(/>\s+</g, '><');

export function gradeAnswer(q: Question, answer: number | string): boolean {
  if (q.type === 'choice') return answer === q.answer;
  if (typeof answer !== 'string' || answer.length > 500) return false;
  const norm = normalizeCode(answer);
  return q.accepts.every((src) => new RegExp(src).test(norm));
}

/** A lesson is unlocked when the previous lesson in its track is complete. */
export function isLessonUnlocked(lessonId: string, completed: string[]) {
  const lesson = lessonById(lessonId);
  if (!lesson) return false;
  const track = LESSONS.filter((l) => l.track === lesson.track);
  const idx = track.findIndex((l) => l.id === lessonId);
  return idx === 0 || completed.includes(track[idx - 1].id);
}
