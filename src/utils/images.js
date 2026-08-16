// Central image helpers.
// We use stable Unsplash photo IDs and render a gradient + emoji fallback
// (see <AppImage/>) if the network is unavailable, so the app never shows
// broken images.

const photo = (id, w = 640) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Well-known, stable food photo IDs grouped by category.
export const FOOD_IMAGES = {
  pizza: [
    'photo-1565299624946-b28f40a0ae38',
    'photo-1513104890138-7c749659a591',
    'photo-1574071318508-1cdbab80d002',
  ],
  burger: [
    'photo-1568901346375-23c9450c58cd',
    'photo-1571091718767-18b5b1457add',
    'photo-1550547660-d9450f859349',
  ],
  biryani: [
    'photo-1585937421612-70a008356fbe',
    'photo-1567188040759-fb8a883dc6d8',
    'photo-1631452180519-c014fe946bc7',
  ],
  chinese: [
    'photo-1525755662778-989d0524087e',
    'photo-1563245372-f21724e3856d',
    'photo-1585032226651-759b368d7246',
  ],
  'south-indian': [
    'photo-1630383249896-424e482df921',
    'photo-1589301760014-d929f3979dbc',
    'photo-1668236543090-82eba5ee5976',
  ],
  'north-indian': [
    'photo-1603894584373-5ac82b2ae398',
    'photo-1626777552726-4a6b54c97e46',
    'photo-1567188040759-fb8a883dc6d8',
  ],
  rolls: [
    'photo-1626700051175-6818013e1d4f',
    'photo-1633945274405-b6c8069047b0',
    'photo-1601050690597-df0568f70950',
  ],
  desserts: [
    'photo-1551024506-0bccd828d307',
    'photo-1563805042-7684c019e1cb',
    'photo-1560008581-09826d1de69e',
  ],
  cakes: [
    'photo-1578985545062-69928b1d9587',
    'photo-1621303837174-89787a7d4729',
    'photo-1565958011703-44f9829ba187',
  ],
  'fast-food': [
    'photo-1518013431117-eb1465fa5752',
    'photo-1573080496219-bb080dd4f877',
    'photo-1551782450-a2132b4ba21d',
  ],
  healthy: [
    'photo-1512621776951-a57141f2eefd',
    'photo-1546069901-ba9599a7e63c',
    'photo-1490645935967-10de6ba17061',
  ],
  beverages: [
    'photo-1544145945-f90425340c7e',
    'photo-1544787219-7f47ccb76574',
    'photo-1572490122747-3968b75cc699',
  ],
  generic: [
    'photo-1504674900247-0877df9cc836',
    'photo-1414235077428-338989a2e8c0',
    'photo-1476224203421-9ac39bcb3327',
  ],
};

// Emoji used for the image fallback per category.
export const FOOD_EMOJI = {
  pizza: '🍕',
  burger: '🍔',
  biryani: '🍛',
  chinese: '🥡',
  'south-indian': '🥞',
  'north-indian': '🍛',
  rolls: '🌯',
  desserts: '🍨',
  cakes: '🎂',
  'fast-food': '🍟',
  healthy: '🥗',
  beverages: '🥤',
  generic: '🍽️',
};

export const COVER_IMAGES = [
  'photo-1517248135467-4c7edcad34c4',
  'photo-1555396273-367ea4eb4db5',
  'photo-1414235077428-338989a2e8c0',
  'photo-1466978913421-dad2ebd01d17',
  'photo-1552566626-52f8b828add9',
  'photo-1424847651672-bf20a4b0982b',
  'photo-1501339847302-ac426a4a7cbb',
  'photo-1559339352-11d035aa65de',
  'photo-1521017432531-fbd92d768814',
  'photo-1550966871-3ed3cdb5ed0c',
];

export const HERO_IMAGES = [
  'photo-1504674900247-0877df9cc836',
  'photo-1565299624946-b28f40a0ae38',
  'photo-1513104890138-7c749659a591',
];

export const categoryEmoji = (categoryId) => FOOD_EMOJI[categoryId] || '🍽️';

export const foodImage = (categoryId, index = 0) =>
  photo((FOOD_IMAGES[categoryId] || FOOD_IMAGES.generic)[index % 3]);

export const coverImage = (index = 0) => photo(COVER_IMAGES[index % COVER_IMAGES.length], 900);

export const heroImage = (index = 0) => photo(HERO_IMAGES[index % HERO_IMAGES.length], 1200);
