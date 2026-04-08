import { createClient } from './client';

export type UserSectionPreference = 'geek' | 'pop' | null;

export async function getUserSectionPreference(): Promise<UserSectionPreference> {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('preferred_section')
    .eq('id', user.id)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.preferred_section as UserSectionPreference;
}

export async function setUserSectionPreference(section: 'geek' | 'pop'): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return false;
  }
  
  const { error } = await supabase
    .from('profiles')
    .update({ preferred_section: section })
    .eq('id', user.id);
  
  return !error;
}