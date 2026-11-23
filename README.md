# VetCare World — Learning Library Redesign (23 Nov 2026)

Premium digital-library redesign of the Books / Learning Library section:
Kindle Store / Google Play Books style — the book cover is the star.

## What changed
- **Book cards (new design):** big full front cover on top (portrait 3:4),
  then title, short 2-line description, file size + Free badge, then
  Read (View) + Download buttons below. The FULL description stays in the
  page (clamped to 2 lines) for SEO, with a "Read more" expand link.
- **Covers:** 32 new professional covers in `covers/` (31 subject-matched
  real photos + `default.jpg` fallback for future books). 480×640 px JPEG.
- **Category filters:** 10 topic pills above the books — All Books,
  Diseases & Treatment (7), Vaccination & Prevention (1), Feed & Nutrition
  (2), Breeds & Breeding (1), Veterinary Surgery (20), Theriogenology,
  Farm Management, Poultry, Other Topics (empty for now — friendly
  "coming soon" message, not a blank page).
- **Search:** "Search books, topics, or diseases..." — searches title,
  description, topic keywords AND topic name; combines with the active
  filter (e.g. Surgery + "hernia" finds the one hernia guide).
- **Layout:** 2-column book gallery on phones (390px and 360px), 4–5
  columns on desktop. Green-white VetCare World branding kept.
- **Homepage:** "Recently Added to the Library" now uses the same vertical
  book cards; Pictures / Videos / PDF Books shortcut cards polished
  (hover + keyboard focus) with no behaviour change.
- **Default view:** the library now opens on the Books folder.
- **Nothing else changed:** no resource, PDF, Supabase URL or database
  record was touched. Covers + categories are client-side only (JS
  mapping in app.js). View / Download / admin upload / publish /
  unpublish / delete all work exactly as before. All 106 resources
  (31 books + 75 pictures) are preserved, no duplicates.

## Files in this ZIP (36 files, ~2.1 MB)
- `index.html` — version bumps (style.css v25.0, app.js v24.0), topic pill
  bar, Books as the default folder.
- `app.js` — cover/topic/keyword mappings, new vertical book cards,
  topic filters, search incl. topic names, homepage book cards.
- `style.css` — book-gallery grid, vertical card styles, pills, mobile rules.
- `covers/` — 32 JPG covers (see list below).
- `README.md` — this file (do NOT upload to the repo; it is for you only).

## How to upload (GitHub website, from your phone)
1. Open the repo **Aliimran78622/vetcare-world-** on github.com.
2. Upload `index.html`, `app.js`, `style.css` to the repo ROOT
   (Add file → Upload files) — they REPLACE the old versions.
3. Upload the whole `covers/` folder with all 32 JPGs to the repo ROOT,
   keeping the folder name exactly `covers/` (GitHub web upload: drag the
   folder in, or create the folder first, then upload the 32 files into it).
4. Commit, then wait 1–2 minutes for GitHub Pages to publish.
5. Open the site and hard-refresh (or clear cache) — the new library
   appears with covers. If covers do not show, check the `covers/` folder
   is at the repo root with all 32 files inside.

## Cover list (covers/*.jpg)
- mastitis.jpg — bovine mastitis guide (hand-milking photo)
- ketosis.jpg — Ketosis in Cattle (dairy cows)
- ppr.jpg — PPR in Goats and Sheep (goats grazing)
- milk-fever.jpg — Milk Fever in Dairy Cattle (cows lying down)
- milk-fever-parturient.jpg — Milk Fever in Dairy Cows, Parturient Paresis
- lsd.jpg — Lumpy Skin Disease (black cattle close-up)
- disease-short-treatments.jpg — Disease Short Treatments (vaccine vials)
- wanda.jpg — Wanda Formulation Guide (cow eating)
- silage.jpg — Silage Making & Feeding (hay rake in field)
- vaccination.jpg — Vaccination Calendar (vet vaccinating zebu cow)
- cholistani.jpg — Cholistani Crossbreeding (female zebu cattle)
- surgery-penile.jpg, surgery-csection-complications.jpg,
  surgery-abscess.jpg, surgery-fracture.jpg, surgery-prolapse.jpg,
  surgery-rectal-prolapse.jpg, surgery-wound.jpg, surgery-enucleation.jpg,
  surgery-teat.jpg, surgery-digit.jpg, surgery-lda-rda.jpg,
  surgery-ovariectomy.jpg, surgery-castration.jpg, surgery-urethrotomy.jpg,
  surgery-laparotomy.jpg, surgery-rumenotomy.jpg, surgery-caesarean.jpg,
  surgery-hernia.jpg, surgery-dehorning.jpg, surgery-tail-docking.jpg
  (20 surgery guides — varied real veterinary/clinical photos)
- default.jpg — fallback cover for future books without a mapped cover

Note: a few covers are close stand-ins because no free photo of the exact
subject exists (e.g. LSD shows cattle, not skin nodules; tail docking and
hernia show healthy cattle; penile / rectal-prolapse / urethrotomy show
professional vet surgery photos). They can be swapped later by replacing
the single JPG file with the same name.

## Tested (23 Nov 2026, Playwright + real Supabase data, 106 rows)
44/44 automated checks passed, 0 JS/console errors: all 31 books render
with covers, all 10 filters show the right counts, search + filter combos
work, View links point to the real Supabase PDFs, all 106 resources intact,
mobile 2-column grid at 390px and 360px with no horizontal overflow,
homepage sections intact. Screenshots reviewed (desktop + mobile).
