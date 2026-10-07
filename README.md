# OwnFit website

Mobile personal training, boxing, kickboxing and Muay Thai across the UAE.

## Files

| File | What it is |
|---|---|
| `index.html` | The whole page |
| `css/style.css` | Colours, fonts and layout (red & white brand colours are at the top) |
| `js/main.js` | Booking form that opens WhatsApp |
| `assets/favicon.svg` | Browser tab icon |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |

## Before going live

1. **WhatsApp number** – open `js/main.js` and replace `971500000000` with your number (country code, no `+` or spaces).
2. **Prices** – in `index.html`, search for `[price]` and `[number]` and fill them in.
3. **Instagram** – in `index.html`, replace `https://www.instagram.com/` with your profile link.

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
