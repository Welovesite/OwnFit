/* OwnFit – simple, private visitor counter (only the super admin can read it).
   Records page views, clicks and booking requests. No names, emails, IP addresses or cookies –
   just a random visitor number kept in this browser. */
(function () {
  try {
    var ua = navigator.userAgent || '';
    if (navigator.webdriver || /bot|crawl|spider|slurp|lighthouse|headless|preview|facebookexternalhit|whatsapp/i.test(ua)) return;
    var ls = null, ss = null;
    try { ls = window.localStorage; ss = window.sessionStorage; } catch (x) { /* storage blocked */ }
    function get(s, k) { try { return s ? s.getItem(k) : null; } catch (x) { return null; } }
    function put(s, k, v) { try { if (s) s.setItem(k, v); } catch (x) { /* ignore */ } }
    if (get(ls, 'ownfit_notrack') === '1') return; // the super admin's own browser

    var URL = 'https://firestore.googleapis.com/v1/projects/ownfit-baea8/databases/(default)/documents/events?key=AIzaSyBPu2_PTeWKDNcch-AQ7tfI4_z1nbhdwUs';
    function rid() {
      var a = new Uint8Array(9), s = '';
      (window.crypto || window.msCrypto).getRandomValues(a);
      for (var i = 0; i < a.length; i++) s += ('0' + a[i].toString(36)).slice(-2);
      return s.slice(0, 16);
    }
    var vid = get(ls, 'ownfit_vid'); if (!vid) { vid = rid(); put(ls, 'ownfit_vid', vid); }
    var sid = get(ss, 'ownfit_sid'), newVisit = !sid;
    if (!sid) { sid = rid(); put(ss, 'ownfit_sid', sid); }

    var path = (location.pathname.split('/').pop() || 'index.html').slice(0, 80);
    if (/^coach(-ar)?\.html$/.test(path) && location.hash) path += location.hash.slice(0, 40);
    var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
    var w = Math.min(window.innerWidth || 1024, screen.width || 1024);
    var device = /iPad|Tablet/i.test(ua) || (w >= 600 && w < 1024 && /Mobi|Android/i.test(ua)) ? 'tablet' : (w < 600 || /Mobi/i.test(ua) ? 'mobile' : 'desktop');

    function source() {
      var r = document.referrer, h = '';
      try { h = r ? new window.URL(r).hostname.replace(/^www\./, '') : ''; } catch (x) { h = ''; }
      if (h === location.hostname.replace(/^www\./, '')) h = '';
      var q = new URLSearchParams(location.search), utm = q.get('utm_source') || (q.get('gclid') ? 'google-ads' : q.get('fbclid') ? 'facebook' : '');
      return (utm || h || 'direct').toLowerCase().slice(0, 60);
    }
    function uaeDay() { return new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10); } // UAE time, no daylight saving

    function send(type, label) {
      var f = {
        t: { stringValue: type }, p: { stringValue: path }, v: { stringValue: vid }, s: { stringValue: sid },
        d: { stringValue: uaeDay() }, at: { timestampValue: new Date().toISOString() },
        dv: { stringValue: device }, lg: { stringValue: lang }
      };
      if (label) f.l = { stringValue: String(label).replace(/\s+/g, ' ').trim().slice(0, 80) };
      if (type === 'view') { f.n = { booleanValue: newVisit }; if (newVisit) f.r = { stringValue: source() }; newVisit = false; }
      try {
        fetch(URL, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) })
          .catch(function () { /* never bother the visitor */ });
      } catch (x) { /* ignore */ }
    }
    window.ownfitTrack = send;

    // Name a click so the report is easy to read
    function label(el) {
      if (el.hasAttribute('data-track')) return el.getAttribute('data-track');
      var href = el.getAttribute('href') || '', text = (el.textContent || el.getAttribute('aria-label') || '').trim();
      if (/wa\.me|whatsapp/i.test(href)) return 'WhatsApp';
      if (/^tel:/i.test(href)) return 'Call';
      if (/^mailto:/i.test(href)) return 'Email';
      if (/instagram\.com/i.test(href)) return 'Instagram';
      if (/tiktok\.com/i.test(href)) return 'TikTok';
      if (/facebook\.com/i.test(href)) return 'Facebook';
      if (/youtube\.com|youtu\.be/i.test(href)) return 'YouTube';
      var m = href.match(/coach(?:-ar)?\.html#([a-z0-9-]+)/) || href.match(/coach-([a-z0-9-]+?)(-ar)?\.html/);
      if (m) return 'Trainer profile: ' + m[1];
      if (el.hasAttribute('data-plan')) return 'Package: ' + el.getAttribute('data-plan');
      if (/#book/.test(href)) return 'Book now';
      if (/login\.html/.test(href)) return 'Login';
      if (/^https?:/i.test(href) && href.indexOf(location.hostname) < 0) {
        try { return 'Link: ' + new window.URL(href).hostname.replace(/^www\./, ''); } catch (x) { return 'Link'; }
      }
      if (/-ar\.html|index-ar/.test(href) && !/-ar\.html/.test(path)) return 'Switch to Arabic';
      if (href && !/-ar\.html/.test(href) && /-ar\.html/.test(path) && /\.html/.test(href)) return 'Switch to English';
      return text ? text.slice(0, 50) : (href || el.tagName.toLowerCase());
    }
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('a[href],button,[data-track]') : null;
      if (!el || el.closest('[data-notrack]') || el.type === 'submit') return;
      send('click', label(el));
    }, true);

    send('view');
  } catch (x) { /* tracking must never break the site */ }
})();
