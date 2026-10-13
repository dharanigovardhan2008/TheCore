import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { isProActive } from '@/lib/plans';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Personal Details | TheCore',
  description: 'Manage your profile photo, 3D avatar, full name, profession, and workplace.',
};

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/dashboard/settings/profile');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isPro = isProActive(profile?.plan, profile?.plan_expires_at);

  const userData = {
    id: user.id,
    email: user.email || '',
    name: profile?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || null,
    profession: profile?.profession || user.user_metadata?.profession || null,
    workplace: profile?.workplace || user.user_metadata?.workplace || null,
    plan: isPro ? 'pro' : (profile?.plan || 'free'),
    isPro,
    planExpiresAt: profile?.plan_expires_at || null,
    createdAt: profile?.created_at,
  };

  return <ProfileClient user={userData} />;
}

