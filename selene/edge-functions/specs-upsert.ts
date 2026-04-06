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
  if (!payload?.spec_id || !payload?.project_id || !payload?.goal || !payload?.intent) {
    return json(400, { error: "spec_id, project_id, goal, and intent are required" });
  }

  if (!Array.isArray(payload?.target_files) || !Array.isArray(payload?.verification_plan) || !Array.isArray(payload?.exit_criteria)) {
    return json(400, { error: "target_files, verification_plan, and exit_criteria must be arrays" });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("specs")
    .upsert(payload, { onConflict: "spec_id" })
    .select()
    .single();

  if (error) return json(500, { error: error.message });
  return json(200, { data });
});
