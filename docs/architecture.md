# Restaurant Concierge Agent — Architecture & Plan

> Full-stack TypeScript AI agent for our restaurant: menu Q&A, recommendations,
> meal planning, ordering, reservations, live kitchen status, and dietary safety.

---

## 1. What It Does (Feature Map)

| # | Capability | Example customer input | Agent behavior |
|---|---|---|---|
| F1 | Menu browsing | "What pastas do you have?" | Lists menu by category (Modern Pasta Lovers, Steak, etc.) with rich cards |
| F2 | Ingredient & dish Q&A | "What's in the carbonara?" | Ingredients, allergens, prep style, calories |
| F3 | Hours & general info | "Are you open Sunday?" | Opening hours, location, contact, policies |
| F4 | Chef & story Q&A | "Who's the chef?" | Chef bio, experience, signature dishes |
| F5 | First-timer recommendations | "First time here, what should I get?" | Curated picks from `is_signature` + rating data |
| F6 | Party meal planning | "Plan dinner for 6 people, 2 vegetarians" | Builds a balanced multi-course plan within party size / budget / diets |
| F7 | Vibe-based recommendations | "Something cozy and comforting" | Matches dishes tagged with mood/vibe metadata |
| F8 | Photos | "Show me what the ribeye looks like" | Menu photos + customer review photos in a gallery widget |
| F9 | Ordering | "I'll take the ribeye, medium rare" | Builds a draft order → customer reviews → approve/change → confirm |
| F10 | Reservations | "Book a table Friday 7pm for 4" | Checks availability, books a slot, sets arrival time |
| F11 | Arrival review | Customer arrives / opens session | Shows current order/reservation list; approve or change items |
| F12 | Live kitchen status | Order confirmed ("dead set") | Live "your food is being made" tracker (queued → cooking → plating → served) |
| F13 | Allergies & special requests | "I'm allergic to peanuts, no cilantro please" | Records notes on the customer profile + attaches to the order; warns on conflicts |
| F14 | Stock warnings | Ordering an item low/out of stock | Proactive warning + substitute suggestion |
| F15 | Calorie & nutrition info | "How many calories? Any low-cal option?" | Per-dish nutrition + suggests lower-calorie swaps/ingredient changes |

---

## 2. High-Level Architecture

```
┌────────────────────────┐        SSE (agent stream + kitchen events)
│  FE — Next.js 15 (TS)  │◄──────────────────────────────┐
│  Chat UI + rich blocks │                               │
│  (cards, gallery,      │  POST /api/chat  ────────►  ┌─┴──────────────────────┐
│   booking, tracker)    │  POST /api/orders/confirm    │  BE — Fastify (TS)     │
└────────────────────────┘                              │  Agent service         │
                                                        │  @openai/agents        │
                                                        │  Runner + zod tools    │
                                                        └─┬───────────┬─────────┘
                                                          │           │
                                              ┌───────────┴──┐   ┌────┴─────────┐
                                              │ PostgreSQL   │   │ OpenAI API   │
                                              │ (Prisma)     │   │ gpt-5.1      │
                                              │ menu/orders/ │   └──────────────┘
                                              │ inventory/   │
                                              │ reservations │
                                              └──────────────┘
```

**Stack**

| Layer | Choice | Why |
|---|---|---|
| Backend | Node 22 + Fastify + TypeScript | Fast, typed, first-class SSE support |
| Agent | `@openai/agents` Agents SDK (`tool()` + zod v4) | SDK drives the tool loop; Zod gives typed tool inputs for free |
| Model | `OPENAI_MODEL` env (default `gpt-5.1`) | Conversational concierge; swappable per env. Streaming always on |
| DB | PostgreSQL + Prisma | Relational fits menu/orders/inventory; Prisma = typed queries |
| Realtime | SSE (two channels: agent stream, kitchen events) | Simpler than WebSocket; one-directional is all we need |
| Frontend | Next.js 15 (App Router) + Tailwind + shadcn/ui | Team standard; server components for menu pages, client chat |
| Images | S3/R2 bucket + CDN, URLs stored in DB | Agent returns URLs; FE renders galleries |

