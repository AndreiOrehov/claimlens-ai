# ClaimPilot AI — Project Context

## Rules
- When user says "сохранись" — update this CLAUDE.md with current project state, decisions, and progress
- Periodically update this file during long work sessions (every major milestone)
- Bump APP_VERSION on every significant code change
- Always keep CLAUDE.md in sync with actual project state

## Project Structure
- **claimlens-ai** (this repo) — Vite SPA, MVP vehicle damage assessment
- **claimlens-platform** (`C:\Users\oreho\Claude\Insurance\claimlens-platform`) — Next.js fullstack platform (separate repo: AndreiOrehov/claimlens-platform)

## Current State (v1.0.0)
- Detection engine with 3-run consensus voting on Gemini 3 Flash
- Variance reduced from 33% → 3.8% (target ≤5% achieved)
- US collision industry repair/replace logic in detection-engine.js
- Debug run log in PDF reports
- Property section hidden (auto-only for now)
- Stable baseline tagged: `v0.9.9-stable`
- **VIN input implemented:** text field + OCR scan (OpenAI Vision primary, Gemini fallback) + NHTSA decode auto-fill
- VIN displayed in PDF and text reports

## Key Architecture Decisions
- **Model chain:** gemini-3-flash-preview → gemini-2.5-flash (no lite — caused outliers)
- **Consensus voting:** 3 parallel runs, component needs 2/3, each indicator needs 2/3
- **Pre-merge sided split:** headlamp/tail_lamp/fender normalized to _LH/_RH before consensus merge
- **Repair vs Replace logic:** ALWAYS_REPLACE (bumper covers, lights, glass), REPLACE_AT_MODERATE (fenders, hood, doors, trunk), quarter_panel = Repair unless severe
- **system_instruction:** separate field in Gemini API (not inline text)
- **responseSchema:** enum constraints for ALL_PARTS (components) and INDICATOR_WEIGHTS (damage indicators)
- **Temperature 0:** deterministic output for consistency
- **VIN OCR:** OpenAI GPT-4o Vision (primary) → Gemini 2.5 Flash → Gemini 3 Flash. Full-text OCR then regex VIN extraction.
- **VIN decode:** NHTSA vPIC API (free, no key). Make/Model/Trim/Engine normalized to match VEHICLE_DB via lowercase comparison. NHTSA values added to Select options if not in our DB.

## VIN Pipeline Design (in progress)
Design spec: `docs/superpowers/specs/2026-04-14-vin-pricing-pipeline-design.md`

Completed:
1. ✅ VIN field in UI + NHTSA auto-fill decode
2. ✅ VIN OCR via OpenAI Vision (Scan button)
3. ✅ VIN in PDF/text reports + claim object

Next:
4. **Reorder pipeline: detection first → VIN-specific price lookup**
5. Implement VIN-specific price lookup (by damaged components, not generic 14 parts)
6. Fallback: VIN lookup → generic LLM lookup → static pricing DB
7. Old pipeline preserved as fallback via code flag

## Key Files
- `damage-assessment-mvp.jsx` — entire UI + Gemini pipeline (~4300 lines)
- `detection-engine.js` — consensus merge, severity/operation derivation, guaranteed pairs
- `pricing-db.js` — static pricing by vehicle class, labor rates by state, tax rates
- `parts-catalog.js` — closed vocabulary of ~235 part names
- `labor-times.js` — labor hours per operation type
- `vehicle-specs.js` / `vehicle-trims.js` — make/model/engine/trim data

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
- v1-v7 test reports in subfolders (v7 = v0.9.8, 4/8 runs identical at $15,690)

## API Keys
- Gemini: in .env / VITE_GEMINI_API_KEY
- OpenAI: in .env / VITE_OPENAI_API_KEY
- Supabase keys: in claimlens-platform/.env.local
- GitHub repos: AndreiOrehov/claimlens-ai and AndreiOrehov/claimlens-platform
