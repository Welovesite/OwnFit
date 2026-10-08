# OwnFit website

Mobile personal training, boxing, kickboxing and Muay Thai across the UAE.

## Files

| File | What it is |
|---|---|
| `index.html` / `index-ar.html` | Home page in English / Arabic (top coach for each service, packages, FAQ, booking form) |
| `personal-training.html`, `boxing.html`, `kickboxing.html`, `muay-thai.html` | One page per service (English) |
| `personal-training-ar.html`, `boxing-ar.html`, `kickboxing-ar.html`, `muay-thai-ar.html` | The same service pages in Arabic (right-to-left) |
| `coach.html` / `coach-ar.html` | Coach profile page. Each coach opens as `coach.html#coach-id` or `coach-ar.html#coach-id` |
| `js/data.js` | **Your WhatsApp number and all coach details, in English and Arabic.** Edit this file to add or change coaches |
| `js/main.js` | Builds the coach cards and profiles, and the booking form that opens WhatsApp |
| `css/style.css` | Colours, fonts and layout (red & white brand colours are at the top) |
| `assets/coaches/` | Coach photos (replace the placeholders with real photos) |
| `assets/favicon.svg` | Browser tab icon |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Before going live

1. **WhatsApp number** – open `js/data.js` and replace `971500000000` with your number (country code, no `+` or spaces).
2. **Prices** – in `index.html` search for `[price]` and `[number]`, and in `index-ar.html` search for `[السعر]` and `[العدد]`, and fill them in.
3. **Instagram** – in all pages, replace `https://www.instagram.com/` with your profile link.

## Languages

Every page has an English and an Arabic version. The **العربية / English** button at the top switches to the same page in the other language (it keeps the coach you are looking at). Arabic visitors who fill in the booking form send their WhatsApp request in Arabic.

To make Arabic the default when people visit your domain, swap the names of `index.html` and `index-ar.html` (and update the links), or ask your developer to do it.

## Adding or editing coaches

All coaches live in `js/data.js`. Each coach is one block like this:

```js
{
  id: 'sara-ahmed', services: ['boxing', 'kickboxing'], featured: true,
  name: 'Sara Ahmed', name_ar: 'سارة أحمد',
  gender: 'Female', gender_ar: 'مدربة',
  headline: 'Former amateur boxer, technique specialist',
  headline_ar: 'ملاكمة هاوية سابقة ومتخصصة في التقنية',
  experience: '8 years', experience_ar: '8 سنوات',
  photo: 'assets/coaches/sara.jpg',
  certifications: ['Certification 1', 'Certification 2'],
  languages: ['English', 'Arabic'],
  areas: ['Dubai', 'Sharjah'],
  specialties: ['Technique', 'Footwork'],
  bio: ['First paragraph about Sara.', 'Second paragraph.'],
  bio_ar: ['الفقرة الأولى عن سارة.', 'الفقرة الثانية.'],
  gallery: [ { src: 'assets/coaches/sara-1.jpg', alt: 'Sara coaching', alt_ar: 'سارة أثناء التدريب' } ],
  videos: [ { type: 'youtube', id: 'YOUTUBE_VIDEO_ID', title: 'Combination drill', title_ar: 'تمرين التركيبات' } ]
}
```

- Every text field has an Arabic twin ending in `_ar` (`certifications_ar`, `languages_ar`, `areas_ar`, `specialties_ar`, ...). If you leave an Arabic field out, the Arabic page shows the English text.
- `services` is a list of `personal-training`, `boxing`, `kickboxing`, `muay-thai`. The coach appears on every service page listed.
- `achievements` is a list like `{ text: 'UAE Muay Thai Champion', text_ar: 'بطل الإمارات في المواي تاي', year: 2024, place: 1 }` (place 1, 2, 3, or 0 for no medal).
- `highlights` (+ `highlights_ar`) is the "Coaching experience" bullet list.
- Any field you leave empty is hidden on the site.
- `featured: true` shows the coach in **Top coaches** on the home page.
- Put photos in `assets/coaches/` (portrait photos about 900 × 1200 px work best) and videos in `assets/videos/`. Keep each video under 25 MB so it can be uploaded through the GitHub website.
- For YouTube videos, `id` is the part after `v=` in the video link. You can also upload a short `.mp4` and use `{ type: 'file', src: 'assets/videos/intro.mp4', title: 'Intro' }`.
- To remove a coach, delete their block. To add one, copy a block and change the details.

## Publish with GitHub Pages

1. Create a new repository on GitHub (e.g. `ownfit-website`).
2. Upload all files from this folder (keep the folder structure), or push with git:
   ```
   git init
   git add .
   git commit -m "OwnFit website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/ownfit-website.git
   git push -u origin main
   ```
3. In the repository go to **Settings → Pages**, set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`, and save.
4. After a minute the site is live at `https://YOUR-USERNAME.github.io/ownfit-website/`.

## Using your own domain (e.g. ownfit.ae)

In **Settings → Pages → Custom domain**, enter your domain, then add the DNS records GitHub shows you at your domain provider. Tick **Enforce HTTPS** once it is available.
