/*
  OwnFit site data
  ----------------
  Edit this one file to update your WhatsApp number and your coaches.
  Every page (home, service pages and coach profiles) reads from here.

  COACH FIELDS
  id             unique, lowercase, no spaces (used in the profile link: coach.html#id)
  service        one of: personal-training, boxing, kickboxing, muay-thai
  featured       true = shown as the "Top coach" for that service on the home page (one per service)
  name, gender, headline, experience
  photo          main photo, e.g. "assets/coaches/sara-photo.jpg" (portrait, about 800 x 1000 px)
  certifications list of certificates
  languages      list
  areas          emirates / areas the coach covers
  specialties    short list of what they focus on
  bio            list of paragraphs
  gallery        list of extra photos: { src: "assets/coaches/sara-1.jpg", alt: "Sara coaching pad work" }
  videos         list of videos, either:
                   { type: "youtube", id: "YOUTUBE_VIDEO_ID", title: "Combination drill" }
                   { type: "file", src: "assets/videos/sara-intro.mp4", title: "Intro" }
*/
window.OWNFIT = {
  whatsapp: '971500000000', // your WhatsApp number: country code, no + or spaces

  services: {
    'personal-training': { name: 'Personal Training', page: 'personal-training.html' },
    'boxing':            { name: 'Boxing',            page: 'boxing.html' },
    'kickboxing':        { name: 'Kickboxing',        page: 'kickboxing.html' },
    'muay-thai':         { name: 'Muay Thai',         page: 'muay-thai.html' }
  },

  coaches: [
    /* ---------- PERSONAL TRAINING ---------- */
    {
      id: 'pt-coach-1', service: 'personal-training', featured: true,
      name: '[Coach 1 name]', gender: '[Female / Male]',
      headline: '[One line, e.g. Strength and fat-loss coach]',
      experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification 1]', '[Certification 2]'],
      languages: ['English', '[Arabic]'],
      areas: ['Dubai'],
      specialties: ['Strength', 'Fat loss', 'Mobility'],
      bio: ['[Write two or three sentences about the coach: background, coaching style and the kind of clients they love working with.]',
            '[A second paragraph about achievements, competitions or results.]'],
      gallery: [
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' },
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' },
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' }
      ],
      videos: []
    },
    {
      id: 'pt-coach-2', service: 'personal-training', featured: false,
      name: '[Coach 2 name]', gender: '[Female / Male]',
      headline: '[One line about this coach]', experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification]'], languages: ['English'], areas: ['Abu Dhabi'],
      specialties: ['[Specialty]'], bio: ['[About this coach.]'], gallery: [], videos: []
    },
    {
      id: 'pt-coach-3', service: 'personal-training', featured: false,
      name: '[Coach 3 name]', gender: '[Female / Male]',
      headline: '[One line about this coach]', experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification]'], languages: ['English'], areas: ['Sharjah'],
      specialties: ['[Specialty]'], bio: ['[About this coach.]'], gallery: [], videos: []
    },

    /* ---------- BOXING ---------- */
    {
      id: 'boxing-coach-1', service: 'boxing', featured: true,
      name: '[Coach 1 name]', gender: '[Female / Male]',
      headline: '[One line, e.g. Former amateur boxer, technique specialist]',
      experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification 1]', '[Certification 2]'],
      languages: ['English', '[Arabic]'],
      areas: ['Dubai'],
      specialties: ['Technique', 'Footwork', 'Fight fitness'],
      bio: ['[Write two or three sentences about the coach.]', '[Fight record, titles or coaching highlights.]'],
      gallery: [
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' },
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' },
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' }
      ],
      videos: []
    },
    {
      id: 'boxing-coach-2', service: 'boxing', featured: false,
      name: '[Coach 2 name]', gender: '[Female / Male]',
      headline: '[One line about this coach]', experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification]'], languages: ['English'], areas: ['Dubai'],
      specialties: ['[Specialty]'], bio: ['[About this coach.]'], gallery: [], videos: []
    },
    {
      id: 'boxing-coach-3', service: 'boxing', featured: false,
      name: '[Coach 3 name]', gender: '[Female / Male]',
      headline: '[One line about this coach]', experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification]'], languages: ['English'], areas: ['Abu Dhabi'],
      specialties: ['[Specialty]'], bio: ['[About this coach.]'], gallery: [], videos: []
    },

    /* ---------- KICKBOXING ---------- */
    {
      id: 'kickboxing-coach-1', service: 'kickboxing', featured: true,
      name: '[Coach 1 name]', gender: '[Female / Male]',
      headline: '[One line, e.g. Kickboxing coach for beginners to fighters]',
      experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification 1]', '[Certification 2]'],
      languages: ['English', '[Arabic]'],
      areas: ['Dubai'],
      specialties: ['Kicking technique', 'Combinations', 'Conditioning'],
      bio: ['[Write two or three sentences about the coach.]', '[Fight record, belts or coaching highlights.]'],
      gallery: [
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' },
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' },
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' }
      ],
      videos: []
    },
    {
      id: 'kickboxing-coach-2', service: 'kickboxing', featured: false,
      name: '[Coach 2 name]', gender: '[Female / Male]',
      headline: '[One line about this coach]', experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification]'], languages: ['English'], areas: ['Dubai'],
      specialties: ['[Specialty]'], bio: ['[About this coach.]'], gallery: [], videos: []
    },
    {
      id: 'kickboxing-coach-3', service: 'kickboxing', featured: false,
      name: '[Coach 3 name]', gender: '[Female / Male]',
      headline: '[One line about this coach]', experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification]'], languages: ['English'], areas: ['Ajman'],
      specialties: ['[Specialty]'], bio: ['[About this coach.]'], gallery: [], videos: []
    },

    /* ---------- MUAY THAI ---------- */
    {
      id: 'muay-thai-coach-1', service: 'muay-thai', featured: true,
      name: '[Coach 1 name]', gender: '[Female / Male]',
      headline: '[One line, e.g. Muay Thai coach trained in Thailand]',
      experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification 1]', '[Certification 2]'],
      languages: ['English', '[Thai / Arabic]'],
      areas: ['Dubai'],
      specialties: ['Clinch', 'Elbows & knees', 'Thai conditioning'],
      bio: ['[Write two or three sentences about the coach.]', '[Fight record, camps trained at or coaching highlights.]'],
      gallery: [
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' },
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' },
        { src: 'assets/coaches/placeholder-wide.svg', alt: '[Photo description]' }
      ],
      videos: []
    },
    {
      id: 'muay-thai-coach-2', service: 'muay-thai', featured: false,
      name: '[Coach 2 name]', gender: '[Female / Male]',
      headline: '[One line about this coach]', experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification]'], languages: ['English'], areas: ['Dubai'],
      specialties: ['[Specialty]'], bio: ['[About this coach.]'], gallery: [], videos: []
    },
    {
      id: 'muay-thai-coach-3', service: 'muay-thai', featured: false,
      name: '[Coach 3 name]', gender: '[Female / Male]',
      headline: '[One line about this coach]', experience: '[X] years',
      photo: 'assets/coaches/placeholder.svg',
      certifications: ['[Certification]'], languages: ['English'], areas: ['Abu Dhabi'],
      specialties: ['[Specialty]'], bio: ['[About this coach.]'], gallery: [], videos: []
    }
  ]
};
