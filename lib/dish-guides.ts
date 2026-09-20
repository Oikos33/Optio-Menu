// Curated how-to-eat guides and insider knowledge for common dishes worldwide
// Restaurant owners can override these with their own content

export interface DishGuide {
  howToEat: string[]       // Step-by-step eating instructions
  etiquette?: string[]     // Cultural etiquette notes
  insiderTips?: string[]   // Common insider knowledge
  videoSearchQuery?: string // YouTube search query for how-to video
  seasons?: string[]       // When this dish is best
  pairings?: string[]      // What goes well with it
  originCountry?: string
}

export const DISH_GUIDES: Record<string, DishGuide> = {
  // ── JAPANESE ─────────────────────────────────────────────────────────────
  ramen: {
    howToEat: [
      'Eat immediately — noodles absorb broth and go soft within 3 minutes',
      'Use chopsticks to lift noodles and a ceramic spoon for broth',
      'Slurping is not only acceptable — it cools the noodles and enhances flavor',
      'Season to taste with tare (sauce) or spice at the table before eating',
      'Mix the flavored egg yolk into your broth midway for a richer soup',
    ],
    etiquette: [
      'Slurping loudly is a compliment to the chef in Japan',
      'Finishing all the broth is considered a sign of appreciation',
      'Do not let the noodles sit — order only when ready to eat',
    ],
    insiderTips: [
      'Ask for "kaedama" (noodle refill) at many traditional ramen shops when you have broth left',
      'The chashu (pork) is often best right after it comes out — try it first',
      'Garlic press or ginger at the table? Add sparingly — a little goes a long way',
    ],
    seasons: ['winter', 'autumn'],
    pairings: ['Gyoza', 'Karaage', 'Chashu rice'],
    originCountry: 'Japan (Chinese origin)',
    videoSearchQuery: 'how to eat ramen properly',
  },

  sushi: {
    howToEat: [
      'Nigiri is traditionally eaten in one bite — do not cut it in half',
      'Dip the fish side (not the rice) lightly into soy sauce',
      'You may eat nigiri with your fingers — it is traditional and often preferred',
      'Gari (pickled ginger) is a palate cleanser — eat it between different fish',
      'Wasabi is already under the fish at traditional sushiya — no need to mix into soy sauce',
    ],
    etiquette: [
      'Eat each piece in the order the chef presents it if at a counter',
      'At omakase, trust the chef — no substitutions',
      'Do not leave rice grains in your soy sauce dish',
    ],
    insiderTips: [
      'Warmer rice = better sushi. Eat quickly after it is served',
      'Fatty fish (toro, salmon) is best at the start while your palate is fresh',
      'White fish and shellfish are often served first in a traditional progression',
    ],
    pairings: ['Green tea', 'Sake', 'Miso soup'],
    originCountry: 'Japan',
    videoSearchQuery: 'how to eat sushi etiquette',
  },

  sashimi: {
    howToEat: [
      'Dip lightly in soy sauce — do not submerge',
      'A tiny bit of wasabi placed directly on the fish (not dissolved in soy) is traditional',
      'Eat in the order presented: lighter fish first, then oily/fatty cuts',
      'Shiso leaf garnish can be eaten — it cleanses the palate',
    ],
    etiquette: [
      'Using chopsticks is standard; fingers are less common than with sushi',
      'Do not mix wasabi into the soy sauce — it numbs the flavor',
    ],
    insiderTips: [
      'If it smells strongly of fish, it is not fresh — fresh sashimi smells like the ocean',
      'Thicker cuts = higher quality (sign the chef is confident in the fish)',
    ],
    originCountry: 'Japan',
    videoSearchQuery: 'how to eat sashimi properly',
  },

  tempura: {
    howToEat: [
      'Dip lightly in tentsuyu (dipping broth) — do not soak',
      'Add grated daikon or ginger to the broth to taste',
      'Eat immediately — tempura loses its crunch within seconds',
      'Shake off excess oil gently with chopsticks before dipping',
    ],
    insiderTips: [
      'Good tempura batter is almost invisible — light and lacy, not thick',
      'Vegetable tempura often comes before seafood in a traditional course',
      'Salt with matcha salt is a common alternative to dipping sauce — try it',
    ],
    seasons: ['spring', 'summer'],
    originCountry: 'Japan (Portuguese origin)',
    videoSearchQuery: 'how to eat tempura Japanese style',
  },

  tonkatsu: {
    howToEat: [
      'Dip each slice in tonkatsu sauce (thick, sweet-savory sauce)',
      'Add Japanese mustard on the side for extra kick',
      'Shred the cabbage with your chopsticks and eat between bites as a palate cleanser',
      'Pour sauce over cabbage for a simple salad',
    ],
    insiderTips: [
      'Rosu (fatty loin) is juicier; Hire (tenderloin) is leaner — choose based on preference',
      'The best shops use pigs from specific farms — ask your server',
      'Leftover tonkatsu makes excellent katsu-sando (sandwiches) next day',
    ],
    originCountry: 'Japan',
    videoSearchQuery: 'how to eat tonkatsu',
  },

  takoyaki: {
    howToEat: [
      'Be careful — the inside stays extremely hot long after the outside cools',
      'Bite in half first to release steam, or wait 2–3 minutes before eating',
      'Eat with the provided toothpick or skewer',
      'Top with mayo, sauce, bonito flakes, and aonori — all add flavor layers',
    ],
    insiderTips: [
      'The best takoyaki has a crispy outer shell and molten, slightly gooey interior',
      'Fresh is best — eat within 5 minutes of receiving',
    ],
    originCountry: 'Japan (Osaka)',
  },

  shabu_shabu: {
    howToEat: [
      'Swish the thin-sliced meat briefly in the simmering broth — 3 to 5 seconds for wagyu',
      'Dip in ponzu (citrus sauce) or sesame sauce — try both',
      'Cook vegetables longer than the meat',
      'At the end, add noodles or rice to the umami-rich broth — this is called "shime"',
    ],
    etiquette: [
      'Use the communal chopsticks or tongs for the raw meat, personal chopsticks for eating',
      'Do not overcook the wagyu — it loses its fat and flavor quickly',
    ],
    insiderTips: [
      'Marbled wagyu should be barely cooked — pink inside is intentional for top-grade cuts',
      'Ask for the leftover broth as a soup at the end — it is rich with umami',
    ],
    seasons: ['winter', 'autumn'],
    pairings: ['Cold sake', 'Beer'],
    originCountry: 'Japan',
    videoSearchQuery: 'how to eat shabu shabu properly',
  },

  soba: {
    howToEat: [
      'For cold soba: dip briefly (do not submerge) in tsuyu broth',
      'Add wasabi and green onion to the broth to taste',
      'Slurping is encouraged — it aerates the noodles',
      'At the end, pour the soba-yu (hot noodle water) into your remaining broth and drink it',
    ],
    insiderTips: [
      'Good soba should smell slightly nutty — that is the buckwheat',
      '100% buckwheat (juwari soba) has a stronger flavor than blended versions',
      'Eat cold soba in summer, hot kake-soba in winter',
    ],
    seasons: ['summer', 'autumn'],
    originCountry: 'Japan',
    videoSearchQuery: 'how to eat soba noodles',
  },

  udon: {
    howToEat: [
      'Slurp freely — the sound shows appreciation and cools the noodles',
      'For cold udon: dip in tsuyu; for hot: the broth is served with the noodles',
      'Add tempura, kamaboko, or age (fried tofu) as toppings',
    ],
    insiderTips: [
      'Sanuki udon (from Kagawa) is considered the pinnacle — thick, chewy, springy',
      'Top-quality udon should have a bounce when you bite through it',
    ],
    originCountry: 'Japan',
  },

  okonomiyaki: {
    howToEat: [
      'Use the small spatula (kote) provided to cut and eat directly from the iron plate',
      'Layer sauces: okonomiyaki sauce first, then mayo, bonito flakes, aonori',
      'At teppan (grill-it-yourself) restaurants: monitor your own heat and flip carefully',
    ],
    insiderTips: [
      'Osaka style has everything mixed in; Hiroshima style has layers — both are correct',
      'Bonito flakes will wave in the heat — it looks alive, that is normal',
    ],
    originCountry: 'Japan',
  },

  yakitori: {
    howToEat: [
      'Slide meat off the skewer with your teeth — or eat the whole skewer at casual spots',
      'Ask for tare (sweet soy glaze) or shio (salt) — try both styles',
      'Order liver and heart if adventurous — they are specialties at good yakitori shops',
    ],
    insiderTips: [
      'Tsukune (chicken meatball) dipped in raw egg yolk is a classic pairing',
      'The order matters: start with lighter cuts, finish with richer parts like skin',
    ],
    seasons: ['summer'],
    pairings: ['Beer', 'Highball', 'Shochu'],
    originCountry: 'Japan',
  },

  // ── KOREAN ──────────────────────────────────────────────────────────────
  bibimbap: {
    howToEat: [
      'Mix everything vigorously with a spoon before eating — that is the whole point',
      'Add gochujang (red pepper paste) to taste — start small, it is spicy',
      'In a hot stone bowl (dolsot): let the rice crisp on the bottom before mixing',
      'Press the rice against the bowl sides at the end for crispy rice (nurungji)',
    ],
    insiderTips: [
      'The crunchy caramelized rice at the bottom of the hot stone bowl is the best part — wait for it',
      'Mix more gochujang in as you go — the flavor deepens mid-bowl',
    ],
    originCountry: 'Korea',
    videoSearchQuery: 'how to eat bibimbap properly',
  },

  korean_bbq: {
    howToEat: [
      'Staff usually grill the meat for you at first — watch and learn the technique',
      'Wrap meat in ssam (lettuce or perilla leaf) with rice, garlic, and ssamjang paste',
      'Eat the ssam wrap in one or two bites',
      'Grill kimchi at the end on the same plate — it caramelizes beautifully',
    ],
    etiquette: [
      'Pour drinks for others before pouring for yourself — Korean custom',
      'Both hands or right hand holding the glass when receiving a drink shows respect',
    ],
    insiderTips: [
      'Scissors are for cutting meat — use them freely, it is not rude',
      'The best bites combine: meat + garlic + onion + ssamjang all at once',
    ],
    pairings: ['Soju', 'Beer', 'Makgeolli'],
    originCountry: 'Korea',
    videoSearchQuery: 'how to eat Korean BBQ guide',
  },

  // ── CHINESE ─────────────────────────────────────────────────────────────
  dim_sum: {
    howToEat: [
      'Dishes are shared — order for the table, not individually',
      'Pour tea for others before yourself — yum cha etiquette',
      'Tap two fingers on the table to say thank you when someone pours your tea',
      'Soup dumplings (xiaolongbao): bite a tiny hole, let the soup cool, then eat whole',
      'Sticky rice in lotus leaf: unwrap and eat directly from the leaf',
    ],
    etiquette: [
      'Turning the Lazy Susan clockwise is standard',
      'It is polite to serve dishes to elders first',
      'Leave a little food on your plate to show you were well-fed, not starving',
    ],
    insiderTips: [
      'Visit dim sum at peak hours (weekend brunch) for the freshest cart rotation',
      'Char siu bao (BBQ pork bun) is the classic test of a kitchen\'s quality',
    ],
    pairings: ['Pu-erh tea', 'Chrysanthemum tea', 'Jasmine tea'],
    originCountry: 'China (Cantonese)',
    videoSearchQuery: 'dim sum etiquette how to eat',
  },

  xiaolongbao: {
    howToEat: [
      'Place on a soupspoon, nibble a tiny hole at the top',
      'Add a little vinegar + ginger from the provided condiments',
      'Let the hot soup cool for 30 seconds before sipping',
      'Then eat the whole dumpling in one or two bites',
    ],
    insiderTips: [
      'Broken xiaolongbao = all the soup spills — hold carefully from the base',
      '18 folds is the mark of a master wrapper — count yours',
      'The best XLB have thin translucent skin and abundant gelatinous soup',
    ],
    originCountry: 'China (Shanghai)',
    videoSearchQuery: 'how to eat xiaolongbao soup dumplings',
  },

  peking_duck: {
    howToEat: [
      'Spread hoisin sauce on the thin pancake with the brush provided',
      'Add cucumber and spring onion strips',
      'Place duck slices (with skin) on top and roll tightly',
      'Eat in one or two bites — the roll should not be too large',
    ],
    insiderTips: [
      'The crispy skin alone with sugar is a traditional appetizer — do not skip it',
      'Good Peking duck has a mahogany lacquer color and audibly crunchy skin',
      'A whole duck serves 4–6 people typically',
    ],
    originCountry: 'China (Beijing)',
    videoSearchQuery: 'how to eat Peking duck properly',
  },

  // ── ITALIAN ─────────────────────────────────────────────────────────────
  pizza: {
    howToEat: [
      'Neapolitan pizza is traditionally eaten folded (a libretto style) or with fork & knife',
      'No doggy bags in Naples — eat the whole thing, it is made for one',
      'The cornicione (crust edge) is part of the pizza — do not leave it',
    ],
    etiquette: [
      'In Italy, cutting pizza with scissors is acceptable at pizza al taglio shops',
      'Adding extra cheese is not traditional in Naples — trust the chef\'s balance',
    ],
    insiderTips: [
      'A leopard-spotted char on the crust means very high heat — this is a good sign',
      'Wet/floppy center on Neapolitan pizza is intentional and correct',
    ],
    originCountry: 'Italy (Naples)',
  },

  pasta: {
    howToEat: [
      'Twirl pasta on your fork using the plate edge or a spoon — do not cut it',
      'Do not blow on hot pasta — twirl smaller portions that cool faster',
      'Parmesan on fish-based pasta (vongole, frutti di mare) is a faux pas in Italy',
    ],
    insiderTips: [
      'Al dente means firm with a slight resistance at the center — not crunchy, not soft',
      'The pasta water is liquid gold — restaurants use it to emulsify sauces',
      'Carbonara has no cream in Rome — it is eggs, guanciale, Pecorino, black pepper only',
    ],
    originCountry: 'Italy',
  },

  // ── SOUTHEAST ASIAN ──────────────────────────────────────────────────────
  pho: {
    howToEat: [
      'Add herbs, bean sprouts, lime to the broth — customize at the table',
      'Add hoisin and sriracha on the side (dip, do not pour directly in)',
      'Slurping is perfectly fine and common',
      'Eat quickly — the noodles continue cooking in the hot broth',
    ],
    insiderTips: [
      'The side plate of herbs is not a garnish — use all of it',
      'Real pho broth is clear and lightly fragrant, not dark or heavily seasoned',
      'Tendon and tripe versions (pho dac biet) have the most complex flavors',
    ],
    originCountry: 'Vietnam',
    videoSearchQuery: 'how to eat pho properly',
  },

  pad_thai: {
    howToEat: [
      'Season with sugar, fish sauce, dried chili, and lime from the condiment set',
      'Add each condiment a little at a time — find your balance',
      'Bean sprouts add freshness — keep some uncooked on the side for crunch',
    ],
    insiderTips: [
      'Authentic pad Thai uses sen lek (thin rice noodles), not thick noodles',
      'The egg should be slightly crispy at the edges — that is the wok hei',
    ],
    originCountry: 'Thailand',
  },

  // ── INDIAN ────────────────────────────────────────────────────────────────
  curry_indian: {
    howToEat: [
      'Tear naan bread and use it to scoop curry — the bread is your utensil',
      'Mix curry with basmati rice using the back of your spoon',
      'Raita (yogurt) cools the heat — use it as a break between spicy bites',
      'Eating with your right hand is traditional in India',
    ],
    insiderTips: [
      'Dairy (yogurt, lassi, milk) neutralizes chili heat — not water',
      'The best curries have a toasted, not raw, spice aroma',
    ],
    pairings: ['Mango lassi', 'Masala chai', 'Kingfisher beer'],
    originCountry: 'India',
  },

  // ── AMERICAN / WESTERN ────────────────────────────────────────────────────
  burger: {
    howToEat: [
      'Press down slightly to compress before biting — better bite-size distribution',
      'Tilt slightly forward to catch drips — not backward',
      'Start from the back where the bun ratio to fillings is better',
    ],
    insiderTips: [
      'Ask for your patty temperature — medium gives the most flavor for quality beef',
      'The bun-to-patty ratio should be roughly 1:1 by height',
    ],
    originCountry: 'USA',
  },
}

