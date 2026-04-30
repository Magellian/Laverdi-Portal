/**
 * pages/api/provider-keys/[id].ts
 * Delete a specific provider key
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

type ResponseData = {
  success: boolean;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return res.status(401).json({ success: false, error: "Invalid token" });
  }

  const userId = userData.user.id;
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ success: false, error: "Invalid key ID" });
  }

  try {
    // Verify ownership
    const { data: keyData, error: fetchError } = await supabase
      .from("provider_keys")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !keyData) {
      return res.status(404).json({
        success: false,
        error: "Key not found",
      });
    }

    // Delete
    const { error: deleteError } = await supabase
      .from("provider_keys")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ success: true });
  } catch (err) {
    const error = err as Error;
    console.error("Error deleting provider key:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to delete provider key",
    });
  }
}
