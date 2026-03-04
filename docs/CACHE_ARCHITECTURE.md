# Cache Layer Architecture

## Overview

A **generic, composable cache layer** for Authbox that supports layered lookups (e.g. Bloom filter → Cache → DB) and careful invalidation. The cache is used to speed up hot paths and reduce database load.

## Design Principles

1. **Generic & Composable** — Layers can be stacked (e.g. Bloom → Cache → DB) and reused across domains.
2. **Cache Invalidation First** — Every write path has an explicit invalidation; stale cache is worse than no cache.
3. **Single Key Registry** — All cache keys and TTLs are defined in one place (`cache-keys.ts`) for audit and invalidation.
4. **Fail-Safe** — Cache misses fall through to DB; cache errors do not break the request.

---

## Layer Model

```
┌─────────────────┐     miss      ┌─────────────┐     miss      ┌──────────────┐
│ Bloom Filter    │ ────────────► │ Redis Cache │ ────────────► │   Database   │
│ (optional)      │               │             │               │ (authoritative)│
└─────────────────┘               └─────────────┘               └──────────────┘
       │                                  │                             │
       │ "might not exist"                 │ hit                         │ hit
       ▼                                  ▼                             ▼
   return not found                  return cached              fetch, populate cache
```

- **Bloom Filter** (optional): O(1) "might not exist". Use for high-volume negative lookups (e.g. "email not in system"). Not implemented in v1; interface prepared.
- **Cache (Redis)**: O(1) get/set with TTL. Authoritative when populated.
- **Database**: Source of truth. Populate cache on read; invalidate on write.

---

## Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **ICacheAdapter** | Generic key-value interface (get/set/del) | `infrastructure/cache/cache.types.ts` |
| **RedisCacheAdapter** | Redis-backed implementation | `infrastructure/cache/redis-cache.adapter.ts` |
| **CacheKeys** | Key prefixes, TTLs, builders (single source of truth) | `infrastructure/cache/cache-keys.ts` |
| **SessionCache** | Session IDs per user; session validity lookups | `infrastructure/cache/session-cache.ts` |
| **UserCache** | User by ID (and email) with TTL | `infrastructure/cache/user-cache.ts` |

---

## Cache Keys & Invalidation

All keys use a prefix namespace to avoid collisions and enable pattern invalidation.

| Namespace | Key Pattern | TTL | Invalidated When |
|-----------|-------------|-----|------------------|
| `session` | `session:{sessionId}` | Session expiry (7d) | Logout, revoke, revoke-all |
| `user:sessions` | `user:sessions:{userId}` | Same as session | Session create/delete |
| `user` | `user:id:{userId}` | 5 min | User update, password change, tier change |
| `user` | `user:email:{email}` | 5 min | User update (email change) |

**Critical rule**: Every mutation that changes cached data must call the corresponding `invalidate*` method **before** or **immediately after** the DB write.

---

## Integration Points

### Session Cache

- **Login / Register / OAuth**: After `sessionRepo.create()` → `sessionCache.addSession()`
- **Refresh**: Check `sessionCache.getSessionUserId()` first; on miss → DB → populate cache. On rotate: remove old, add new.
- **Logout**: After `sessionRepo.delete()` → `sessionCache.removeSession()`
- **Revoke (one)**: After `sessionRepo.delete()` → `sessionCache.removeSession()`
- **Revoke all**: After `sessionRepo.deleteByUserId()` → `sessionCache.removeAllSessionsForUser()`
- **Tier enforcement**: Use `sessionCache.countActiveByUserId()` — fallback to DB on cache miss

### User Cache

- **findById**: Check `userCache.getById()` → on miss → DB → `userCache.setById()`
- **findByEmail**: Check `userCache.getByEmail()` → on miss → DB → `userCache.setById()` + `userCache.setByEmail()`
- **Invalidate**: On user update, password change, avatar change, tier change → `userCache.invalidateUser()`

---

## Extending: Bloom Filter Layer

To add a Bloom filter (e.g. for "email exists" checks):

1. Implement `ILookupLayer<T>` with `get(key)` returning `MISS` or `{ found: true, value }`.
2. On DB miss for a key, optionally call `bloomLayer.add(key)` to remember "definitely not present".
3. On lookup: if `bloomLayer.get(key) === MISS` (definitely not), return early without cache/DB.

Interface is in `cache.types.ts` for future use.