// ── TAG DEFINITIONS ──────────────────────────────────────────────────────────

export const DISH_TAGS: { value: string; label: string; emoji: string; color: string }[] = [
  { value: 'vegan',       label: 'Vegan',         emoji: '🌱', color: 'green' },
  { value: 'vegetarian',  label: 'Vegetarian',     emoji: '🥗', color: 'lime' },
  { value: 'gluten_free', label: 'Gluten-Free',    emoji: '🌾', color: 'yellow' },
  { value: 'nut_free',    label: 'Nut-Free',       emoji: '🥜', color: 'orange' },
  { value: 'dairy_free',  label: 'Dairy-Free',     emoji: '🥛', color: 'blue' },
  { value: 'halal',       label: 'Halal',          emoji: '☪️', color: 'teal' },
  { value: 'kosher',      label: 'Kosher',         emoji: '✡️', color: 'indigo' },
  { value: 'spicy',       label: 'Spicy',          emoji: '🌶️', color: 'red' },
  { value: 'low_carb',    label: 'Low Carb',       emoji: '💪', color: 'purple' },
  { value: 'raw',         label: 'Contains Raw',   emoji: '🐟', color: 'cyan' },
  { value: 'shellfish',   label: 'Shellfish',      emoji: '🦞', color: 'orange' },
  { value: 'signature',   label: "Chef's Signature", emoji: '⭐', color: 'amber' },
  { value: 'popular',     label: 'Most Popular',   emoji: '🔥', color: 'red' },
  { value: 'new',         label: 'New',            emoji: '✨', color: 'teal' },
  { value: 'seasonal',    label: 'Seasonal',       emoji: '🌸', color: 'pink' },
]

