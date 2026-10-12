import SettingsClient from "./SettingsClient";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Settings - TheCore",
};

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  const userObj = {
    email: user?.email || '',
    name: user?.user_metadata?.name || user?.user_metadata?.full_name || ''
  };

  return (
    <div className="min-h-screen bg-page py-8">
      <SettingsClient user={userObj} />
    </div>
  );
}
