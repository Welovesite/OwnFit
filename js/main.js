(function () {
  var D = window.OWNFIT || { whatsapp: '', services: {}, coaches: [] };
  var SERVICE_ORDER = ['personal-training', 'boxing', 'kickboxing', 'muay-thai'];

  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function svc(key) { return D.services[key] || { name: key, page: 'index.html' }; }
  function coachById(id) { return D.coaches.filter(function (c) { return c.id === id; })[0]; }
  function coachesFor(key) {
    return D.coaches.filter(function (c) { return c.service === key; })
      .sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
  }
  function topCoach(key) {
    var list = coachesFor(key);
    return list.filter(function (c) { return c.featured; })[0] || list[0];
  }
  var HOME = document.body.getAttribute('data-home') || 'index.html';
  function profileUrl(c) { return 'coach.html#' + c.id; }
  function bookUrl(c) { return HOME + '#book-coach-' + c.id; }

  /* ---------- Common ---------- */
  var yr = $('yr'); if (yr) yr.textContent = new Date().getFullYear();
  document.querySelectorAll('[data-wa-num]').forEach(function (el) {
    el.textContent = '+' + D.whatsapp.replace(/^(\d{3})(\d{2})(\d{3})(\d{4})$/, '$1 $2 $3 $4');
  });
  var menuBtn = $('menu-btn'), nav = $('main-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- Coach card ---------- */
  function card(c, opts) {
    opts = opts || {};
    var s = svc(c.service);
    var cert = (c.certifications || [])[0] || '';
    return '' +
      '<article class="c-card">' +
        '<a class="c-photo" href="' + profileUrl(c) + '" aria-label="View ' + esc(c.name) + '’s profile">' +
          '<img src="' + esc(c.photo) + '" alt="' + esc(c.name) + '" loading="lazy">' +
          (c.featured ? '<span class="c-badge label">Top coach</span>' : '') +
        '</a>' +
        '<div class="c-body">' +
          (opts.showService ? '<a class="c-svc label" href="' + esc(s.page) + '">' + esc(s.name) + '</a>' : '') +
          '<h3><a href="' + profileUrl(c) + '">' + esc(c.name) + '</a></h3>' +
          '<p class="c-head">' + esc(c.headline) + '</p>' +
          '<ul class="c-meta">' +
            (cert ? '<li><span>Certified</span>' + esc(cert) + '</li>' : '') +
            '<li><span>Experience</span>' + esc(c.experience) + '</li>' +
            '<li><span>Languages</span>' + esc((c.languages || []).join(', ')) + '</li>' +
          '</ul>' +
          '<div class="c-actions">' +
            '<a class="btn btn-red" href="' + bookUrl(c) + '">Book now</a>' +
            '<a class="btn btn-line" href="' + profileUrl(c) + '">View profile</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* Home: top coach for each service */
  var top = $('top-coaches');
  if (top) {
    top.innerHTML = SERVICE_ORDER.map(function (k) {
      var c = topCoach(k); return c ? card(c, { showService: true }) : '';
    }).join('');
  }

  /* Service page: all coaches for the service */
  document.querySelectorAll('[data-coach-list]').forEach(function (el) {
    var list = coachesFor(el.getAttribute('data-coach-list'));
    el.innerHTML = list.length ? list.map(function (c) { return card(c); }).join('')
      : '<p class="empty">New coaches are joining soon. Message us on WhatsApp to be matched with a coach.</p>';
  });

  /* ---------- Coach profile page ---------- */
  var profile = $('profile');
  function renderProfile() {
    var id = location.hash.replace(/^#/, '');
    var c = coachById(id);
    var crumbSvc = $('crumb-svc'), crumbName = $('crumb-name');
    if (!c) {
      document.title = 'Coach not found | OwnFit';
      crumbSvc.hidden = true; crumbName.textContent = 'Coach not found';
      profile.innerHTML = '<div class="empty-state"><h1>Coach not found</h1><p>This profile link may be out of date. Pick a coach from one of our services.</p>' +
        '<div class="c-actions">' + SERVICE_ORDER.map(function (k) {
          return '<a class="btn btn-line" href="' + svc(k).page + '">' + esc(svc(k).name) + '</a>';
        }).join('') + '</div></div>';
      $('more-coaches-wrap').hidden = true;
      return;
    }
    var s = svc(c.service);
    document.title = c.name + ' | ' + s.name + ' coach | OwnFit';
    crumbSvc.hidden = false; crumbSvc.href = s.page; crumbSvc.textContent = s.name;
    crumbName.textContent = c.name;

    function list(arr) { return (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); }

    var gallery = (c.gallery || []).length
      ? '<div class="gallery">' + c.gallery.map(function (g, i) {
          return '<button type="button" class="g-item" data-g="' + i + '" aria-label="Open photo: ' + esc(g.alt) + '"><img src="' + esc(g.src) + '" alt="' + esc(g.alt) + '" loading="lazy"></button>';
        }).join('') + '</div>'
      : '<p class="empty">More photos of ' + esc(c.name) + ' coming soon.</p>';

    var videos = (c.videos || []).length
      ? '<div class="videos">' + c.videos.map(function (v) {
          if (v.type === 'youtube') {
            return '<figure class="v-item"><div class="v-frame"><iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + '" title="' + esc(v.title) + '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><figcaption>' + esc(v.title) + '</figcaption></figure>';
          }
          return '<figure class="v-item"><div class="v-frame"><video src="' + esc(v.src) + '" controls preload="metadata"></video></div><figcaption>' + esc(v.title) + '</figcaption></figure>';
        }).join('') + '</div>'
      : '<div class="videos"><div class="v-item v-empty"><div class="v-frame"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/></svg><span>Training videos coming soon</span></div></div></div>';

    profile.innerHTML = '' +
      '<div class="profile">' +
        '<div class="p-photo"><img src="' + esc(c.photo) + '" alt="' + esc(c.name) + '">' +
          (c.featured ? '<span class="c-badge label">Top ' + esc(s.name) + ' coach</span>' : '') + '</div>' +
        '<div class="p-info">' +
          '<a class="label p-svc" href="' + esc(s.page) + '">' + esc(s.name) + ' coach</a>' +
          '<h1>' + esc(c.name) + '</h1>' +
          '<p class="p-head">' + esc(c.headline) + '</p>' +
          '<dl class="facts">' +
            '<div><dt>Experience</dt><dd>' + esc(c.experience) + '</dd></div>' +
            '<div><dt>Coach</dt><dd>' + esc(c.gender) + '</dd></div>' +
            '<div><dt>Languages</dt><dd>' + esc((c.languages || []).join(', ')) + '</dd></div>' +
            '<div><dt>Covers</dt><dd>' + esc((c.areas || []).join(', ')) + '</dd></div>' +
          '</dl>' +
          '<div class="p-block"><h2 class="label">Certifications</h2><ul class="ticklist">' + list(c.certifications) + '</ul></div>' +
          '<div class="p-block"><h2 class="label">Specialties</h2><ul class="tags">' + list(c.specialties) + '</ul></div>' +
          '<div class="c-actions"><a class="btn btn-red" href="' + bookUrl(c) + '">Book with ' + esc(c.name) + '</a></div>' +
        '</div>' +
      '</div>' +
      '<section class="p-section"><h2>About</h2><div class="bio">' + (c.bio || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></section>' +
      '<section class="p-section"><h2>Photos</h2>' + gallery + '</section>' +
      '<section class="p-section"><h2>Videos</h2>' + videos + '</section>';

    var more = coachesFor(c.service).filter(function (o) { return o.id !== c.id; });
    $('more-coaches-wrap').hidden = !more.length;
    $('more-title').textContent = 'More ' + s.name + ' coaches';
    $('more-coaches').innerHTML = more.map(function (o) { return card(o); }).join('');

    profile.querySelectorAll('[data-g]').forEach(function (b) {
      b.addEventListener('click', function () { openLightbox(c.gallery, +b.getAttribute('data-g'), b); });
    });
    window.scrollTo(0, 0);
  }
  if (profile) { renderProfile(); window.addEventListener('hashchange', renderProfile); }

  /* Lightbox */
  var lb = $('lightbox'), lbImg = $('lb-img'), lbCap = $('lb-cap'), lbItems = [], lbIdx = 0, lbReturn = null;
  function showLb() { var g = lbItems[lbIdx]; lbImg.src = g.src; lbImg.alt = g.alt; lbCap.textContent = g.alt + '  (' + (lbIdx + 1) + ' / ' + lbItems.length + ')'; }
  function openLightbox(items, i, from) { lbItems = items; lbIdx = i; lbReturn = from; showLb(); lb.hidden = false; $('lb-close').focus(); }
  function closeLb() { lb.hidden = true; if (lbReturn) lbReturn.focus(); }
  if (lb) {
    $('lb-close').addEventListener('click', closeLb);
    $('lb-prev').addEventListener('click', function () { lbIdx = (lbIdx - 1 + lbItems.length) % lbItems.length; showLb(); });
    $('lb-next').addEventListener('click', function () { lbIdx = (lbIdx + 1) % lbItems.length; showLb(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') $('lb-prev').click();
      if (e.key === 'ArrowRight') $('lb-next').click();
    });
  }

  /* ---------- Booking (home page) ---------- */
  var full = $('full');
  if (!full) return;

  // Coach dropdown grouped by service
  var coachSel = $('f-coachname');
  coachSel.innerHTML = '<option value="">Any coach</option>' + SERVICE_ORDER.map(function (k) {
    return '<optgroup label="' + esc(svc(k).name) + '">' + coachesFor(k).map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>';
    }).join('') + '</optgroup>';
  }).join('');
  coachSel.addEventListener('change', function () {
    var c = coachById(coachSel.value); if (c) $('f-disc').value = svc(c.service).name;
  });

  function applyHash() {
    var h = location.hash, m;
    if ((m = h.match(/^#book-coach-(.+)$/))) {
      var c = coachById(m[1]);
      if (c) { coachSel.value = c.id; $('f-disc').value = svc(c.service).name; }
    } else if ((m = h.match(/^#book-svc-(.+)$/))) {
      if (D.services[m[1]]) $('f-disc').value = svc(m[1]).name;
    } else { return; }
    $('book').scrollIntoView();
    $('f-name').focus({ preventScroll: true });
  }
  applyHash();
  window.addEventListener('hashchange', applyHash);

  var chips = Array.prototype.slice.call(document.querySelectorAll('#q-chips .chip'));
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); });
    });
  });
  var quick = $('quick');
  if (quick) quick.addEventListener('submit', function (e) {
    e.preventDefault();
    var picked = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })[0];
    if (picked) $('f-disc').value = picked.dataset.v;
    $('f-emirate').value = $('q-emirate').value;
    $('book').scrollIntoView();
    $('f-name').focus({ preventScroll: true });
  });
  document.querySelectorAll('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () { $('f-plan').value = a.dataset.plan; });
  });

  full.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('f-name').value.trim(), phone = $('f-phone').value.trim(), err = $('f-err');
    if (!name || !phone) {
      err.textContent = 'Add your name and mobile number so your coach can reach you.';
      err.hidden = false;
      (name ? $('f-phone') : $('f-name')).focus();
      return;
    }
    err.hidden = true;
    var coach = coachById(coachSel.value);
    var lines = [
      'Hi OwnFit, I would like to book a session.',
      'Name: ' + name,
      'Mobile: ' + phone,
      'Training: ' + $('f-disc').value,
      'Coach: ' + (coach ? coach.name + ' (' + coach.id + ')' : 'Any coach'),
      'Package: ' + $('f-plan').value,
      'Location: ' + [$('f-area').value.trim(), $('f-emirate').value].filter(Boolean).join(', '),
      'Preferred time: ' + $('f-time').value,
      'Coach preference: ' + $('f-coach').value
    ];
    var notes = $('f-notes').value.trim();
    if (notes) lines.push('Notes: ' + notes);
    var text = lines.join('\n');
    $('msg').textContent = text;
    $('wa-link').href = 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(text);
    $('done').hidden = false;
    $('done').scrollIntoView({ block: 'nearest' });
  });

  $('copy').addEventListener('click', function () {
    var btn = this, text = $('msg').textContent;
    var ok = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy message'; }, 1800); };
    var fallback = function () {
      var r = document.createRange(); r.selectNodeContents($('msg'));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      btn.textContent = 'Selected, press copy';
    };
    try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (x) { fallback(); }
  });
})();
