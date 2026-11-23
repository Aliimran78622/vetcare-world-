# VetCare World homepage v3.1 — what changed (23 Nov 2026)

Expansion of the live v3 homepage. Same clean green-white-gold look.
NO settings, functionality, navigation or behaviour changed — only new
sections were added and the look was polished.

## What's new

1. **Browse by Category** (new section, after Explore Knowledge)
   9 SMALL folder cards in a compact 3-across grid — photo on top, name
   below, gold badge with the REAL guide count (counted from each page):
   - Cattle Diseases — 10 Guides → cattle-diseases.html
   - Metabolic Diseases — 4 Guides → metabolic-diseases.html
   - Calf Diseases — 3 Guides → calf-diseases.html
   - Reproductive Diseases — 5 Guides → reproductive-diseases.html
   - Goat Diseases — 10 Guides → goat-diseases.html
   - Parasitic Diseases — 5 Guides → parasitic-diseases.html
   - Theriogenology — 11 Guides → theriogenology.html
   - Surgical Management — 22 Guides → surgical-management-cattle.html
   - Nutrition & Feeding — 6 Guides → nutrition-feeding.html

2. **Trending Diseases 4 → 8 cards** (2 rows of 4, same small cards)
   Added Ketosis, Milk Fever, Bloat and Theileriosis, each with a real
   clinical photo and a link to its real disease page.

3. **Featured Learning Resources 3 → 6 books** (2 rows of 3)
   Added PPR in Goats & Sheep (4.5 MB), Milk Fever in Cattle (3.5 MB)
   and Lumpy Skin Disease (4.9 MB) — real library books with real covers
   and real PDF links. Sizes shown are the real file sizes.

4. **Look polish only**: featured cards now lift on hover like the other
   cards; long folder names wrap cleanly on small phones.

5. **FIX included**: the live v3 "Disease & Treatment" card photo
   (home-cat-disease.jpg) was missing from the repo, so that card showed
   no picture. This ZIP includes the file, which fixes it.

## Files in this ZIP (13, all root-level)

- index.html, app.js (v29.0), style.css (v30.0)
- home4-folder-metabolic.jpg, home4-folder-repro.jpg,
  home4-folder-goat.jpg, home4-folder-parasitic.jpg (new folder photos)
- home-cat-disease.jpg, home-cat-calf.jpg, home-cat-therio.jpg,
  home-cat-surgery.jpg, home-cat-nutrition.jpg (folder photos)
- README-v3.1.md (this file)

## Upload (phone, GitHub)

1. Open this ZIP and upload ALL 13 files to the repo ROOT
   (Aliimran78622/vetcare-world-). Do NOT create any folder.
2. Replace index.html, app.js and style.css when asked.
3. Commit, then wait 1–2 minutes and refresh the site
   (hard refresh if the old homepage still shows).

## Tested

111/111 Playwright checks passed (desktop 1280 + mobile 360/390/412/430):
0 JS/console errors, 0 failed responses, all 49 local links/images HTTP
200, all 33 images sharp, no horizontal overflow, no clipped labels or
buttons at any width. Every new card was click/HTTP verified.
