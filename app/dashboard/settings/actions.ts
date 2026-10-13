"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  // Delete all user data. Ideally, this should cascade, but we manually trigger deletion of projects.
  await supabase.from("projects").delete().eq("user_id", user.id);
  
  // Attempt to delete user via an RPC call if one exists for user deletion
  await supabase.rpc("delete_user");
  
  await supabase.auth.signOut();
}

import { revalidatePath } from "next/cache";

export async function updateProfile(name: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: name, name: name }
  });
  if (error) throw new Error(error.message);
}

export async function updateUserProfile(data: {
  displayName: string;
  avatarUrl: string | null;
  profession: string | null;
  workplace: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to update your profile.");
  }

  const cleanName = data.displayName.trim();
  const cleanProfession = data.profession?.trim() || null;
  const cleanWorkplace = data.workplace?.trim() || null;

  // 1. Update public.profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: cleanName,
      avatar_url: data.avatarUrl,
      profession: cleanProfession,
      workplace: cleanWorkplace,
    })
    .eq('id', user.id);

  if (profileError) {
    throw new Error(profileError.message);
  }

  // 2. Also update Supabase auth user metadata
  await supabase.auth.updateUser({
    data: {
      full_name: cleanName,
      name: cleanName,
      avatar_url: data.avatarUrl,
      profession: cleanProfession,
      workplace: cleanWorkplace,
    }
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/settings/profile');

  return { success: true };
}
