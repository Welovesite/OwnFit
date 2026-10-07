# OwnFit website

Mobile personal training, boxing, kickboxing and Muay Thai across the UAE.

## Files

| File | What it is |
|---|---|
| `index.html` | Home page (top coach for each service, packages, FAQ, booking form) |
| `personal-training.html`, `boxing.html`, `kickboxing.html`, `muay-thai.html` | One page per service with what we do and the coaches list |
| `coach.html` | Coach profile page. Each coach opens as `coach.html#coach-id` |
| `js/data.js` | **Your WhatsApp number and all coach details.** Edit this file to add or change coaches |
| `js/main.js` | Builds the coach cards and profiles, and the booking form that opens WhatsApp |
| `css/style.css` | Colours, fonts and layout (red & white brand colours are at the top) |
| `assets/coaches/` | Coach photos (replace the placeholders with real photos) |
| `assets/favicon.svg` | Browser tab icon |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Before going live

1. **WhatsApp number** – open `js/data.js` and replace `971500000000` with your number (country code, no `+` or spaces).
2. **Prices** – in `index.html`, search for `[price]` and `[number]` and fill them in.
3. **Instagram** – in `index.html`, replace `https://www.instagram.com/` with your profile link.

## Adding or editing coaches

All coaches live in `js/data.js`. Each coach is one block like this:

```js
{
  id: 'boxing-sara', service: 'boxing', featured: true,
  name: 'Sara Ahmed', gender: 'Female',
  headline: 'Former amateur boxer, technique specialist',
  experience: '8 years',
  photo: 'assets/coaches/sara.jpg',
  certifications: ['Certification 1', 'Certification 2'],
  languages: ['English', 'Arabic'],
  areas: ['Dubai', 'Sharjah'],
  specialties: ['Technique', 'Footwork'],
  bio: ['First paragraph about Sara.', 'Second paragraph.'],
  gallery: [ { src: 'assets/coaches/sara-1.jpg', alt: 'Sara on the pads' } ],
  videos: [ { type: 'youtube', id: 'YOUTUBE_VIDEO_ID', title: 'Combination drill' } ]
}
```

- `service` must be `personal-training`, `boxing`, `kickboxing` or `muay-thai`.
- `featured: true` makes the coach the **Top coach** shown on the home page (one per service).
- Put photos in `assets/coaches/` (portrait photos about 800 × 1000 px work best).
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
