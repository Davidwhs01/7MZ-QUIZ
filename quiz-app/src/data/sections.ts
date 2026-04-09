export type AppSection = 'geek' | 'pop';

export interface SectionConfig {
  id: AppSection;
  name: string;
  title: string;
  subtitle: string;
  theme: string;
  artists: readonly string[];
}

export const SECTIONS: Record<AppSection, SectionConfig> = {
  geek: {
    id: 'geek',
    name: 'GEEK',
    title: 'GEEK ARENA',
    subtitle: 'O QUIZ DEFINITIVO DA MÚSICA GEEK',
    theme: 'theme-geek',
    artists: ['7MZ', 'ENYGMA'],
  },
  pop: {
    id: 'pop',
    name: 'POP',
    title: 'POP ARENA',
    subtitle: 'O QUIZ DEFINITIVO DA MÚSICA POP',
    theme: 'theme-pop',
    artists: ['MELANIE', 'MITSKI'],
  },
};

export function getSectionConfig(section: AppSection): SectionConfig {
  return SECTIONS[section];
}

export function isValidSection(section: string): section is AppSection {
  return section === 'geek' || section === 'pop';
}