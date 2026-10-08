/*
  OwnFit site data (English + Arabic)
  -----------------------------------
  Edit this one file to update your WhatsApp number and your coaches.
  Every page in both languages reads from here.

  Each text field has an Arabic twin ending in _ar (name / name_ar, bio / bio_ar ...).
  If an Arabic field is missing, the Arabic pages show the English text.
  Any field you leave out (or leave empty) is simply hidden on the site.

  COACH FIELDS
  id            unique, lowercase, no spaces (profile link: coach.html#id and coach-ar.html#id)
  services      list of: 'personal-training', 'boxing', 'kickboxing', 'muay-thai'
                (the coach appears on every service page listed here)
  featured      true = shown in "Top coaches" on the home page
  name, gender, headline, experience               (+ _ar)
  photo         main photo, e.g. 'assets/coaches/sara.jpg' (portrait, about 900 x 1200 px)
  certifications, languages, areas, specialties     lists (+ _ar)
  bio           list of paragraphs (+ bio_ar)
  highlights    "Coaching experience" bullet points (+ highlights_ar)
  achievements  list of { text, text_ar, year, place }   place: 1, 2, 3 or 0 (no medal)
  gallery       extra photos: { src: 'assets/coaches/sara-1.jpg', alt: '...', alt_ar: '...' }
  videos        { type: 'file', src: 'assets/videos/x.mp4', poster: 'assets/videos/x.jpg', title: '...', title_ar: '...' }
                { type: 'youtube', id: 'YOUTUBE_VIDEO_ID', title: '...', title_ar: '...' }
*/
window.OWNFIT = {
  whatsapp: '971500000000', // your WhatsApp number: country code, no + or spaces

  coaches: [
    /* ================= SALAH EDDINE ================= */
    {
      id: 'salah-eddine',
      services: ['kickboxing', 'muay-thai'],
      featured: true,
      name: 'Salah Eddine', name_ar: 'صلاح الدين',
      gender: 'Male', gender_ar: 'مدرب',
      headline: 'Moroccan champion · Kickboxing & Muay Thai coach',
      headline_ar: 'بطل مغربي · مدرب كيك بوكسينغ ومواي تاي',
      experience: '7+ years', experience_ar: 'أكثر من 7 سنوات',
      photo: 'assets/coaches/salah-eddine.jpg',
      certifications: ['Certified coach in Kickboxing, Muay Thai, Boxing and Fitness'],
      certifications_ar: ['مدرب معتمد في الكيك بوكسينغ والمواي تاي والملاكمة واللياقة البدنية'],
      languages: [], languages_ar: [],
      areas: [], areas_ar: [],
      specialties: ['Kickboxing', 'Muay Thai', 'Boxing', 'Fitness', 'Strength', 'Fighting skills'],
      specialties_ar: ['الكيك بوكسينغ', 'المواي تاي', 'الملاكمة', 'اللياقة البدنية', 'القوة', 'المهارات القتالية'],
      bio: [
        'Salah Eddine is a Moroccan champion and professional Kickboxing and Muay Thai coach, with over 7 years of coaching experience in Morocco and Dubai.',
        'He has helped athletes and clients develop their fitness, technique, strength, discipline and fighting skills. His goal is simple: to help you become stronger, more confident and better every day.',
        '“Train with the best to be the best.”'
      ],
      bio_ar: [
        'صلاح الدين بطل مغربي ومدرب محترف للكيك بوكسينغ والمواي تاي، يمتلك أكثر من 7 سنوات من الخبرة في التدريب بين المغرب ودبي.',
        'ساعد الرياضيين والعملاء على تطوير لياقتهم وتقنيتهم وقوتهم وانضباطهم ومهاراتهم القتالية. هدفه بسيط: أن تصبح أقوى وأكثر ثقة وأفضل كل يوم.',
        '«تدرّب مع الأفضل لتكون الأفضل.»'
      ],
      highlights: [], highlights_ar: [],
      achievements: [
        { text: '5-time Moroccan Champion', text_ar: 'بطل المغرب 5 مرات', place: 1 },
        { text: '5-time African Champion', text_ar: 'بطل أفريقيا 5 مرات', place: 1 },
        { text: '2-time World Runner-Up', text_ar: 'وصيف بطل العالم مرتين', place: 2 }
      ],
      gallery: [],
      videos: [
        { type: 'file', src: 'assets/videos/salah-eddine-training.mp4', poster: 'assets/videos/salah-eddine-training.jpg',
          title: 'Pad work session: punches and kicks', title_ar: 'جلسة تدريب على الوسادات: لكمات وركلات' }
      ]
    },

    /* ================= FATIMA EL FTAM ================= */
    {
      id: 'fatima-el-ftam',
      services: ['kickboxing', 'muay-thai'],
      featured: true,
      name: 'Fatima El Ftam', name_ar: 'فاطمة الفتام',
      gender: 'Female', gender_ar: 'مدربة',
      headline: 'Kickboxing & Muay Thai fighter · Boxing & Kickboxing coach',
      headline_ar: 'مقاتلة كيك بوكسينغ ومواي تاي · مدربة ملاكمة وكيك بوكسينغ',
      experience: '', experience_ar: '',
      photo: 'assets/coaches/fatima-el-ftam.jpg',
      certifications: [
        'Muay Thai Training Diploma – Professional Muay Thai Training Certificate (Thailand)',
        'Level 3 Personal Training Diploma – NASM (International), Dubai'
      ],
      certifications_ar: [
        'دبلوم تدريب المواي تاي – شهادة تدريب مواي تاي احترافية (تايلاند)',
        'دبلوم التدريب الشخصي المستوى 3 – NASM (دولي)، دبي'
      ],
      languages: [], languages_ar: [],
      areas: [], areas_ar: [],
      specialties: ['Technique & footwork', 'Conditioning', 'Sparring', 'Fight preparation'],
      specialties_ar: ['التقنية وحركة القدمين', 'اللياقة البدنية', 'السبارينغ', 'التحضير للنزالات'],
      bio: [
        'Fatima is a Moroccan Kickboxing and Muay Thai fighter based in the UAE, winning medals at national and international level.',
        'As a coach she trains clients one-to-one and in groups, building technique, footwork, defence and conditioning, and prepares athletes for competition.',
        'Her motto: No limits. Dream, train, achieve.'
      ],
      bio_ar: [
        'فاطمة مقاتلة مغربية في الكيك بوكسينغ والمواي تاي مقيمة في الإمارات، حققت ميداليات على المستويين الوطني والدولي.',
        'كمدربة، تدرّب العملاء بشكل فردي وفي مجموعات لبناء التقنية وحركة القدمين والدفاع واللياقة، وتجهّز الرياضيين للمنافسات.',
        'شعارها: بلا حدود. احلم، تدرّب، حقّق.'
      ],
      highlights: [
        'One-to-one and group sessions focused on boxing technique, footwork, defensive movement, combinations and attacking strategy.',
        'Personalised coaching to improve technical skills, performance and overall fighting ability.',
        'Conditioning programmes for strength, endurance, agility, speed and sport-specific fitness.',
        'Competition preparation through structured training, sparring, fight strategy, weight management and mental preparation.',
        'A safe, professional training environment with proper technique, equipment use and safety protocols.',
        'Boxing and kickboxing programmes tailored to each athlete’s goals and fitness level.'
      ],
      highlights_ar: [
        'جلسات فردية وجماعية تركّز على تقنيات الملاكمة وحركة القدمين والحركات الدفاعية والتركيبات واستراتيجيات الهجوم.',
        'تدريب مخصّص لتحسين المهارات التقنية والأداء والقدرة القتالية بشكل عام.',
        'برامج لياقة لتطوير القوة والتحمل والرشاقة والسرعة واللياقة الخاصة بالرياضة.',
        'تحضير الرياضيين للمنافسات من خلال تدريب منظم والسبارينغ واستراتيجية النزال وإدارة الوزن والتحضير الذهني.',
        'بيئة تدريب آمنة واحترافية مع الحفاظ على التقنية الصحيحة والاستخدام السليم للمعدات وبروتوكولات السلامة.',
        'برامج ملاكمة وكيك بوكسينغ مصممة حسب أهداف كل رياضي ومستوى لياقته.'
      ],
      achievements: [
        { text: 'Professional Muay Thai Fighter – Thailand', text_ar: 'مقاتلة مواي تاي محترفة – تايلاند', year: 2026, place: 1 },
        { text: 'UAE Kickboxing Championship – Kick Light & Point Fight, Abu Dhabi', text_ar: 'بطولة الإمارات للكيك بوكسينغ – كيك لايت وبوينت فايت، أبوظبي', year: 2026, place: 1 },
        { text: 'UAE Muay Thai Championship, Abu Dhabi', text_ar: 'بطولة الإمارات للمواي تاي، أبوظبي', year: 2025, place: 3 },
        { text: 'World Cup Uzbekistan – represented the UAE', text_ar: 'كأس العالم في أوزبكستان – ممثلة للإمارات', year: 2025, place: 3 },
        { text: 'UAE Kickboxing Championship, Abu Dhabi', text_ar: 'بطولة الإمارات للكيك بوكسينغ، أبوظبي', year: 2024, place: 1 },
        { text: 'UAE Boxing Beach Tournament, Fujairah', text_ar: 'بطولة الإمارات للملاكمة الشاطئية، الفجيرة', year: 2024, place: 1 },
        { text: 'UAE Muay Thai Open Championship, Dubai', text_ar: 'بطولة الإمارات المفتوحة للمواي تاي، دبي', year: 2024, place: 2 },
        { text: 'UAE Muay Thai Open Championship U23, Abu Dhabi', text_ar: 'بطولة الإمارات المفتوحة للمواي تاي تحت 23 سنة، أبوظبي', year: 2023, place: 2 }
      ],
      gallery: [],
      videos: []
    },

    /* ================= MEHDI FICHKOU ================= */
    {
      id: 'mehdi-fichkou',
      services: ['boxing', 'kickboxing', 'muay-thai'],
      featured: true,
      name: 'Mehdi Fichkou', name_ar: 'مهدي فشكو',
      gender: 'Male', gender_ar: 'مدرب',
      headline: 'Boxing, Kickboxing & Muay Thai coach · 4-time UAE Muay Thai Champion',
      headline_ar: 'مدرب ملاكمة وكيك بوكسينغ ومواي تاي · بطل الإمارات في المواي تاي 4 مرات',
      experience: '', experience_ar: '',
      photo: 'assets/coaches/mehdi-fichkou.jpg',
      certifications: [], certifications_ar: [],
      languages: [], languages_ar: [],
      areas: [], areas_ar: [],
      specialties: ['Boxing', 'Kickboxing', 'Muay Thai', 'Conditioning', 'Fight preparation'],
      specialties_ar: ['الملاكمة', 'الكيك بوكسينغ', 'المواي تاي', 'اللياقة البدنية', 'التحضير للنزالات'],
      bio: [
        'Mehdi is a professional Muay Thai fighter and boxer, a four-time UAE Muay Thai Champion (2021–2024), and a former Moroccan Kickboxing and African Muay Thai champion.',
        'He coaches boxing, kickboxing and Muay Thai one-to-one and in groups, with programmes built around each athlete’s goals, experience and fitness level, from first lessons to fight preparation.'
      ],
      bio_ar: [
        'مهدي مقاتل مواي تاي وملاكم محترف، بطل الإمارات في المواي تاي أربع مرات (2021–2024)، وبطل سابق للمغرب في الكيك بوكسينغ ولأفريقيا في المواي تاي.',
        'يدرّب الملاكمة والكيك بوكسينغ والمواي تاي بشكل فردي وفي مجموعات، ببرامج مصممة حسب أهداف كل رياضي وخبرته ومستوى لياقته، من الدروس الأولى حتى التحضير للنزالات.'
      ],
      highlights: [
        'One-to-one and group sessions in boxing, kickboxing and Muay Thai: technique, footwork, defensive movement, combinations and attacking strategy.',
        'Personalised coaching to improve technical skills, performance, conditioning and overall fighting ability.',
        'Conditioning programmes for strength, endurance, agility, speed, power and sport-specific fitness.',
        'Competition preparation through structured training, sparring, fight strategy, weight management and mental preparation.',
        'A safe, professional training environment with proper technique, equipment use and safety protocols.',
        'Boxing, kickboxing and Muay Thai programmes tailored to each athlete’s goals, experience and fitness level.'
      ],
      highlights_ar: [
        'جلسات فردية وجماعية في الملاكمة والكيك بوكسينغ والمواي تاي: التقنية وحركة القدمين والحركات الدفاعية والتركيبات واستراتيجيات الهجوم.',
        'تدريب مخصّص لتحسين المهارات التقنية والأداء واللياقة والقدرة القتالية بشكل عام.',
        'برامج لياقة لتطوير القوة والتحمل والرشاقة والسرعة والقوة الانفجارية واللياقة الخاصة بالرياضة.',
        'تحضير الرياضيين للمنافسات من خلال تدريب منظم والسبارينغ واستراتيجية النزال وإدارة الوزن والتحضير الذهني.',
        'بيئة تدريب آمنة واحترافية مع الحفاظ على التقنية الصحيحة والاستخدام السليم للمعدات وبروتوكولات السلامة.',
        'برامج ملاكمة وكيك بوكسينغ ومواي تاي مصممة حسب أهداف كل رياضي وخبرته ومستوى لياقته.'
      ],
      achievements: [
        { text: 'UAE Muay Thai Champion', text_ar: 'بطل الإمارات في المواي تاي', year: 2024, place: 1 },
        { text: 'UAE Muay Thai Champion', text_ar: 'بطل الإمارات في المواي تاي', year: 2023, place: 1 },
        { text: 'UAE Muay Thai Champion', text_ar: 'بطل الإمارات في المواي تاي', year: 2022, place: 1 },
        { text: 'UAE Muay Thai Champion', text_ar: 'بطل الإمارات في المواي تاي', year: 2021, place: 1 },
        { text: 'African Muay Thai Champion', text_ar: 'بطل أفريقيا في المواي تاي', year: 2018, place: 1 },
        { text: 'Morocco Kickboxing Champion', text_ar: 'بطل المغرب في الكيك بوكسينغ', year: 2017, place: 1 },
        { text: 'UAE Muay Thai Championship – 2nd place', text_ar: 'بطولة الإمارات للمواي تاي – المركز الثاني', year: 2026, place: 2 },
        { text: 'UAE Muay Thai Championship – 2nd place', text_ar: 'بطولة الإمارات للمواي تاي – المركز الثاني', year: 2025, place: 2 },
        { text: 'UAE Kickboxing Championship – 2nd place', text_ar: 'بطولة الإمارات للكيك بوكسينغ – المركز الثاني', place: 2 },
        { text: '5 professional boxing fights – 3 in Dubai, 2 in Abu Dhabi', text_ar: '5 نزالات ملاكمة احترافية – 3 في دبي و2 في أبوظبي', place: 0 },
        { text: 'Professional Muay Thai fighter', text_ar: 'مقاتل مواي تاي محترف', place: 0 }
      ],
      gallery: [],
      videos: []
    }
  ]
};