**Core pattern — structured UI blocks, not just text.**
Tools return structured JSON. The BE forwards two SSE event types to the FE:

- `text_delta` — streamed agent prose
- `ui_block` — typed payloads the FE renders as rich widgets (`menu_card`, `photo_gallery`, `order_draft`, `reservation_slot_picker`, `kitchen_tracker`, `nutrition_table`, `stock_warning`)

Plus two control events: `done` (clean terminal signal) and `error` (stream-level failure) — content-bearing events remain the two above.

The agent narrates; the widgets do the heavy lifting. No markdown-table menus in chat.

---

## 3. Data Model (Prisma sketch)

```prisma
model MenuCategory {   // "Modern Pasta Lovers", "Steak", "Starters", ...
  id        String     @id @default(cuid())
  name      String
  sortOrder Int
  items     MenuItem[]
}

model MenuItem {
  id            String   @id @default(cuid())
  categoryId    String
  name          String
  description   String
  priceCents    Int
  calories      Int
  isSignature   Boolean  @default(false)   // first-timer picks
  vibeTags      String[]                   // ["cozy","comfort","date-night","light","adventurous"]
  spiceLevel    Int      @default(0)
  photoUrls     String[]
  ingredients   MenuItemIngredient[]
  reviews       Review[]
  inventory     InventoryItem?
}

model Ingredient {
  id          String   @id @default(cuid())
  name        String
  allergens   String[]                     // ["nuts","dairy","gluten","shellfish",...]
  caloriesPer100g Int?
  swappable   Boolean  @default(false)     // can be omitted/substituted (low-cal swaps)
  lowCalAlternativeId String?
}

model MenuItemIngredient {                 // join w/ quantity, enables per-dish allergen rollup
  menuItemId   String
  ingredientId String
  removable    Boolean @default(false)     // "no cilantro" possible?
  @@id([menuItemId, ingredientId])
}

model InventoryItem {
  menuItemId  String  @id
  status      StockStatus                  // IN_STOCK | LOW | OUT
  qtyRemaining Int?
}

model Customer {
  id         String  @id @default(cuid())
  name       String?
  phone      String? @unique
  allergies  String[]
  notes      String[]                      // free-text special requests, persisted
  orders     Order[]
  reservations Reservation[]
}

model Order {
  id          String      @id @default(cuid())
  customerId  String
  status      OrderStatus // DRAFT | CONFIRMED | QUEUED | COOKING | PLATING | SERVED | CANCELLED
  items       OrderItem[]
  specialRequests String[]
  scheduledFor DateTime?                   // pre-order for arrival time
  reservationId String?
}

model OrderItem {
  id         String @id @default(cuid())
  orderId    String
  menuItemId String
  qty        Int
  modifiers  String[]                      // ["no cilantro","medium rare"]
}

model Reservation {
  id         String   @id @default(cuid())
  customerId String
  partySize  Int
  startsAt   DateTime
  status     ReservationStatus             // PENDING | CONFIRMED | SEATED | CANCELLED | NO_SHOW
  tableId    String?
}

model Review {
  id         String   @id @default(cuid())
  menuItemId String
  rating     Int
  text       String?
  photoUrls  String[]                      // customer review photos (F8)
}

model RestaurantInfo {                     // hours, chef bio, policies — editable content
  key   String @id                         // "hours", "chef_bio", "address", "policies"
  value Json
}

model ConversationTurn {                   // per-session agent history (raw SDK items)
  id        String   @id @default(cuid())
  sessionId String                         // anonymous sid cookie; Customer FK arrives in P2
  index     Int                            // strict per-session ordering
  role      TurnRole                       // USER | ASSISTANT
  content   Json                           // raw agent history item (incl. tool calls/results)
  createdAt DateTime @default(now())
  @@unique([sessionId, index])
}
```

---

## 4. Agent Tool Surface

All tools defined with `betaZodTool`. Read tools execute freely; **write tools are gated** (return drafts, never commit — see §6).

