(function () {
  var D = window.OWNFIT || { whatsapp: '', coaches: [] };
  var LANG = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  var RTL = LANG === 'ar';
  var SUF = document.body.getAttribute('data-suffix') || '';
  var HOME = document.body.getAttribute('data-home') || ('index' + SUF + '.html');
  var KEYS = ['personal-training', 'boxing', 'kickboxing', 'muay-thai'];

  var I18N = {
    en: {
      svc: { 'personal-training': 'Personal Training', 'boxing': 'Boxing', 'kickboxing': 'Kickboxing', 'muay-thai': 'Muay Thai' },
      mix: 'A mix', topCoach: 'Top coach', topSvcCoach: 'Top {s} coach', svcCoach: '{s} coach',
      certified: 'Certified', experience: 'Experience', languages: 'Languages', coach: 'Coach', covers: 'Covers',
      bookNow: 'Book now', viewProfile: 'View profile', viewAria: 'View {n}’s profile',
      empty: 'New coaches are joining soon. Message us on WhatsApp to be matched with a coach.',
      nfTitle: 'Coach not found', nfText: 'This profile link may be out of date. Pick a coach from one of our services.',
      pageTitle: '{n} | {s} | OwnFit', nfPageTitle: 'Coach not found | OwnFit',
      certs: 'Certifications', specs: 'Specialties', bookWith: 'Book with {n}', about: 'About', photos: 'Photos', videos: 'Videos',
      photosSoon: 'More photos of {n} coming soon.', videosSoon: 'Training videos coming soon', openPhoto: 'Open photo: {a}',
      more: 'More {s} coaches', anyCoach: 'Any coach',
      err: 'Add your name and mobile number so your coach can reach you.',
      msg: { hi: 'Hi OwnFit, I would like to book a session.', name: 'Name', mobile: 'Mobile', training: 'Training', coach: 'Coach',
             pkg: 'Package', loc: 'Location', time: 'Preferred time', pref: 'Coach preference', notes: 'Notes' },
      copied: 'Copied', copy: 'Copy message', selected: 'Selected, press copy',
      achievements: 'Achievements', highlights: 'Coaching experience', topTitle: 'Top title', and: ' & ',
      place: { 1: '1st', 2: '2nd', 3: '3rd' }
    },
    ar: {
      svc: { 'personal-training': 'التدريب الشخصي', 'boxing': 'الملاكمة', 'kickboxing': 'الكيك بوكسينغ', 'muay-thai': 'المواي تاي' },
      mix: 'مزيج من التخصصات', topCoach: 'أفضل مدرب', topSvcCoach: 'أفضل مدرب {s}', svcCoach: 'مدرب {s}',
      certified: 'الشهادة', experience: 'الخبرة', languages: 'اللغات', coach: 'المدرب', covers: 'المناطق',
      bookNow: 'احجز الآن', viewProfile: 'عرض الملف', viewAria: 'عرض ملف {n}',
      empty: 'ينضم مدربون جدد قريباً. راسلنا على واتساب لنوفّق بينك وبين مدرب.',
      nfTitle: 'المدرب غير موجود', nfText: 'قد يكون رابط الملف قديماً. اختر مدرباً من إحدى خدماتنا.',
      pageTitle: '{n} | {s} | OwnFit', nfPageTitle: 'المدرب غير موجود | OwnFit',
      certs: 'الشهادات', specs: 'التخصصات', bookWith: 'احجز مع {n}', about: 'نبذة', photos: 'الصور', videos: 'الفيديوهات',
      photosSoon: 'المزيد من صور {n} قريباً.', videosSoon: 'فيديوهات التدريب قريباً', openPhoto: 'فتح الصورة: {a}',
      more: 'مدربو {s} الآخرون', anyCoach: 'أي مدرب',
      err: 'أضف اسمك ورقم جوالك ليتمكن مدربك من التواصل معك.',
      msg: { hi: 'مرحباً OwnFit، أرغب في حجز جلسة.', name: 'الاسم', mobile: 'الجوال', training: 'التدريب', coach: 'المدرب',
             pkg: 'الباقة', loc: 'الموقع', time: 'الوقت المفضل', pref: 'تفضيل المدرب', notes: 'ملاحظات' },
      copied: 'تم النسخ', copy: 'نسخ الرسالة', selected: 'تم التحديد، اضغط نسخ',
      achievements: 'الإنجازات', highlights: 'الخبرة التدريبية', topTitle: 'أبرز إنجاز', and: ' و',
      place: { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' },
      topCoach_f: 'أفضل مدربة', topSvcCoach_f: 'أفضل مدربة {s}', svcCoach_f: 'مدربة {s}'
    }
  };
  var t = I18N[LANG];
  function fmt(s, o) { return s.replace(/\{(\w)\}/g, function (_, k) { return o[k]; }); }

  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Localised field: uses name_ar etc. on Arabic pages, falls back to English
  function L(obj, field) {
    if (LANG === 'ar' && obj[field + '_ar'] != null && obj[field + '_ar'] !== '') return obj[field + '_ar'];
    return obj[field];
  }
  function svcName(k) { return t.svc[k] || k; }
  function svcPage(k) { return k + SUF + '.html'; }
  function coachById(id) { return D.coaches.filter(function (c) { return c.id === id; })[0]; }
  function svcs(c) { return (c.services || (c.service ? [c.service] : [])).filter(function (k) { return KEYS.indexOf(k) > -1; }); }
  function byFeatured(a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); }
  function coachesFor(k) { return D.coaches.filter(function (c) { return svcs(c).indexOf(k) > -1; }).sort(byFeatured); }
  function svcNames(c) {
    var n = svcs(c).map(svcName);
    return n.length > 1 ? n.slice(0, -1).join(SEP) + t.and + n[n.length - 1] : (n[0] || '');
  }
  // Female wording where the language needs it (Arabic)
  function F(c, key) { return (/^f/i.test(c.gender || '') && t[key + '_f']) ? t[key + '_f'] : t[key]; }
  function has(v) { return Array.isArray(v) ? v.length > 0 : (v != null && String(v).trim() !== ''); }
  function profileUrl(c) { return 'coach' + SUF + '.html#' + c.id; }
  function bookUrl(c) { return HOME + '#book-coach-' + c.id; }

  /* ---------- Common ---------- */
  var yr = $('yr'); if (yr) yr.textContent = new Date().getFullYear();
  document.querySelectorAll('[data-wa-num]').forEach(function (el) {
    el.textContent = '+' + D.whatsapp.replace(/^(\d{3})(\d{2})(\d{3})(\d{4})$/, '$1 $2 $3 $4');
  });
  var menuBtn = $('menu-btn'), nav = $('main-nav');
  if (menuBtn && nav) menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Language switch keeps the current coach / section
  var sw = $('lang-switch');
  function syncSwitch() { if (sw) sw.href = sw.href.split('#')[0] + (location.hash || ''); }
  syncSwitch(); window.addEventListener('hashchange', syncSwitch);

  /* ---------- Coach card ---------- */
  function card(c, opts) {
    opts = opts || {};
    var name = L(c, 'name'), cert = (L(c, 'certifications') || [])[0] || '';
    var ach = (c.achievements || []).filter(function (a) { return a.place === 1; })[0] || (c.achievements || [])[0];
    var meta = [];
    if (cert) meta.push([t.certified, cert]);
    else if (ach) meta.push([t.topTitle, L(ach, 'text') + (ach.year ? ' (' + ach.year + ')' : '')]);
    if (has(L(c, 'experience'))) meta.push([t.experience, L(c, 'experience')]);
    if (has(L(c, 'languages'))) meta.push([t.languages, join(L(c, 'languages'))]);
    return '' +
      '<article class="c-card">' +
        '<a class="c-photo" href="' + profileUrl(c) + '" aria-label="' + esc(fmt(t.viewAria, { n: name })) + '">' +
          '<img src="' + esc(c.photo) + '" alt="' + esc(name) + '" loading="lazy">' +
          (c.featured ? '<span class="c-badge label">' + esc(F(c, 'topCoach')) + '</span>' : '') +
        '</a>' +
        '<div class="c-body">' +
          '<p class="c-svc label">' + svcs(c).map(function (k) { return '<a href="' + svcPage(k) + '">' + esc(svcName(k)) + '</a>'; }).join(' · ') + '</p>' +
          '<h3><a href="' + profileUrl(c) + '">' + esc(name) + '</a></h3>' +
          '<p class="c-head">' + esc(L(c, 'headline')) + '</p>' +
          (meta.length ? '<ul class="c-meta">' + meta.map(function (m) { return '<li><span>' + esc(m[0]) + '</span>' + esc(m[1]) + '</li>'; }).join('') + '</ul>' : '<div class="c-meta"></div>') +
          '<div class="c-actions">' +
            '<a class="btn btn-red" href="' + bookUrl(c) + '">' + esc(t.bookNow) + '</a>' +
            '<a class="btn btn-line" href="' + profileUrl(c) + '">' + esc(t.viewProfile) + '</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }
  var SEP = LANG === 'ar' ? '، ' : ', ';
  function join(a) { return (a || []).join(SEP); }

  var top = $('top-coaches');
  if (top) {
    var feat = D.coaches.filter(function (c) { return c.featured; });
    top.innerHTML = feat.map(function (c) { return card(c); }).join('') || '<p class="empty">' + esc(t.empty) + '</p>';
  }

  document.querySelectorAll('[data-coach-list]').forEach(function (el) {
    var list = coachesFor(el.getAttribute('data-coach-list'));
    el.innerHTML = list.length ? list.map(function (c) { return card(c); }).join('') : '<p class="empty">' + esc(t.empty) + '</p>';
  });

  /* ---------- Coach profile ---------- */
  var profile = $('profile');
  function renderProfile() {
    var c = coachById(location.hash.replace(/^#/, ''));
    var crumbSvc = $('crumb-svc'), crumbName = $('crumb-name');
    if (!c) {
      document.title = t.nfPageTitle;
      crumbSvc.parentNode.hidden = true; crumbName.textContent = t.nfTitle;
      profile.innerHTML = '<div class="empty-state"><h1>' + esc(t.nfTitle) + '</h1><p>' + esc(t.nfText) + '</p><div class="c-actions">' +
        KEYS.map(function (k) { return '<a class="btn btn-line" href="' + svcPage(k) + '">' + esc(svcName(k)) + '</a>'; }).join('') + '</div></div>';
      $('more-coaches-wrap').hidden = true;
      return;
    }
    var s = svcNames(c), first = svcs(c)[0], name = L(c, 'name');
    document.title = fmt(t.pageTitle, { n: name, s: fmt(F(c, 'svcCoach'), { s: s }) });
    crumbSvc.parentNode.hidden = false; crumbSvc.href = svcPage(first); crumbSvc.textContent = svcName(first);
    crumbName.textContent = name;
    function list(a) { return (a || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); }
    var gal = c.gallery || [];
    var gallery = gal.length
      ? '<div class="gallery">' + gal.map(function (g, i) {
          var alt = L(g, 'alt');
          return '<button type="button" class="g-item" data-g="' + i + '" aria-label="' + esc(fmt(t.openPhoto, { a: alt })) + '"><img src="' + esc(g.src) + '" alt="' + esc(alt) + '" loading="lazy"></button>';
        }).join('') + '</div>'
      : '<p class="empty">' + esc(fmt(t.photosSoon, { n: name })) + '</p>';
    var vids = c.videos || [];
    var videos = vids.length
      ? '<div class="videos">' + vids.map(function (v) {
          var title = L(v, 'title');
          var yt = v.type === 'youtube';
          var inner = yt
            ? '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + '" title="' + esc(title) + '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
            : '<video src="' + esc(v.src) + '"' + (v.poster ? ' poster="' + esc(v.poster) + '"' : '') + ' controls playsinline preload="metadata"></video>';
          return '<figure class="v-item' + (yt ? '' : ' v-file') + '"><div class="v-frame">' + inner + '</div><figcaption>' + esc(title) + '</figcaption></figure>';
        }).join('') + '</div>'
      : '<div class="videos"><div class="v-item v-empty"><div class="v-frame"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/></svg><span>' + esc(t.videosSoon) + '</span></div></div></div>';

    var facts = [];
    if (has(L(c, 'experience'))) facts.push([t.experience, L(c, 'experience')]);
    if (has(L(c, 'gender'))) facts.push([t.coach, L(c, 'gender')]);
    if (has(L(c, 'languages'))) facts.push([t.languages, join(L(c, 'languages'))]);
    if (has(L(c, 'areas'))) facts.push([t.covers, join(L(c, 'areas'))]);
    var achs = c.achievements || [];
    var achHtml = achs.length ? '<section class="p-section"><h2>' + esc(t.achievements) + '</h2><ol class="ach">' + achs.map(function (a) {
      var p = a.place || 0;
      return '<li class="ach-' + p + '"><span class="medal" aria-hidden="true">' + (p ? p : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21l2-7.5L2 9h7z"/></svg>') + '</span>' +
        '<span class="ach-text">' + esc(L(a, 'text')) + (p ? '<span class="sr"> (' + esc(t.place[p]) + ')</span>' : '') + '</span>' +
        (a.year ? '<span class="ach-year">' + esc(a.year) + '</span>' : '') + '</li>';
    }).join('') + '</ol></section>' : '';
    var hl = L(c, 'highlights');
    var hlHtml = has(hl) ? '<section class="p-section"><h2>' + esc(t.highlights) + '</h2><ul class="ticklist hl">' + list(hl) + '</ul></section>' : '';
    profile.innerHTML = '' +
      '<div class="profile">' +
        '<div class="p-photo"><img src="' + esc(c.photo) + '" alt="' + esc(name) + '">' +
          (c.featured ? '<span class="c-badge label">' + esc(fmt(F(c, 'topSvcCoach'), { s: s })) + '</span>' : '') + '</div>' +
        '<div class="p-info">' +
          '<a class="label p-svc" href="' + svcPage(first) + '">' + esc(fmt(F(c, 'svcCoach'), { s: s })) + '</a>' +
          '<h1>' + esc(name) + '</h1>' +
          '<p class="p-head">' + esc(L(c, 'headline')) + '</p>' +
          (facts.length ? '<dl class="facts">' + facts.map(function (f) { return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
          (has(L(c, 'certifications')) ? '<div class="p-block"><h2 class="label">' + esc(t.certs) + '</h2><ul class="ticklist">' + list(L(c, 'certifications')) + '</ul></div>' : '') +
          (has(L(c, 'specialties')) ? '<div class="p-block"><h2 class="label">' + esc(t.specs) + '</h2><ul class="tags">' + list(L(c, 'specialties')) + '</ul></div>' : '') +
          '<div class="c-actions"><a class="btn btn-red" href="' + bookUrl(c) + '">' + esc(fmt(t.bookWith, { n: name })) + '</a></div>' +
        '</div>' +
      '</div>' +
      '<section class="p-section"><h2>' + esc(t.about) + '</h2><div class="bio">' + (L(c, 'bio') || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></section>' +
      achHtml + hlHtml +
      (gal.length ? '<section class="p-section"><h2>' + esc(t.photos) + '</h2>' + gallery + '</section>' : '') +
      '<section class="p-section"><h2>' + esc(t.videos) + '</h2>' + videos + '</section>';

    var seen = {}; seen[c.id] = 1;
    var more = [];
    svcs(c).forEach(function (k) { coachesFor(k).forEach(function (o) { if (!seen[o.id]) { seen[o.id] = 1; more.push(o); } }); });
    $('more-coaches-wrap').hidden = !more.length;
    $('more-title').textContent = fmt(t.more, { s: s });
    $('more-coaches').innerHTML = more.map(function (o) { return card(o); }).join('');
    profile.querySelectorAll('[data-g]').forEach(function (b) {
      b.addEventListener('click', function () { openLb(gal, +b.getAttribute('data-g'), b); });
    });
    window.scrollTo(0, 0);
  }
  if (profile) { renderProfile(); window.addEventListener('hashchange', renderProfile); }

  /* Lightbox */
  var lb = $('lightbox'), lbItems = [], lbIdx = 0, lbFrom = null;
  function showLb() {
    var g = lbItems[lbIdx]; $('lb-img').src = g.src; $('lb-img').alt = L(g, 'alt');
    $('lb-cap').textContent = L(g, 'alt') + '  (' + (lbIdx + 1) + ' / ' + lbItems.length + ')';
  }
  function openLb(items, i, from) { lbItems = items; lbIdx = i; lbFrom = from; showLb(); lb.hidden = false; $('lb-close').focus(); }
  function closeLb() { lb.hidden = true; if (lbFrom) lbFrom.focus(); }
  function step(d) { lbIdx = (lbIdx + d + lbItems.length) % lbItems.length; showLb(); }
  if (lb) {
    $('lb-close').addEventListener('click', closeLb);
    $('lb-prev').addEventListener('click', function () { step(-1); });
    $('lb-next').addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') step(RTL ? 1 : -1);
      if (e.key === 'ArrowRight') step(RTL ? -1 : 1);
    });
  }

  /* ---------- Booking (home page) ---------- */
  var full = $('full');
  if (!full) return;
  var coachSel = $('f-coachname'), disc = $('f-disc');
  coachSel.innerHTML = '<option value="">' + esc(t.anyCoach) + '</option>' + D.coaches.map(function (c) {
    return '<option value="' + esc(c.id) + '">' + esc(L(c, 'name')) + ' – ' + esc(svcNames(c)) + '</option>';
  }).join('');
  function matchDisc(c) { if (svcs(c).indexOf(disc.value) < 0 && svcs(c)[0]) disc.value = svcs(c)[0]; }
  coachSel.addEventListener('change', function () { var c = coachById(coachSel.value); if (c) matchDisc(c); });

  function goBook() { $('book').scrollIntoView(); $('f-name').focus({ preventScroll: true }); }
  function applyHash() {
    var h = location.hash, m;
    if ((m = h.match(/^#book-coach-(.+)$/))) {
      var c = coachById(m[1]); if (c) { coachSel.value = c.id; matchDisc(c); }
    } else if ((m = h.match(/^#book-svc-(.+)$/))) {
      if (KEYS.indexOf(m[1]) > -1) disc.value = m[1];
    } else return;
    goBook();
  }
  applyHash(); window.addEventListener('hashchange', applyHash);

  var chips = Array.prototype.slice.call(document.querySelectorAll('#q-chips .chip'));
  chips.forEach(function (c) {
    c.addEventListener('click', function () { chips.forEach(function (o) { o.setAttribute('aria-pressed', o === c ? 'true' : 'false'); }); });
  });
  var quick = $('quick');
  if (quick) quick.addEventListener('submit', function (e) {
    e.preventDefault();
    var p = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })[0];
    if (p) disc.value = p.dataset.v;
    $('f-emirate').selectedIndex = $('q-emirate').selectedIndex;
    goBook();
  });
  document.querySelectorAll('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () { $('f-plan').value = a.dataset.plan; });
  });

  function txt(sel) { return sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : ''; }
  full.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('f-name').value.trim(), phone = $('f-phone').value.trim(), err = $('f-err');
    if (!name || !phone) {
      err.textContent = t.err; err.hidden = false;
      (name ? $('f-phone') : $('f-name')).focus();
      return;
    }
    err.hidden = true;
    var m = t.msg, coach = coachById(coachSel.value);
    var lines = [
      m.hi,
      m.name + ': ' + name,
      m.mobile + ': ' + phone,
      m.training + ': ' + txt(disc),
      m.coach + ': ' + (coach ? L(coach, 'name') + ' (' + coach.id + ')' : t.anyCoach),
      m.pkg + ': ' + txt($('f-plan')),
      m.loc + ': ' + [$('f-area').value.trim(), txt($('f-emirate'))].filter(Boolean).join(SEP),
      m.time + ': ' + txt($('f-time')),
      m.pref + ': ' + txt($('f-coach'))
    ];
    var notes = $('f-notes').value.trim();
    if (notes) lines.push(m.notes + ': ' + notes);
    var text = lines.join('\n');
    $('msg').textContent = text;
    $('wa-link').href = 'https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(text);
    $('done').hidden = false;
    $('done').scrollIntoView({ block: 'nearest' });
  });

  $('copy').addEventListener('click', function () {
    var btn = this, text = $('msg').textContent;
    var ok = function () { btn.textContent = t.copied; setTimeout(function () { btn.textContent = t.copy; }, 1800); };
    var fallback = function () {
      var r = document.createRange(); r.selectNodeContents($('msg'));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      btn.textContent = t.selected;
    };
    try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (x) { fallback(); }
  });
})();
