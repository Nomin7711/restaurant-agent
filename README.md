# 🍝 Restaurant Concierge Agent

An AI-powered restaurant concierge, built full-stack in TypeScript. 🥂

Think of it as the friendliest host you've ever met — it knows every dish, never forgets your allergies, and tells you when your steak hits the pan. 🥩🔥

## 🍽️ What it does

- 📋 **Menu browsing** — explore categories like *Modern Pasta Lovers* and *Steak* with rich menu cards
- 🧀 **Dish Q&A** — ingredients, allergens, prep style, and calorie info for every dish
- 🕰️ **Restaurant info** — opening hours, location, and the chef's story & experience
- ✨ **Recommendations** — first-timer picks and vibe-based suggestions ("something cozy 🥰")
- 👨‍🍳 **Meal planning** — balanced multi-course plans for any party size, budget, or diet
- 📸 **Photos** — official menu shots and real customer review photos
- 🛎️ **Ordering & reservations** — draft an order or book a table; you approve before anything is committed
- 🥗 **Dietary safety** — records allergies & special requests, warns about conflicts and out-of-stock items
- 🍳 **Live kitchen tracker** — watch your order go from *queued → cooking → plating → served*

## 🧱 Stack

| Layer | Tech |
|---|---|
| 🤖 Agent | OpenAI Agents SDK (`@openai/agents`, zod tools) |
| ⚙️ Backend | Node 22 + Fastify + TypeScript |
| 🗄️ Database | PostgreSQL + Prisma |
| 💅 Frontend | Next.js 15 + Tailwind |
| 📡 Realtime | SSE (agent stream + kitchen events) |

## 🎨 Design — Solane Concierge

The chosen visual direction: a **late-night neon bistro** 🌃🥩 — the concierge persona is *MARGOT* ("Late bistro · booth 4").

- 🖤 **Palette (Night)**: near-black room `#0A090C`, plum surfaces `#1C1821`, neon signal red `#F0574F` with glow, mint `#3DD6C0` for success states
- ☀️ **Daylight variant**: warm plaster `#F1EDEA`, the neon dims to `#D8402F` (no glow)
- ✒️ **Type**: Bebas Neue (display, all-caps headlines) + Instrument Sans (body)
- 📱 **Devices**: phone (390px) and host-stand tablet (834px), theme + device toggles built in
- 💡 **Signature moves**: buzzing neon-sign brand animation, warnings as backlit red bars, kitchen tracker stages that light up like tube signs

▶️ **Live prototype**: open [`design/solane-concierge.html`](design/solane-concierge.html) in a browser — full guest flow (openers → dish cards → photo gallery → allergy chips → draft + warnings → approve → live tracker → reservation hold) plus the kitchen expo board (bump stages, 86 a dish).
🔗 Design source: [Claude Design project](https://claude.ai/design/p/2ee85be8-3a8f-463d-8d93-196e820c7e37?file=Solane+Concierge.dc.html)

### Design ↔ backend mapping

| Design widget | Backend feature (docs/architecture.md) |
|---|---|
| Dish cards + "2 left" badge | `get_menu` + `InventoryItem` stock status |
| Photo gallery (menu / guest tags) | `get_photos` with `source: "both"` |
| Allergy chips | `save_customer_note` + profile allergens |
| Draft card + warnings | `draft_order` → `allergenConflicts[]` / `stockWarnings[]` |
| "Approve · fire it" | `POST /api/orders/:id/confirm` (human-gated, not the model) |
| "Lighter, same dish" swaps | Nutrition swaps via `Ingredient.swappable` / `lowCalAlternativeId` |
| Kitchen tracker (Ticket in → plancha → Resting → At your booth) | `OrderStatus` QUEUED → COOKING → PLATING → SERVED over kitchen SSE |
| Reservation picker + "Hold this booth" | `check_availability` + `draft_reservation` (5-min hold) |
| Kitchen expo board (bump / 86) | Staff kitchen page + `PATCH /api/kitchen/orders/:id/stage` |

## 🚀 Run it (P1)

```bash
pnpm install
cp .env.example .env        # fill in your OPENAI_API_KEY
pnpm db:up                  # postgres via docker (or point DATABASE_URL at a hosted DB)
pnpm db:migrate && pnpm db:seed
pnpm dev                    # api :3001 + web :3000
```

Open [http://localhost:3000/chat](http://localhost:3000/chat) 🍽️ — or run `pnpm smoke` for a 2-turn SSE check.

## 📖 Docs

Full architecture and build plan: [`docs/architecture.md`](docs/architecture.md) 🍜
