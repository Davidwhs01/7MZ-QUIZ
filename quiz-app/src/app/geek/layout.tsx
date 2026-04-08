'use client';

import { useEffect, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { SECTIONS, AppSection, isValidSection } from '@/data/sections';

interface SectionLayoutProps {
  children: ReactNode;
}

export default function SectionLayout({ children }: SectionLayoutProps) {
  const params = useParams();
  const sectionParam = params.section as string;
  const section: AppSection = isValidSection(sectionParam) ? sectionParam : 'geek';
  const sectionConfig = SECTIONS[section];

  useEffect(() => {
    document.body.className = sectionConfig.theme;
  }, [section]);

  return <>{children}</>;
}