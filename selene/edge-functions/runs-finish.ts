import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  });
}

function getToken(req: Request) {
  return req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
}

function createAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  if (getToken(req) !== Deno.env.get("SELENE_REMOTE_TOKEN")) {
    return json(401, { error: "Unauthorized" });
  }

  const payload = await req.json();
  if (!payload?.run_id || !payload?.status) {
    return json(400, { error: "run_id and status are required" });
  }

  const update = {
    status: payload.status,
    finished_at: payload.finished_at ?? new Date().toISOString(),
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("runs")
    .update(update)
    .eq("run_id", payload.run_id)
    .select()
    .single();

  if (error) return json(500, { error: error.message });
  return json(200, { data });
});
