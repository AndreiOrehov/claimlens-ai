# ClaimPilot AI — Project Context

## Rules
- When user says "сохранись" — update this CLAUDE.md with current project state, decisions, and progress
- Periodically update this file during long work sessions (every major milestone)
- Bump APP_VERSION on every significant code change
- Always keep CLAUDE.md in sync with actual project state

## Project Structure
- **claimlens-ai** (this repo) — Vite SPA, MVP vehicle damage assessment
- **claimlens-platform** (`C:\Users\oreho\Claude\Insurance\claimlens-platform`) — Next.js fullstack platform (separate repo: AndreiOrehov/claimlens-platform)

## Current State (v0.9.9)
- Detection engine with 3-run consensus voting on Gemini 3 Flash
- Variance reduced from 33% → 3.8% (target ≤5% achieved)
- US collision industry repair/replace logic in detection-engine.js
- Debug run log in PDF reports
- Property section hidden (auto-only for now)
- Stable baseline tagged: `v0.9.9-stable`

## Key Architecture Decisions
- **Model chain:** gemini-3-flash-preview → gemini-2.5-flash (no lite — caused outliers)
- **Consensus voting:** 3 parallel runs, component needs 2/3, each indicator needs 2/3
- **Pre-merge sided split:** headlamp/tail_lamp/fender normalized to _LH/_RH before consensus merge
- **Repair vs Replace logic:** ALWAYS_REPLACE (bumper covers, lights, glass), REPLACE_AT_MODERATE (fenders, hood, doors, trunk), quarter_panel = Repair unless severe
- **system_instruction:** separate field in Gemini API (not inline text)
- **responseSchema:** enum constraints for ALL_PARTS (components) and INDICATOR_WEIGHTS (damage indicators)
- **Temperature 0:** deterministic output for consistency

## Key Files
- `damage-assessment-mvp.jsx` — entire UI + Gemini pipeline (~4100 lines)
- `detection-engine.js` — consensus merge, severity/operation derivation, guaranteed pairs
- `pricing-db.js` — static pricing by vehicle class, labor rates by state, tax rates
- `parts-catalog.js` — closed vocabulary of ~235 part names
- `labor-times.js` — labor hours per operation type
- `vehicle-specs.js` / `vehicle-trims.js` — make/model/engine/trim data

## Next Steps (Design Spec: docs/superpowers/specs/2026-04-14-vin-pricing-pipeline-design.md)
1. Add VIN field to UI + NHTSA auto-fill decode
2. Add VIN OCR via Gemini (Scan button)
3. Reorder pipeline: detection first → then VIN-specific price lookup
4. Fallback: VIN lookup → generic LLM lookup → static pricing DB
5. Add VIN to PDF report

## Platform (claimlens-platform)
- Next.js 15 + TypeScript + Tailwind + Supabase
- Supabase URL: https://vagvvbhtwaxkfkuxtjeh.supabase.co
- Database schema deployed: profiles, shops, claims, claim_photos, shop_requests, messages
- RLS policies configured
- Detection engine copied to src/lib/engine/
- API route stub: /api/assess
- Vision: multi-party platform (Client → Insurance/Adjuster or Client → Body Shop)

## Testing Reference
- Real inspection data: 2025 Chevrolet Malibu LS (11 components from real adjuster)
- GEICO estimate reference: 2023 Tesla Model Y Performance ($32,596 total loss)
- Test photos in: C:\Users\oreho\Downloads\Damage\malibu\
- v1-v7 test reports in subfolders

## API Keys
- Gemini: in .env / VITE_GEMINI_API_KEY
- OpenAI: in .env / VITE_OPENAI_API_KEY  
- Supabase keys: in claimlens-platform/.env.local
- GitHub repo: AndreiOrehov/claimlens-ai and AndreiOrehov/claimlens-platform
