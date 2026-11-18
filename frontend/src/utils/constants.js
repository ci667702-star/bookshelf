export const STATUS = {
  WANT_TO_READ: { label: '읽고 싶은 책', short: '읽고 싶어요', tone: 'bg-sky text-ink' },
  READING: { label: '읽는 중', short: '읽는 중', tone: 'bg-butter text-ink' },
  FINISHED: { label: '완독', short: '완독', tone: 'bg-matcha text-matcha-deep' },
  STOPPED: { label: '중단', short: '중단', tone: 'bg-kraft text-ink-soft' },
};
export const STATUS_KEYS = Object.keys(STATUS);

/** 책장 테마 */
export const THEMES = {
  strawberry: {
    label: '딸기 우유',
    bg: '#FBE4E4',
    wall: '#FBE4E4',
    plank: '#E8B9B6',
    plankEdge: '#D9A09C',
    accent: '#C97B7B',
    pattern: 'dots',
  },
  cream: {
    label: '크림 베이지',
    bg: '#FFF9F2',
    wall: '#FFF9F2',
    plank: '#E3D2BD',
    plankEdge: '#CDB79D',
    accent: '#A47762',
    pattern: 'none',
  },
  vintage: {
    label: '빈티지 서점',
    bg: '#EFE2D0',
    wall: '#EFE2D0',
    plank: '#9C6B52',
    plankEdge: '#7E523D',
    accent: '#7E523D',
    pattern: 'stripes',
  },
  sky: {
    label: '하늘색 구름',
    bg: '#E3EEF7',
    wall: '#E3EEF7',
    plank: '#BCD3E6',
    plankEdge: '#9DBBD4',
    accent: '#6F93B3',
    pattern: 'clouds',
  },
  forest: {
    label: '숲속 도서관',
    bg: '#E4EDDF',
    wall: '#E4EDDF',
    plank: '#A3896B',
    plankEdge: '#86704F',
    accent: '#5F7A55',
    pattern: 'leaves',
  },
  lavender: {
    label: '라벤더',
    bg: '#EEE7F6',
    wall: '#EEE7F6',
    plank: '#CDBDE3',
    plankEdge: '#B4A0D2',
    accent: '#8A72B0',
    pattern: 'dots',
  },
};
export const THEME_KEYS = Object.keys(THEMES);

export const SHELF_STYLES = {
  wood: { label: '원목 선반' },
  white: { label: '화이트 선반' },
  pastel: { label: '테마색 선반' },
  scallop: { label: '레이스 선반' },
};

export const ARRANGEMENTS = {
  spine: { label: '책등 꽂기', hint: '진짜 책장처럼 책등이 보이게 촘촘히' },
  cover: { label: '표지 진열', hint: '표지가 잘 보이게 세워요' },
  polaroid: { label: '폴라로이드', hint: '사진처럼 비스듬히' },
};

export const STICKER_LABELS = {
  flower: '꽃',
  ribbon: '리본',
  star: '별',
  heart: '하트',
  cat: '고양이',
  book: '책',
  coffee: '커피',
  cloud: '구름',
};
export const ITEM_LABELS = {
  plant: '화분',
  lamp: '스탠드',
  frame: '액자',
  candle: '캔들',
  garland: '가랜드',
};

export const PAGE_TO_CM = 0.01;
