/**
 * Developer API key tests.
 *
 * Covers the security-critical invariants:
 *   - key generation format + entropy
 *   - hashing is deterministic and NEVER equals / stores the raw key
 *   - masking never leaks the secret
 *   - label sanitisation
 *   - owner-scoped list / create / revoke against an in-memory Mongo fake
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// In-memory store standing in for `weather.developer_api_keys`.
interface Row {
  _id: string;
  personId: string;
  [k: string]: unknown;
}
const store: Row[] = [];

function makeCollection() {
  return {
    countDocuments: async (q: { personId: string }) =>
      store.filter((r) => r.personId === q.personId).length,
    find: (q: { personId: string }) => ({
      sort: () => ({
        toArray: async () =>
          store
            .filter((r) => r.personId === q.personId)
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt as string).getTime() -
                new Date(a.createdAt as string).getTime(),
            ),
      }),
    }),
    insertOne: async (doc: Row) => {
      store.push(doc);
      return { insertedId: doc._id };
    },
    deleteOne: async (q: { _id: string; personId: string }) => {
      const idx = store.findIndex(
        (r) => r._id === q._id && r.personId === q.personId,
      );
      if (idx === -1) return { deletedCount: 0 };
      store.splice(idx, 1);
      return { deletedCount: 1 };
    },
  };
}

vi.mock("./mongo", () => ({
  weatherDb: () => ({ collection: () => makeCollection() }),
}));

import {
  generateApiKey,
  hashApiKey,
  deriveKeyMeta,
  maskApiKey,
  sanitizeLabel,
  toPublic,
  createDeveloperApiKey,
  listDeveloperApiKeys,
  countDeveloperApiKeys,
  revokeDeveloperApiKey,
  KEY_PREFIX,
  MAX_KEYS_PER_USER,
  MAX_LABEL_LENGTH,
  type DeveloperApiKeyDoc,
} from "./api-keys";

beforeEach(() => {
  store.length = 0;
});

describe("generateApiKey", () => {
  it("starts with the live prefix and has 64 hex chars of entropy", () => {
    const key = generateApiKey();
    expect(key.startsWith(KEY_PREFIX)).toBe(true);
    const random = key.slice(KEY_PREFIX.length);
    expect(random).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces unique keys", () => {
    const keys = new Set(Array.from({ length: 200 }, () => generateApiKey()));
    expect(keys.size).toBe(200);
  });
});

describe("hashApiKey", () => {
  it("is a 64-char hex sha256 digest", () => {
    expect(hashApiKey("mk_live_abc")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same input", () => {
    const k = generateApiKey();
    expect(hashApiKey(k)).toBe(hashApiKey(k));
  });

  it("never equals the raw key", () => {
    const k = generateApiKey();
    expect(hashApiKey(k)).not.toBe(k);
  });

  it("differs for different keys", () => {
    expect(hashApiKey(generateApiKey())).not.toBe(hashApiKey(generateApiKey()));
  });
});

describe("deriveKeyMeta + maskApiKey", () => {
  it("derives a prefix and last-4 that never expose the full secret", () => {
    const key = generateApiKey();
    const { keyPrefix, keyLast4 } = deriveKeyMeta(key);
    const random = key.slice(KEY_PREFIX.length);
    expect(keyPrefix).toBe(KEY_PREFIX + random.slice(0, 4));
    expect(keyLast4).toBe(random.slice(-4));
    const masked = maskApiKey(keyPrefix, keyLast4);
    expect(masked).toBe(`${keyPrefix}…${keyLast4}`);
    // Masked value is short — it can't contain the full key.
    expect(masked.length).toBeLessThan(key.length);
    expect(key).not.toContain(masked);
  });
});

describe("sanitizeLabel", () => {
  it("trims and collapses internal whitespace", () => {
    expect(sanitizeLabel("  my   key  ")).toBe("my key");
  });

  it("strips control characters", () => {
    expect(sanitizeLabel("a\u0000b\u0001c")).toBe("a b c");
  });

  it("caps at the max length", () => {
    const long = "x".repeat(200);
    expect(sanitizeLabel(long).length).toBe(MAX_LABEL_LENGTH);
  });

  it("returns empty string for non-strings and blank input", () => {
    expect(sanitizeLabel(undefined)).toBe("");
    expect(sanitizeLabel(123)).toBe("");
    expect(sanitizeLabel("   ")).toBe("");
    expect(sanitizeLabel({})).toBe("");
  });
});

describe("toPublic", () => {
  it("masks the key and never leaks the hash", () => {
    const doc: DeveloperApiKeyDoc = {
      _id: "id-1",
      personId: "u1",
      label: "site",
      keyHash: "deadbeef",
      keyPrefix: "mk_live_ab12",
      keyLast4: "ef90",
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      lastUsedAt: null,
    };
    const pub = toPublic(doc);
    expect(pub).toEqual({
      id: "id-1",
      label: "site",
      maskedKey: "mk_live_ab12…ef90",
      createdAt: "2026-01-01T00:00:00.000Z",
      lastUsedAt: null,
    });
    expect(JSON.stringify(pub)).not.toContain("deadbeef");
    expect(JSON.stringify(pub)).not.toContain("keyHash");
  });
});

describe("createDeveloperApiKey (never stores the raw key)", () => {
  it("returns the full key once but persists only the hash + prefix/last4", async () => {
    const { fullKey, key } = await createDeveloperApiKey("u1", "site");
    expect(fullKey.startsWith(KEY_PREFIX)).toBe(true);

    // Exactly one row persisted.
    expect(store).toHaveLength(1);
    const stored = store[0];

    // The raw key must NOT appear anywhere in the stored document.
    expect(JSON.stringify(stored)).not.toContain(fullKey);
    // Only the hash of the raw key is stored.
    expect(stored.keyHash).toBe(hashApiKey(fullKey));
    // Ownership is stamped.
    expect(stored.personId).toBe("u1");
    // Platform stamping applied.
    expect(typeof stored._id).toBe("string");
    expect(stored.createdAt).toBeInstanceOf(Date);

    // The masked public record matches the derived meta.
    const { keyPrefix, keyLast4 } = deriveKeyMeta(fullKey);
    expect(key.maskedKey).toBe(maskApiKey(keyPrefix, keyLast4));
  });
});

describe("owner-scoped list / count / revoke", () => {
  it("only returns and counts a user's own keys, newest first", async () => {
    await createDeveloperApiKey("u1", "first");
    await new Promise((r) => setTimeout(r, 5));
    await createDeveloperApiKey("u1", "second");
    await createDeveloperApiKey("u2", "other-user");

    expect(await countDeveloperApiKeys("u1")).toBe(2);
    expect(await countDeveloperApiKeys("u2")).toBe(1);

    const u1 = await listDeveloperApiKeys("u1");
    expect(u1.map((k) => k.label)).toEqual(["second", "first"]);
    // No cross-tenant leakage.
    expect(u1.some((k) => k.label === "other-user")).toBe(false);
  });

  it("revokes only the owner's key and ignores foreign ids", async () => {
    const { key } = await createDeveloperApiKey("u1", "mine");
    // Wrong owner cannot revoke.
    expect(await revokeDeveloperApiKey("u2", key.id)).toBe(false);
    expect(await countDeveloperApiKeys("u1")).toBe(1);
    // Correct owner can.
    expect(await revokeDeveloperApiKey("u1", key.id)).toBe(true);
    expect(await countDeveloperApiKeys("u1")).toBe(0);
    // Second revoke is a no-op.
    expect(await revokeDeveloperApiKey("u1", key.id)).toBe(false);
  });
});

describe("constants", () => {
  it("caps keys per user at 10", () => {
    expect(MAX_KEYS_PER_USER).toBe(10);
  });
});
