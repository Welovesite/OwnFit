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
      copied: 'Copied', copy: 'Copy message', selected: 'Selected, press copy'
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
      copied: 'تم النسخ', copy: 'نسخ الرسالة', selected: 'تم التحديد، اضغط نسخ'
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
  function coachesFor(k) {
    return D.coaches.filter(function (c) { return c.service === k; })
      .sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); });
  }
  function topCoach(k) { var l = coachesFor(k); return l.filter(function (c) { return c.featured; })[0] || l[0]; }
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
    return '' +
      '<article class="c-card">' +
        '<a class="c-photo" href="' + profileUrl(c) + '" aria-label="' + esc(fmt(t.viewAria, { n: name })) + '">' +
          '<img src="' + esc(c.photo) + '" alt="' + esc(name) + '" loading="lazy">' +
          (c.featured ? '<span class="c-badge label">' + esc(t.topCoach) + '</span>' : '') +
        '</a>' +
        '<div class="c-body">' +
          (opts.showService ? '<a class="c-svc label" href="' + svcPage(c.service) + '">' + esc(svcName(c.service)) + '</a>' : '') +
          '<h3><a href="' + profileUrl(c) + '">' + esc(name) + '</a></h3>' +
          '<p class="c-head">' + esc(L(c, 'headline')) + '</p>' +
          '<ul class="c-meta">' +
            (cert ? '<li><span>' + esc(t.certified) + '</span>' + esc(cert) + '</li>' : '') +
            '<li><span>' + esc(t.experience) + '</span>' + esc(L(c, 'experience')) + '</li>' +
            '<li><span>' + esc(t.languages) + '</span>' + esc(join(L(c, 'languages'))) + '</li>' +
          '</ul>' +
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
  if (top) top.innerHTML = KEYS.map(function (k) { var c = topCoach(k); return c ? card(c, { showService: true }) : ''; }).join('');

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
    var s = svcName(c.service), name = L(c, 'name');
    document.title = fmt(t.pageTitle, { n: name, s: fmt(t.svcCoach, { s: s }) });
    crumbSvc.parentNode.hidden = false; crumbSvc.href = svcPage(c.service); crumbSvc.textContent = s;
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
          var inner = v.type === 'youtube'
            ? '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(v.id) + '" title="' + esc(title) + '" loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
            : '<video src="' + esc(v.src) + '" controls preload="metadata"></video>';
          return '<figure class="v-item"><div class="v-frame">' + inner + '</div><figcaption>' + esc(title) + '</figcaption></figure>';
        }).join('') + '</div>'
      : '<div class="videos"><div class="v-item v-empty"><div class="v-frame"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/></svg><span>' + esc(t.videosSoon) + '</span></div></div></div>';

    profile.innerHTML = '' +
      '<div class="profile">' +
        '<div class="p-photo"><img src="' + esc(c.photo) + '" alt="' + esc(name) + '">' +
          (c.featured ? '<span class="c-badge label">' + esc(fmt(t.topSvcCoach, { s: s })) + '</span>' : '') + '</div>' +
        '<div class="p-info">' +
          '<a class="label p-svc" href="' + svcPage(c.service) + '">' + esc(fmt(t.svcCoach, { s: s })) + '</a>' +
          '<h1>' + esc(name) + '</h1>' +
          '<p class="p-head">' + esc(L(c, 'headline')) + '</p>' +
          '<dl class="facts">' +
            '<div><dt>' + esc(t.experience) + '</dt><dd>' + esc(L(c, 'experience')) + '</dd></div>' +
            '<div><dt>' + esc(t.coach) + '</dt><dd>' + esc(L(c, 'gender')) + '</dd></div>' +
            '<div><dt>' + esc(t.languages) + '</dt><dd>' + esc(join(L(c, 'languages'))) + '</dd></div>' +
            '<div><dt>' + esc(t.covers) + '</dt><dd>' + esc(join(L(c, 'areas'))) + '</dd></div>' +
          '</dl>' +
          '<div class="p-block"><h2 class="label">' + esc(t.certs) + '</h2><ul class="ticklist">' + list(L(c, 'certifications')) + '</ul></div>' +
          '<div class="p-block"><h2 class="label">' + esc(t.specs) + '</h2><ul class="tags">' + list(L(c, 'specialties')) + '</ul></div>' +
          '<div class="c-actions"><a class="btn btn-red" href="' + bookUrl(c) + '">' + esc(fmt(t.bookWith, { n: name })) + '</a></div>' +
        '</div>' +
      '</div>' +
      '<section class="p-section"><h2>' + esc(t.about) + '</h2><div class="bio">' + (L(c, 'bio') || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></section>' +
      '<section class="p-section"><h2>' + esc(t.photos) + '</h2>' + gallery + '</section>' +
      '<section class="p-section"><h2>' + esc(t.videos) + '</h2>' + videos + '</section>';

    var more = coachesFor(c.service).filter(function (o) { return o.id !== c.id; });
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
  coachSel.innerHTML = '<option value="">' + esc(t.anyCoach) + '</option>' + KEYS.map(function (k) {
    return '<optgroup label="' + esc(svcName(k)) + '">' + coachesFor(k).map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(L(c, 'name')) + '</option>';
    }).join('') + '</optgroup>';
  }).join('');
  coachSel.addEventListener('change', function () { var c = coachById(coachSel.value); if (c) disc.value = c.service; });

  function goBook() { $('book').scrollIntoView(); $('f-name').focus({ preventScroll: true }); }
  function applyHash() {
    var h = location.hash, m;
    if ((m = h.match(/^#book-coach-(.+)$/))) {
      var c = coachById(m[1]); if (c) { coachSel.value = c.id; disc.value = c.service; }
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
