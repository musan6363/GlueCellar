# AGENTS.md

When implementing using a coding agent, be sure to adhere to the following points.

## Project Overview
**Glue Cellar** is a mobile-first Progressive Web App (PWA) designed for recording wine tasting notes. The UI mimics the tactile feel of physical craft paper cards, with a Cover Flow-style gallery for browsing records.

## Design Philosophy & Architecture
- **Local-First / Serverless:** All data is strictly persisted in the browser's IndexedDB. There is no backend server.
- **Static Deployment:** Designed to be hosted as a static site on GitHub Pages. Any future features must accommodate a purely static front-end architecture.
- **Mobile-First UI:** Optimized for narrow screens. Uses CSS Grid/Flexbox for automatic wrapping and horizontal snap-scrolling for the gallery.
- **Analog Aesthetics:** Uses Tailwind CSS to generate a craft paper texture (`bg-craft-paper`), hand-drawn border radiuses (`taste-oval`), and the "Noto Sans JP" font to maintain a clean yet warm analog feel.

## Tech Stack
- **Framework:** React + Vite + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Dexie.js (IndexedDB wrapper) + `dexie-react-hooks`
- **Icons:** `lucide-react`
- **PWA:** `vite-plugin-pwa`

## Data Structure (Dexie.js)
The database operates on schema version `2` with two primary stores:

### 1. `wineLists` (Table)
Manages collections of wine cards.
- `id` (string, UUID): Primary Key.
- `name` (string): Display name of the list.
- `isMyList` (boolean): Flag indicating if the list originated from the current user.
- `createdAt` (string): ISO Date string.

### 2. `wineCards` (Table)
Individual tasting records.
- `id` (string, UUID): Primary Key.
- `listId` (string, UUID): Foreign key mapping to `wineLists`.
- `janCode` (string, optional): Barcode number.
- `name`, `country`, `grapes` (string): Basic text info.
- `glassCount`, `bottleCount` (number): Integer counters.
- `rating5` (number): 0 to 5.
- `tastes` (Record<string, 0 | 1 | 2>): 0 = None, 1 = Dashed (slight), 2 = Solid (strong). Only 24 default keys are used for evaluation.
- `memo` (string): Multiline text.
- `images` (string[]): Up to 2 images stored as Base64 data URIs.
- `createdAt`, `updatedAt` (string): ISO Date strings.

## Functional Requirements
- **Card Lifecycle:** Users can create, read, update, and delete wine cards. When editing is canceled, state must revert without saving.
- **Taste Evaluation:** 24 default attributes configured as a 3-state toggle (Unselected -> Dashed Circle -> Solid Circle -> Unselected).
- **Camera/Image Integration:** Uses native HTML `<input type="file" capture="environment">` to trigger device cameras directly for photos.
- **Import/Export (Crucial Constraint):** 
  - Exports combine the active `WineList` and its associated `WineCard`s into a single JSON file.
  - Imports **must never overwrite** existing data. All imported lists and cards are assigned fresh UUIDs upon ingestion to ensure they exist as standalone parallel collections, preventing conflicts.

## Non-Functional Requirements & Deployment Constraints
- **GitHub Pages Routing:** Vite's `base` configuration must be correctly set when deploying to GitHub Pages to resolve static assets.
- **HTTPS:** The deployment must be served over HTTPS to allow native PWA installation prompts and camera API access.
- **Storage Limits:** Images are stored as Base64 strings in IndexedDB. Logic should ensure file size/compression is manageable to prevent exceeding browser storage quotas.
