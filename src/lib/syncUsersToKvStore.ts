import { sbService } from "./supabase";

export async function syncUsersToKvStore() {
  const supabase = sbService();
  const { data: users, error } = await supabase.from("users").select("*");
  if (error) throw error;
  for (const user of users) {
    await supabase.from("kv_store").upsert({
      key: `user_profile_${user.username}`,
      value: JSON.stringify(user),
      type: "profile",
    });
  }
  console.log(`Synced ${users.length} users to kv_store.`);
}

// Usage: import and call syncUsersToKvStore() from a script or backend job
