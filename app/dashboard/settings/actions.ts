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

export async function updateProfile(name: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: name, name: name }
  });
  if (error) throw new Error(error.message);
}
