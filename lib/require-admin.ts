import { supabaseAdmin } from "@/lib/supabase/admin";

export async function requireAdmin(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const supabase = supabaseAdmin();
  const { data: authData, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authData.user) return null;

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id, display_name")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (!adminRow) return null;

  return { user: authData.user, admin: adminRow };
}