export const TAG_COLOR_MAP: Record<string, string> = {
  green:  'bg-green-100 text-green-700',
  lime:   'bg-lime-100 text-lime-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  blue:   'bg-blue-100 text-blue-700',
  teal:   'bg-teal-100 text-teal-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  red:    'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  cyan:   'bg-cyan-100 text-cyan-700',
  amber:  'bg-amber-100 text-amber-700',
  pink:   'bg-pink-100 text-pink-700',
}

/** Find a curated guide by matching dish name keywords */
export function findDishGuide(dishName: string): DishGuide | null {
  const lower = dishName.toLowerCase()
  // Direct match
  if (DISH_GUIDES[lower]) return DISH_GUIDES[lower]
  // Keyword match
  for (const [key, guide] of Object.entries(DISH_GUIDES)) {
    const keywords = key.replace(/_/g, ' ').split(' ')
    if (keywords.some(kw => lower.includes(kw) || kw.includes(lower.split(' ')[0]))) {
      return guide
    }
  }
  return null
}

export const SEASONS = [
  { value: 'spring', label: 'Spring 🌸', emoji: '🌸' },
  { value: 'summer', label: 'Summer ☀️', emoji: '☀️' },
  { value: 'autumn', label: 'Autumn 🍂', emoji: '🍂' },
  { value: 'winter', label: 'Winter ❄️', emoji: '❄️' },
]
