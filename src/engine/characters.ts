// Playable founders. Each has one small, fair perk that changes how the game plays.
export type CharacterId = 'lisa' | 'charlotte' | 'victor' | 'jack';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  bio: string;
  perk: string;
  perkShort: string;
  strengths: string[];
  accent: string;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'lisa', name: 'Lisa', title: 'Brand Director', accent: '#F5B942',
    bio: 'Built her first brand at nineteen. Knows that people buy the story before the product.',
    perk: 'Linked websites give your businesses 20% more visibility.', perkShort: '+20% website visibility',
    strengths: ['Branding', 'Design', 'Websites'],
  },
  {
    id: 'charlotte', name: 'Charlotte', title: 'Hospitality Star', accent: '#F06A6A',
    bio: 'Grew up in her family’s restaurant. Every guest leaves happier than they arrived.',
    perk: 'Every business gets +5 customer satisfaction, so reputation grows faster.', perkShort: '+5 satisfaction everywhere',
    strengths: ['Service', 'Restaurants', 'Hotels'],
  },
  {
    id: 'victor', name: 'Victor', title: 'Code Prodigy', accent: '#22C3A6',
    bio: 'Taught himself to code on a borrowed laptop. Learns faster than anyone in Novara Bay.',
    perk: 'Academy lessons give 25% more XP and coins.', perkShort: '+25% Academy rewards',
    strengths: ['HTML & CSS', 'Learning', 'Tech'],
  },
  {
    id: 'jack', name: 'Jack', title: 'Growth Hacker', accent: '#58A6FF',
    bio: 'Turned a tiny side project into a viral hit. Gets maximum reach for minimum spend.',
    perk: 'Marketing campaigns cost 20% less.', perkShort: '−20% campaign cost',
    strengths: ['Marketing', 'Social media', 'Startups'],
  },
];

export const characterById = (id: string | undefined) => CHARACTERS.find((c) => c.id === id);
export const portrait = (id: CharacterId, small = false) => `./characters/${id}${small ? '-sm' : ''}.webp`;

export const PERKS = {
  websiteVisibility: (c?: CharacterId) => (c === 'lisa' ? 1.2 : 1),
  satisfaction: (c?: CharacterId) => (c === 'charlotte' ? 5 : 0),
  lessonReward: (c?: CharacterId) => (c === 'victor' ? 1.25 : 1),
  campaignCost: (c?: CharacterId) => (c === 'jack' ? 0.8 : 1),
};