| Tool | Type | Input (Zod) | Returns | Notes |
|---|---|---|---|---|
| `get_menu` | read | `{ category?, vibeTags?, maxCalories?, excludeAllergens? }` | items + stock status | One tool covers F1/F5/F7/F15 filtering |
| `get_item_details` | read | `{ itemId }` | full ingredients, allergens, nutrition, photos, removable/swap options | F2, F15 |
| `get_restaurant_info` | read | `{ topic: "hours"\|"chef"\|"location"\|"policies" }` | JSON content | F3, F4 |
| `get_photos` | read | `{ itemId, source: "menu"\|"reviews"\|"both" }` | photo URLs + captions | F8 → FE renders `photo_gallery` |
| `check_availability` | read | `{ date, partySize }` | open slots | F10 |
| `plan_meal` | read | `{ partySize, budgetCents?, dietary?, vibe? }` | candidate items grouped by course + total price/calories | Deterministic helper; agent curates the final plan (F6) |
| `get_customer_profile` | read | `{ customerId }` | allergies, notes, active orders/reservations | F11, F13 — called at session start |
| `save_customer_note` | write | `{ customerId, allergies?, notes? }` | ok | Low-risk write, no gate (F13) |
| `draft_order` | write (gated) | `{ customerId, items[{itemId, qty, modifiers}], specialRequests?, scheduledFor? }` | draft order + **stock warnings** + allergen conflicts | Creates `DRAFT`; FE shows `order_draft` widget with Approve / Change (F9, F14) |
| `update_draft_order` | write (gated) | `{ orderId, addItems?, removeItemIds?, modifiers? }` | updated draft | F11 change flow |
| `draft_reservation` | write (gated) | `{ customerId, partySize, startsAt }` | held slot (5-min TTL) | FE shows `reservation_slot_picker` (F10) |
| `get_order_status` | read | `{ orderId }` | status + per-item kitchen stage | F12 → FE opens `kitchen_tracker` (live via SSE) |

**Not tools (deliberately):** order/reservation **confirmation** is a plain REST endpoint hit by the FE's Approve button — the model can propose but never commit. This is the security boundary (per Anthropic agent-design guidance: promote gate-worthy actions out of the model's reach).

**Safety behaviors baked into tools, not just the prompt:**
- `draft_order` cross-checks items against the customer's stored allergens and returns `allergenConflicts[]` — the agent must surface them, but even a lazy model can't hide them because the FE `order_draft` widget renders conflicts directly from the payload.
- Same for `stockWarnings[]` (LOW → "only 2 left", OUT → blocked + `suggestedSubstitutes[]`).

---

## 5. Agent Configuration (BE)

```ts
// agent/runner.ts (shape, not final code)
const agent = new Agent({
  name: "MARGOT",
  model: env.OPENAI_MODEL,           // default gpt-5.1
  instructions: SYSTEM_PROMPT,       // frozen constant
  tools: [getMenu, getItemDetails, getRestaurantInfo, getPhotos,
          checkAvailability, planMeal, getCustomerProfile,
          saveCustomerNote, draftOrder, updateDraftOrder,
          draftReservation, getOrderStatus],
});
const result = await runner.run(agent, historyItems, { stream: true, maxTurns: 8, signal });
// text deltas: raw_model_stream_event → output_text_delta → SSE text_delta
// persistence: result.history → ConversationTurn rows
```

- **Prompt caching:** OpenAI caches automatically on stable prefixes — so the instructions stay a frozen constant and tool order is deterministic. Session context (customer name, allergies, time of day) is injected as the **first user turn** (persisted, index 0), never interpolated into the instructions — keeps the prefix byte-stable. Verify via `usage.inputTokensDetails.cached_tokens > 0` on turn 2+.
- **Streaming:** always (`stream: true`); text deltas piped to the FE SSE channel as they arrive; tools `emit()` ui_blocks mid-run.
- **History:** stored per session in Postgres (`ConversationTurn` table, one row per SDK history item); full history resent each request (API is stateless).

### System prompt (draft)

