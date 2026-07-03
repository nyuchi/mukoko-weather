/**
 * Developer API keys — generation, hashing, and owner-scoped CRUD.
 *
 * The public mukoko weather / embed API is FREE and needs no key (it is
 * rate-limited per IP). This module powers the *gated* key-management surface:
 * a signed-in developer can mint a key (for attribution + future higher
 * limits), list their keys, and revoke them.
 *
 * Security invariants (enforced here, tested in `api-keys.test.ts`):
 *   - The raw key is generated once, returned once, and NEVER persisted.
 *     Only a SHA-256 hash + a short display prefix + last-4 are stored.
 *   - Every read/write is scoped by `personId` (the WorkOS user id) so a user
 *     can only ever see or revoke their own keys.
 *   - Keys are capped per user (`MAX_KEYS_PER_USER`).
 *
 * Storage: `weather.developer_api_keys` — a clearly app-owned collection.
 * This deliberately avoids the strict platform validators on the `integrations`
 * DB (a brand-new `integrations.apiKeys` shape would be rejected by the
 * `validationAction: "error"` validators there). We still stamp the standard
 * platform fields (`_id`, `_schemaVersion`, `createdAt`, `updatedAt`, `bundu`)
 * for consistency with the rest of the cluster.
 */

import { createHash, randomBytes } from "crypto";
import { weatherDb } from "./mongo";
import { stampPlatformFields } from "./db";

/** Live key prefix. All minted keys start with this. */
export const KEY_PREFIX = "mk_live_";

/** Bytes of entropy in the random portion (→ 64 hex chars). */
const KEY_RANDOM_BYTES = 32;

/** Maximum keys a single user may hold at once. */
export const MAX_KEYS_PER_USER = 10;

/** Maximum length of a user-supplied key label. */
export const MAX_LABEL_LENGTH = 60;

/** App-owned collection name (weather DB). */
const COLLECTION = "developer_api_keys";

/** Stored document shape. The raw key is NEVER a field here. */
export interface DeveloperApiKeyDoc {
  _id: string;
  personId: string;
  label: string;
  /** SHA-256 hex of the full raw key. */
  keyHash: string;
  /** Display prefix, e.g. `mk_live_ab12`. */
  keyPrefix: string;
  /** Last 4 chars of the random portion, e.g. `ef90`. */
  keyLast4: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  _schemaVersion?: string;
  bundu?: { countryCode: string };
}

/** Masked, safe-to-return-to-client representation (never the raw value). */
export interface DeveloperApiKeyPublic {
  id: string;
  label: string;
  /** e.g. `mk_live_ab12…ef90`. */
  maskedKey: string;
  createdAt: string;
  lastUsedAt: string | null;
}

function developerApiKeysCollection() {
  return weatherDb().collection<DeveloperApiKeyDoc>(COLLECTION);
}

/**
 * Generate a fresh raw API key: `mk_live_` + 64 hex chars of CSPRNG entropy.
 * This value is shown to the user exactly once and never stored.
 */
export function generateApiKey(): string {
  return KEY_PREFIX + randomBytes(KEY_RANDOM_BYTES).toString("hex");
}

/** SHA-256 hex digest of a raw key — this is what we persist. */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Derive the non-secret display metadata from a raw key:
 *   - `keyPrefix`: `mk_live_` + first 4 chars of the random portion
 *   - `keyLast4`: last 4 chars of the random portion
 */
export function deriveKeyMeta(rawKey: string): {
  keyPrefix: string;
  keyLast4: string;
} {
  const random = rawKey.startsWith(KEY_PREFIX)
    ? rawKey.slice(KEY_PREFIX.length)
    : rawKey;
  return {
    keyPrefix: KEY_PREFIX + random.slice(0, 4),
    keyLast4: random.slice(-4),
  };
}

/** Build the masked display string, e.g. `mk_live_ab12…ef90`. */
export function maskApiKey(keyPrefix: string, keyLast4: string): string {
  return `${keyPrefix}…${keyLast4}`;
}

/**
 * Validate + normalise a user-supplied label. Strips control characters,
 * collapses whitespace, trims, and caps length. Returns `""` for anything
 * that reduces to empty — callers treat that as a 400.
 */
export function sanitizeLabel(raw: unknown): string {
  if (typeof raw !== "string") return "";
  // Strip ASCII control characters (C0 range + DEL) before collapsing.
  const stripped = raw.replace(/[\u0000-\u001F\u007F]/g, " ");
  const collapsed = stripped.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, MAX_LABEL_LENGTH);
}

/** Map a stored doc to its masked public representation. */
export function toPublic(doc: DeveloperApiKeyDoc): DeveloperApiKeyPublic {
  return {
    id: doc._id,
    label: doc.label,
    maskedKey: maskApiKey(doc.keyPrefix, doc.keyLast4),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(doc.createdAt).toISOString(),
    lastUsedAt: doc.lastUsedAt
      ? doc.lastUsedAt instanceof Date
        ? doc.lastUsedAt.toISOString()
        : new Date(doc.lastUsedAt).toISOString()
      : null,
  };
}

/** Count a user's existing keys (for the per-user cap). */
export async function countDeveloperApiKeys(personId: string): Promise<number> {
  return developerApiKeysCollection().countDocuments({ personId });
}

/** List a user's keys, masked, newest first. Never returns hashes. */
export async function listDeveloperApiKeys(
  personId: string,
): Promise<DeveloperApiKeyPublic[]> {
  const docs = await developerApiKeysCollection()
    .find({ personId })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map(toPublic);
}

/**
 * Create a key for `personId`. Generates the raw value, stores ONLY the hash
 * (+ prefix/last4), and returns the full key exactly once alongside the masked
 * public record. The caller is responsible for the per-user cap check.
 */
export async function createDeveloperApiKey(
  personId: string,
  label: string,
): Promise<{ fullKey: string; key: DeveloperApiKeyPublic }> {
  const fullKey = generateApiKey();
  const { keyPrefix, keyLast4 } = deriveKeyMeta(fullKey);

  const doc = stampPlatformFields<Partial<DeveloperApiKeyDoc>>({
    personId,
    label,
    keyHash: hashApiKey(fullKey),
    keyPrefix,
    keyLast4,
    lastUsedAt: null,
  }) as DeveloperApiKeyDoc;

  await developerApiKeysCollection().insertOne(doc);
  return { fullKey, key: toPublic(doc) };
}

/**
 * Revoke (hard-delete) a key by id, scoped to its owner. Returns `true` when a
 * document was actually removed — a mismatched `personId` deletes nothing and
 * returns `false`, so users can never revoke someone else's key.
 */
export async function revokeDeveloperApiKey(
  personId: string,
  id: string,
): Promise<boolean> {
  const res = await developerApiKeysCollection().deleteOne({
    _id: id,
    personId,
  });
  return res.deletedCount === 1;
}
