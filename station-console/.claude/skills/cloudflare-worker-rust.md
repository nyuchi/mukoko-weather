# Cloudflare Worker in Rust — Nyuchi Pattern

## When to use this skill

Every Nyuchi service that runs on Cloudflare Workers is built in Rust using the `workers-rs` crate, which compiles Rust to WebAssembly and deploys it to the Worker runtime. This covers: Fundi (fundi.nyuchi.dev), the MCP server (mcp.nyuchi.dev), and the core API (api.nyuchi.dev).

## Project setup

```bash
# Install wrangler
npm install -g wrangler

# Create a new Worker project
cargo generate cloudflare/workers-rs

# Directory structure
service-name/
├── src/
│   ├── lib.rs          # Worker entry point
│   ├── router.rs       # Request routing
│   ├── supabase.rs     # Supabase REST client
│   ├── auth.rs         # WorkOS JWT validation
│   └── handlers/       # One file per route
├── wrangler.toml       # Cloudflare config
└── Cargo.toml
```

## wrangler.toml pattern

```toml
name = "nyuchi-fundi"
main = "build/worker/shim.mjs"
compatibility_date = "2024-01-01"

[build]
command = "cargo install -q worker-build && worker-build --release"

# Secrets (set via: wrangler secret put SUPABASE_URL)
# SUPABASE_URL
# SUPABASE_SERVICE_ROLE_KEY
# WORKOS_API_KEY
# GITHUB_TOKEN

# Cron trigger (for Fundi polling)
[[triggers.crons]]
cron = "*/5 * * * *"

# Queue binding (for event-driven N8 signals)
[[queues.consumers]]
queue = "nyuchi-fundi-signals"
max_batch_size = 10
```

## Worker entry point pattern

```rust
// src/lib.rs
use worker::*;
mod router;
mod supabase;
mod auth;

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    router::handle(req, env).await
}

// For Cron Triggers (Fundi polling)
#[event(scheduled)]
pub async fn scheduled(_event: ScheduledEvent, env: Env, _ctx: ScheduleContext) {
    if let Err(e) = fundi::run_healing_cycle(&env).await {
        console_error!("[nyuchi:fundi] Healing cycle error: {:?}", e);
    }
}

// For Queue consumers (N8 event-driven signals)
#[event(queue)]
pub async fn queue(batch: MessageBatch<String>, env: Env, _ctx: Context) -> Result<()> {
    fundi::process_signals(batch, &env).await
}
```

## Database connection: Hyperdrive (recommended)

```rust
// src/supabase.rs
// Uses Cloudflare Hyperdrive for globally-pooled native Postgres access.
// Hyperdrive maintains persistent connections to Supabase from every
// Cloudflare edge node, eliminating TCP handshake overhead per request.
// Full SQL function suite available — get_node_counts(), get_architecture(), etc.

pub struct SupabaseClient {
    url: String,
    service_role_key: String,
}

impl SupabaseClient {
    pub fn from_env(env: &Env) -> Result<Self> {
        Ok(Self {
            url: env.secret("SUPABASE_URL")?.to_string(),
            service_role_key: env.secret("SUPABASE_SERVICE_ROLE_KEY")?.to_string(),
        })
    }

    pub async fn get(&self, table: &str, query: &str) -> Result<String> {
        let url = format!("{}/rest/v1/{}?{}", self.url, table, query);
        let mut headers = Headers::new();
        headers.set("apikey", &self.service_role_key)?;
        headers.set("Authorization", &format!("Bearer {}", self.service_role_key))?;
        headers.set("Content-Type", "application/json")?;

        let req = Request::new_with_init(
            &url,
            RequestInit::new().with_headers(headers),
        )?;
        let mut resp = Fetch::Request(req).send().await?;
        resp.text().await
    }
}
```

## WorkOS JWT validation pattern

```rust
// src/auth.rs
// Validate WorkOS JWTs on write operations
// Read endpoints skip auth — public access

pub async fn validate_workos_jwt(req: &Request, env: &Env) -> Result<Option<Claims>> {
    let auth_header = req.headers().get("Authorization")?;
    let Some(header) = auth_header else {
        return Ok(None); // No token — caller decides if this is allowed
    };
    let token = header.strip_prefix("Bearer ").unwrap_or(&header);
    // Validate against WorkOS JWKS endpoint
    // workos-rust crate handles this
    todo!()
}
```

## Naming conventions

All console output uses the [nyuchi:service-name] prefix:
```rust
console_log!("[nyuchi:fundi] Healing cycle complete: {} issues processed", count);
console_error!("[nyuchi:fundi] GitHub API error: {:?}", e);
```

## Deploy

```bash
# Development
wrangler dev

# Production
wrangler deploy

# Set secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put WORKOS_API_KEY
wrangler secret put GITHUB_TOKEN
```