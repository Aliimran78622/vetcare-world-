# VetCare World — Homepage v3 (23 Nov 2026)

Built exactly to your final reference mockup. Clean premium GREEN + WHITE + GOLD only — no dense grids, no rainbow colours.

## What changed
- **Hero** — new AI-polished photo (vet in white coat + Holstein + brown cow + calves + goats), "Healthy Animals. **Prosperous Farmers.**" with yellow highlight + swoosh, green "Explore Knowledge" + white "Join Community" buttons.
- **Search bar** — "Search diseases, treatments, breeds, books..." + green Search button (live search, same as before).
- **4 quick pills** — Diseases, Vaccination, Nutrition, Breeding (all linked to real pages).
- **Explore Knowledge** — 6 wide image cards, green label bands: Disease & Treatment, Vaccination, Feed & Nutrition, Breeds & Breeding, Farm Management, Poultry.
- **Featured Learning Resources** — 3 real books (Mastitis in Cattle, Ketosis in Cattle, Vaccination Calendar) with their real covers + green "View guide →" buttons opening the real PDFs.
- **Trending Diseases** — Mastitis, FMD, PPR, Lumpy Skin with clinical photos, linking to the real disease pages.
- **Watch & Learn + Global Community** — two tinted cards (Watch Now / Join Now).
- **Livestock Marketplace** — full-width green banner + yellow "Explore Marketplace →" button.
- **Earning Centre** — light green strip, links to the Earning page.
- **Community feed kept** — composer + real member posts below the Earning strip.
- Header, top nav, footer and bottom nav unchanged. All other pages untouched.

## Files in this zip (18)
- `index.html` (app.js v28.0, style.css v29.0)
- `app.js` — featured resources now show exactly the 3 books above
- `style.css` — new v3 styles (old v2 styles left in place, harmless)
- 14 new images: `home3-hero.jpg`, `home3-hero-mobile.jpg`, `home3-cat-vaccination.jpg`, `home3-cat-feed.jpg`, `home3-cat-breeds.jpg`, `home3-cat-farm.jpg`, `home3-cat-poultry.jpg`, `home3-dis-mastitis.jpg`, `home3-dis-fmd.jpg`, `home3-dis-ppr.jpg`, `home3-dis-lsd.jpg`, `home3-watch.jpg`, `home3-community.jpg`, `home3-market.jpg`

NOT in this zip (already live on the site): `home-cat-disease.jpg`, `mastitis.jpg`, `ketosis.jpg`, `vaccination.jpg`.

## Upload instructions (phone)
1. Open the GitHub repo **Aliimran78622/vetcare-world-** in your browser.
2. Upload ALL 17 files to the **repo ROOT** (the main folder — no subfolders). Upload in 2–3 small batches if needed.
3. Commit the changes.
4. Wait 1–2 minutes, then open the site and hard-refresh (pull down to refresh / clear cache). The new homepage should appear.

## Tested
105/105 Playwright checks passed at desktop 1280px + mobile 360/390/412/430px with real data: every link returns 200, every button opens its real page, no JS errors, no overflow, all images sharp (natural size ≥ display size).
