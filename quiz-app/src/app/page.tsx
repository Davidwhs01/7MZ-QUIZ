'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getUserSectionPreference } from '@/utils/supabase/userPrefs';
import { createClient } from '@/utils/supabase/client';

export default function RootRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkPreference = async () => {
      if (pathname !== '/') return;
      
      console.log('Checking user preference...');
      
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session:', session, 'Error:', sessionError);
      
      if (sessionError || !session?.user) {
        console.log('No session, redirecting to /geek');
        router.replace('/geek');
        return;
      }
      
      const preference = await getUserSectionPreference();
      console.log('User preference:', preference);
      
      if (preference === 'geek' || preference === 'pop') {
        router.replace(`/${preference}`);
      } else {
        router.replace('/geek');
      }
    };

    checkPreference();
  }, [pathname, router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#0a0a0f',
      color: '#fff'
    }}>
      <p>Carregando...</p>
    </div>
  );
}