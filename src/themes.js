export const THEMES = [
  {
    key: 'night',
    name: '玻璃夜食',
    desc: '透明玻璃 · 薄荷琥珀',
    swatches: ['#05090a', '#7fe3c4', '#ffb45e'],
  },
  {
    key: 'grain',
    name: '胶片颗粒',
    desc: '细颗粒 · 暖黑夜色',
    swatches: ['#080a09', '#d8c9a8', '#ffb45e'],
  },
  {
    key: 'matte',
    name: '雾面磨砂',
    desc: '不透明 · 柔光面板',
    swatches: ['#070c0c', '#9fbfb2', '#e8b27a'],
  },
  {
    key: 'paper',
    name: '米纸地图',
    desc: '浅色纸感 · 墨绿陶土',
    swatches: ['#f3eee4', '#3f6b58', '#b85c2e'],
  },
];

const nightPalette = {
  area: 'rgba(11,31,28,.78)',
  border: 'rgba(147,231,201,.34)',
  fillSoft: 'rgba(127,227,196,.04)',
  fillStrong: 'rgba(127,227,196,.075)',
  highlight: 'rgba(255,180,94,.18)',
  highlightStrong: 'rgba(255,180,94,.24)',
  highlightBorder: '#ffb45e',
  city: '#7fe3c4',
  cityGlow: 'rgba(127,227,196,.9)',
  tooltipBg: 'rgba(8,16,17,.92)',
  tooltipBorder: 'rgba(127,227,196,.25)',
  tooltipText: '#eef8f3',
  label: '#fff7ea',
  shadow: 'rgba(0,0,0,.65)',
};

export const MAP_PALETTES = {
  night: nightPalette,
  grain: {
    ...nightPalette,
    area: 'rgba(20,26,19,.86)',
    border: 'rgba(200,185,145,.36)',
    city: '#d8c9a8',
    cityGlow: 'rgba(216,201,168,.7)',
    label: '#fff5df',
  },
  matte: {
    ...nightPalette,
    area: 'rgba(12,24,22,.94)',
    border: 'rgba(170,210,195,.28)',
    city: '#a9e0cb',
    cityGlow: 'rgba(169,224,203,.55)',
    tooltipBg: 'rgba(6,14,13,.97)',
  },
  paper: {
    area: 'rgba(232,220,198,.94)',
    border: 'rgba(90,70,50,.38)',
    fillSoft: 'rgba(63,107,88,.06)',
    fillStrong: 'rgba(63,107,88,.12)',
    highlight: 'rgba(184,92,46,.22)',
    highlightStrong: 'rgba(184,92,46,.3)',
    highlightBorder: '#b85c2e',
    city: '#3f6b58',
    cityGlow: 'rgba(63,107,88,.55)',
    tooltipBg: 'rgba(250,244,232,.97)',
    tooltipBorder: 'rgba(80,60,40,.22)',
    tooltipText: '#2a2118',
    label: '#2a2118',
    shadow: 'rgba(80,60,40,.25)',
  },
};

export const getTheme = (key) => THEMES.find((theme) => theme.key === key) || THEMES[0];
