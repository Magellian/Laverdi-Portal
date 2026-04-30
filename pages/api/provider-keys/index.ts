/**
 * pages/api/provider-keys/index.ts
 * Manage user's external inference provider API keys
 * GET - List keys, POST - Add key
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

interface ProviderKey {
  id: string;
  provider: string;
  keyName: string;
  isActive: boolean;
  createdAt: string;
  lastUsed?: string;
}

type ResponseData = {
  success: boolean;
  data?: ProviderKey[] | ProviderKey;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
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

  if (req.method === "GET") {
    return handleGet(userId, res);
  } else if (req.method === "POST") {
    return handlePost(userId, req.body, res);
  } else {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
}

async function handleGet(
  userId: string,
  res: NextApiResponse<ResponseData>
) {
  try {
    const { data, error } = await supabase
      .from("provider_keys")
      .select("id, provider, key_name, is_active, created_at, last_used")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const keys: ProviderKey[] = (data || []).map((key: any) => ({
      id: key.id,
      provider: key.provider,
      keyName: key.key_name,
      isActive: key.is_active,
      createdAt: key.created_at,
      lastUsed: key.last_used,
    }));

    return res.status(200).json({ success: true, data: keys });
  } catch (err) {
    const error = err as Error;
    console.error("Error fetching provider keys:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch provider keys",
    });
  }
}

async function handlePost(
  userId: string,
  body: any,
  res: NextApiResponse<ResponseData>
) {
  const { provider, key } = body;

  if (!provider || !key) {
    return res.status(400).json({
      success: false,
      error: "Missing provider or key",
    });
  }

  try {
    // Encrypt key before storing
    const encryptedKey = encryptKey(key);
    const keyName = `${provider}-${Date.now()}`;

    const { data, error } = await supabase
      .from("provider_keys")
      .insert({
        user_id: userId,
        provider,
        encrypted_key: encryptedKey,
        key_name: keyName,
        is_active: true,
      })
      .select("id, provider, key_name, is_active, created_at")
      .single();

    if (error) throw error;

    const newKey: ProviderKey = {
      id: data.id,
      provider: data.provider,
      keyName: data.key_name,
      isActive: data.is_active,
      createdAt: data.created_at,
    };

    return res.status(201).json({ success: true, data: newKey });
  } catch (err) {
    const error = err as Error;
    console.error("Error creating provider key:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create provider key",
    });
  }
}

/**
 * Simple encryption (you should use a proper encryption library like crypto)
 * This is a placeholder - in production, use libsodium or similar
 */
function encryptKey(key: string): string {
  const encryptionKey = process.env.ENCRYPTION_KEY || "dev-key-32-chars-min-please";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(encryptionKey.padEnd(32, "0").slice(0, 32)),
    iv
  );

  let encrypted = cipher.update(key, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
