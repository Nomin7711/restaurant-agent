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
| 🤖 Agent | Claude API (`@anthropic-ai/sdk` tool runner) |
| ⚙️ Backend | Node 22 + Fastify + TypeScript |
| 🗄️ Database | PostgreSQL + Prisma |
| 💅 Frontend | Next.js 15 + Tailwind |
| 📡 Realtime | SSE (agent stream + kitchen events) |

## 📖 Docs

Full architecture and build plan: [`docs/architecture.md`](docs/architecture.md) 🍜
