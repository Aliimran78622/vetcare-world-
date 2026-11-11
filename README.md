# VetCare World — v22.0

Responsive English/Urdu livestock education and community website for GitHub Pages.

## Deploy
Upload the **contents** of this folder to the root of the GitHub Pages repository's `main` branch, replacing same-name files. Do not upload the folder as a nested directory.

## Important files
- `index.html`, `style.css`, `app.js`: main website
- `knowledge.html`, `disease-treatment.html`, `about-us.html`, `contact.html`, `privacy-policy.html`: public pages
- `robots.txt`, `sitemap.xml`: search indexing files
- `sw.js`, `manifest.json`: PWA support
- `LEARNING-LIBRARY-SETUP.sql`, `COMMUNITY-ACTIONS-SETUP.sql`, `MEMBER-AUDIO-UPLOAD-SETUP.sql`: optional Supabase setup scripts

See `START_HERE_UR.txt` and `CONNECTION-AND-SUPABASE-GUIDE-UR.txt` before deployment or database changes.

## Security note
The browser app uses a Supabase publishable key. Never place a Supabase `service_role` or secret key in frontend files. Database security depends on correctly configured Row Level Security policies and Supabase Auth settings.

## Verification boundary
Local JavaScript syntax, JSON, sitemap XML, page metadata and local file references were checked. A local ZIP review cannot verify the live GitHub Pages deployment, Supabase project state, Auth redirect allowlist, email delivery, Storage policies or connectivity from another country's carrier network.