```
You are the host and concierge for [RESTAURANT NAME]. Warm, knowledgeable,
never pushy. You help guests explore the menu, answer questions about dishes,
ingredients, the chef, and hours, plan meals, place orders, and book tables.

Rules:
- Always fetch data with tools. Never invent menu items, prices, ingredients,
  hours, or availability.
- Early in any ordering conversation, ask about allergies and special requests
  if the profile has none on file, then save them with save_customer_note.
- Surface every allergen conflict and stock warning a tool returns. If an item
  is out of stock, apologize briefly and suggest the returned substitutes.
- Orders and reservations: you create DRAFTS only. The guest confirms in the
  app. Never claim an order or booking is confirmed unless get_order_status /
  the confirmation context says so.
- For calorie questions, give the number and — if the guest wants lighter —
  offer the dish's swappable low-calorie ingredient options.
- First-time guests: recommend 2–3 signature dishes max, tailored to any vibe
  or dietary info they've shared. Give a one-line "why" for each.
- Keep replies short; the app renders menu cards, photos, and order summaries
  as widgets, so don't repeat their contents in prose.
```

---

## 6. Order & Reservation Flow (the gated write path)

```
Customer: "Get me the ribeye and a tiramisu for 7pm"
   │
   ▼
Agent → draft_order(...)                      BE creates Order{status: DRAFT}
   │                                          + stockWarnings + allergenConflicts
   ▼
SSE ui_block: order_draft ────────────────►   FE renders summary widget:
                                              items, price, warnings,
                                              [Approve] [Change] buttons
   │
   ├─ [Change] → user types → agent → update_draft_order → new order_draft block
   │
   └─ [Approve] → FE calls POST /api/orders/:id/confirm  (NOT the model)
                       │
                       ▼
                  Order → CONFIRMED → pushed to kitchen queue
                       │
                       ▼
              SSE kitchen channel: QUEUED → COOKING → PLATING → SERVED
              FE kitchen_tracker widget animates each stage (F12)
```

Arrival flow (F11): FE session boot calls `get_customer_profile` context → agent greets with the current reservation/order list widget → approve or change via same gated path.

Kitchen status updates come from a staff-facing endpoint (`PATCH /api/kitchen/orders/:id/stage`) — out of the agent's hands entirely.

**Live stock propagation (86 flow):** when staff 86 an item (`POST /api/kitchen/menu-items/:id/86`) or inventory drops to LOW/OUT, the BE broadcasts a `stock_update` event on the kitchen SSE channel. The FE flips affected menu cards to "86 tonight"/"low" in active guest sessions without waiting for the next tool call; the agent still gets fresh stock on every `draft_order`.

### REST endpoints (non-agent)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/chat` | Send message → SSE stream (text deltas + ui_blocks) |
| `POST` | `/api/orders/:id/confirm` | Human-approved commit |
| `POST` | `/api/reservations/:id/confirm` | Human-approved commit |
| `GET` | `/api/events/kitchen/:orderId` | SSE kitchen status channel (also carries `stock_update` events) |
| `PATCH` | `/api/kitchen/orders/:id/stage` | Staff app updates cooking stage |
| `POST` | `/api/kitchen/menu-items/:id/86` | Staff quick-action: mark item OUT, broadcast `stock_update` |
| CRUD | `/api/admin/menu`, `/api/admin/inventory` | Staff menu/stock management |

---

## 7. Frontend Structure

```
app/
  (guest)/
    chat/page.tsx              ← main concierge experience
    menu/page.tsx              ← browsable menu (server components, no agent)
  (staff)/
    kitchen/page.tsx           ← kitchen queue board
components/
  chat/
    ChatShell.tsx              ← layout, session boot (profile fetch)
    MessageList.tsx
    Composer.tsx               ← input + quick chips ("Plan a dinner", "I'm new here")
    blocks/                    ← ui_block renderers (one per block type)
      MenuCard.tsx             ← photo, price, calories, vibe tags, [Add] button
      PhotoGallery.tsx         ← swipeable; menu vs. review-photo tabs
      OrderDraft.tsx           ← items, totals, warnings, [Approve]/[Change]
      ReservationPicker.tsx    ← date/time/party-size slot picker
      KitchenTracker.tsx       ← animated stage stepper, subscribes to SSE
      NutritionTable.tsx       ← calories + low-cal swap toggles
      StockWarning.tsx         ← amber (low) / red (out) banner + substitutes
  hooks/
    useAgentStream.ts          ← consumes /api/chat SSE, dispatches deltas/blocks
    useKitchenEvents.ts        ← consumes kitchen SSE channel
lib/
    blockSchema.ts             ← shared Zod schemas for ui_block payloads
                                 (imported by BE too → one source of truth)
```

