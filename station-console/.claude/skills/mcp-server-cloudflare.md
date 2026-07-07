# MCP Server on Cloudflare Workers — Nyuchi Pattern

## Domain structure

All Nyuchi MCP servers live under mcp.nyuchi.dev:

```
mcp.nyuchi.dev/design    → Design system (components, tokens, docs)
mcp.nyuchi.dev/data      → SiafuDB and NTL data layer (future)
mcp.nyuchi.dev/payments  → ContiPay integration (future)
mcp.nyuchi.dev/identity  → WorkOS identity (future)
```

Each path is a separate Cloudflare Worker or a separate route in a shared Worker depending on team preference.

## MCP protocol basics

MCP servers expose:
- `tools/list` → returns available tools
- `tools/call` → executes a specific tool
- `resources/list` → optional: exposes resources
- `prompts/list` → optional: exposes prompts

All communication is JSON-RPC 2.0 over HTTP with Server-Sent Events (SSE) for streaming.

## Tool naming convention

All Nyuchi MCP tools follow snake_case and describe their action clearly:
```
get_design_tokens
list_components
get_component
get_node_counts
get_architecture
get_install_command
get_skill
get_ai_instructions
```

## Auth pattern

Public tools (no auth): get_design_tokens, list_components, get_component
Authenticated tools (WorkOS JWT): create_component, update_component, log_release

The Worker validates the WorkOS JWT before executing authenticated tools.
Public tools run without any token.