Shared `packages/shared` workspace (pnpm monorepo): Zod schemas for ui_blocks + tool payload types, so FE and BE never drift.

---

## 8. FE Design Exploration Prompt

Paste this into Claude (or v0/your design tool of choice) to explore visual directions before building:

```
You are designing the guest-facing web app for an upscale-casual restaurant's
AI concierge. It is a chat-first experience, but NOT a generic chatbot — the
conversation is interleaved with rich interactive widgets:

- Menu cards (dish photo, name, price, calories, vibe tags, add-to-order)
- Swipeable photo galleries (professional menu shots + customer review photos)
- An order draft summary with Approve / Change actions and allergy/stock
  warning banners
- A reservation slot picker (date, time, party size)
- A live "your food is being made" tracker with animated stages:
  queued → cooking → plating → served
- A nutrition panel with low-calorie ingredient swap toggles

Audience: dine-in guests on their phones (mobile-first, 390px baseline) and a
tablet mode at the host stand. Guests may be first-timers who want guidance or
regulars who want to reorder in three taps.

Before building anything, propose 4 distinct visual directions tailored to
this brief. For each: background hex / accent hex / typeface pairing / one
line on the mood, and one line on how the kitchen tracker would feel in that
direction. Make them genuinely different (e.g. warm trattoria, modern
chef's-counter minimal, late-night neon bistro, editorial fine-dining).
Ask me to pick one, then implement ONLY that direction.

Hard constraints:
- NEVER use generic AI-generated aesthetics: no Inter/Roboto/system fonts, no
  purple gradients, no cookie-cutter card grids without character. Use
  distinctive typography, a cohesive palette, and micro-interactions
  (add-to-order animation, tracker stage transitions, photo gallery physics).
- Food photography is the hero — the UI should frame it, not compete with it.
- Warnings (allergens, out-of-stock) must be unmissable but on-brand, not
  browser-alert ugly.
- Chat text bubbles are secondary to widgets; keep them light and airy.
- Dark-mode variant required (dinner-service lighting).

Deliver: a single-page interactive mockup of the chat experience showing one
full ordering conversation — greeting, menu cards, a photo gallery, an allergy
question, an order draft with one stock warning, approval, and the live
kitchen tracker.
```

---

## 9. Build Phases

| Phase | Scope | Size |
|---|---|---|
| P1 — Skeleton | Monorepo, Prisma schema + seed data, Fastify + `/api/chat` with toolRunner, read-only tools (menu, info, photos, nutrition), FE chat with `MenuCard`/`PhotoGallery`/`NutritionTable` | L |
| P2 — Writes | Customer profiles + allergy notes, draft order/reservation tools, confirm endpoints, `OrderDraft`/`ReservationPicker` widgets, stock + allergen warnings | L |
| P3 — Live kitchen | Kitchen SSE channel, staff stage endpoint, `KitchenTracker`, arrival-review flow, 86 quick-action + `stock_update` broadcast | M |
| P4 — Polish | Meal planner tool, vibe tagging pass on menu data, prompt-cache verification (`cached_tokens` > 0), eval set of 30 canned conversations, rate limiting, design pass from §8 winner | M |

**Out of scope (v1):** payments, loyalty program, voice, multi-restaurant tenancy, staff-side AI, SMS notifications.

**Testing considerations:** unit-test every tool against seeded DB; snapshot-test ui_block schemas (FE/BE contract); agent eval set covering allergy-conflict, out-of-stock, and "never confirm without approval" scenarios; load-test SSE fan-out.

**Open questions:**
1. Guest identity — phone-number lookup, QR-at-table session, or anonymous until order time?
2. Does the kitchen already have a ticketing system to integrate with, or is the staff board (P3) greenfield?
3. Budget ceiling per conversation? (`effort: "medium"` + caching keeps it modest; can drop reads to `low` later.)
