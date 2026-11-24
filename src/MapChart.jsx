import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import { MAP_PALETTES } from './themes';

function featureCenter(feature) {
  const coords = [];
  const walk = (value) => {
    if (typeof value?.[0] === 'number') {
      coords.push(value);
      return;
    }
    if (Array.isArray(value)) value.forEach(walk);
  };
  walk(feature.geometry.coordinates);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [x, y] of coords) {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2];
}

function shortRegion(name = '') {
  return name.replace(/(?:\u58ee\u65cf|\u56de\u65cf|\u7ef4\u543e\u5c14|\u81ea\u6cbb\u533a|\u7279\u522b\u884c\u653f\u533a|\u7701|\u5e02)/g, '');
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((char) => char + char).join('') : value;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function mixColor(from, to, amount) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const t = Math.max(0, Math.min(1, amount));
  const channel = (index) => Math.round(a[index] + (b[index] - a[index]) * t);
  return `rgb(${channel(0)},${channel(1)},${channel(2)})`;
}

export default function MapChart({ records, chinaGeo, province, provinceZoomed, city, onProvince, onCity, isMobile, theme = 'night' }) {
  const palette = MAP_PALETTES[theme] || MAP_PALETTES.night;
  const holder = useRef(null);
  const chartRef = useRef(null);
  const handlers = useRef({ onProvince, onCity });
  handlers.current = { onProvince, onCity };

  const provinceStats = useMemo(() => {
    const map = new Map();
    for (const r of records) {
      if (!r.province) continue;
      map.set(r.province, (map.get(r.province) || 0) + 1);
    }
    return map;
  }, [records]);

  const centers = useMemo(() => {
    const map = new Map();
    for (const feature of chinaGeo.features || []) {
      const name = feature.properties?.name;
      if (name) map.set(name, featureCenter(feature));
    }
    return map;
  }, [chinaGeo, isMobile]);

  const cityPoints = useMemo(() => {
    if (!province || !provinceZoomed) return [];
    const groups = new Map();
    for (const r of records) {
      if (!r.coord || r.province !== province || !r.city) continue;
      const item = groups.get(r.city) || { name: r.city, coord: r.coord, count: 0 };
      item.count += 1;
      groups.set(r.city, item);
    }
    const values = [...groups.values()];
    const maxCount = Math.max(1, ...values.map((item) => item.count));
    return values.map((item) => {
      const heat = maxCount > 1 ? (item.count - 1) / (maxCount - 1) : 0;
      return {
        name: item.name,
        value: [item.coord[0], item.coord[1], item.count],
        count: item.count,
        itemStyle: {
          color: mixColor(palette.city, palette.highlightBorder, 0.1 + heat * 0.9),
        },
      };
    });
  }, [records, province, provinceZoomed, palette]);

  useEffect(() => {
    if (!holder.current) return undefined;
    const chart = echarts.init(holder.current, null, { renderer: 'canvas', devicePixelRatio: Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2) });
    chartRef.current = chart;
    window.__channianChart = chart;
    echarts.registerMap('china', chinaGeo);

    let roamTimer;
    chart.on('georoam', () => {
      document.body.classList.add('map-roaming');
      clearTimeout(roamTimer);
      roamTimer = setTimeout(() => document.body.classList.remove('map-roaming'), 180);
    });

    chart.on('click', (params) => {
      if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
        if (params.name) handlers.current.onCity(params.name);
        return;
      }
      if (params.name) handlers.current.onProvince(params.name);
    });

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(holder.current);

    return () => {
      observer.disconnect();
      clearTimeout(roamTimer);
      document.body.classList.remove('map-roaming');
      chart.dispose();
      chartRef.current = null;
    };
  }, [chinaGeo, isMobile]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const provinceCenter = province && provinceZoomed ? centers.get(province) : null;
    const cityRecord = city ? records.find((r) => r.city === city && r.coord) : null;
    const view = cityRecord
      ? { center: cityRecord.coord, zoom: 13 }
      : provinceCenter
        ? { center: provinceCenter, zoom: 4.1 }
        : { center: [104.2, 35.6], zoom: 1.05 };

    const provinceData = [...provinceStats.entries()].map(([name, count]) => ({
      name,
      value: count,
      itemStyle: { areaColor: count > 1 ? palette.fillStrong : palette.fillSoft },
    }));

    chart.setOption({
      backgroundColor: 'transparent',
      animationDurationUpdate: isMobile ? 280 : 750,
      animationEasingUpdate: 'cubicOut',
      tooltip: {
        show: !isMobile,
        trigger: 'item',
        backgroundColor: palette.tooltipBg,
        borderColor: palette.tooltipBorder,
        textStyle: { color: palette.tooltipText, fontSize: 12 },
        formatter: (params) => {
          if (params.seriesType === 'effectScatter' || params.seriesType === 'scatter') {
            return `<b>${params.name}</b><br/>${params.data?.count || 0} 个念想`;
          }
          const count = provinceStats.get(params.name) || 0;
          return count ? `<b>${params.name}</b><br/>${count} 个念想` : `<b>${params.name}</b><br/>还没有收藏`;
        },
      },
      geo: {
        map: 'china',
        roam: true,
        scaleLimit: { min: 0.7, max: 14 },
        zoom: view.zoom,
        center: view.center,
        layoutCenter: ['50%', '51%'],
        layoutSize: '118%',
        label: {
          show: !province,
          formatter: (params) => shortRegion(params.name),
          color: palette.label,
          fontSize: isMobile ? 8 : 10,
          textBorderColor: 'rgba(0,0,0,.55)',
          textBorderWidth: 2,
        },
        itemStyle: {
          areaColor: palette.area,
          borderColor: palette.border,
          borderWidth: 1.1,
          shadowBlur: isMobile ? 0 : 24,
          shadowColor: palette.shadow,
        },
        regions: province
          ? [{
              name: province,
              itemStyle: {
                areaColor: palette.highlight,
                borderColor: palette.highlightBorder,
                borderWidth: 1.5,
                shadowBlur: isMobile ? 0 : 26,
                shadowColor: palette.highlightBorder,
              },
            }]
          : [],
        emphasis: {
          itemStyle: {
            areaColor: palette.highlight,
            borderColor: palette.highlightBorder,
            borderWidth: 1.4,
            shadowBlur: isMobile ? 0 : 26,
            shadowColor: palette.highlightBorder,
          },
          label: { show: true, color: palette.label, fontSize: 12, fontWeight: 600 },
        },
        select: {
          itemStyle: { areaColor: palette.highlightStrong },
          label: { show: true, color: palette.label },
        },
      },
      series: [
        ...(isMobile ? [] : [{
          type: 'map',
          map: 'china',
          geoIndex: 0,
          selectedMode: false,
          data: provinceData,
          emphasis: { label: { show: true } },
        }]),
        {
          type: 'effectScatter',
          coordinateSystem: 'geo',
          data: cityPoints,
          symbolSize: (value) => 8 + Math.min(22, Math.sqrt(value[2] || 1) * 4.8),
          showEffectOn: 'render',
          rippleEffect: { scale: isMobile ? 2.2 : 2.8, brushType: 'stroke', period: isMobile ? 6 : 4 },
          label: {
            show: true,
            formatter: '{b}',
            position: 'top',
            distance: 5,
            color: palette.label,
            fontSize: isMobile ? 9 : 10,
            textBorderColor: 'rgba(0,0,0,.65)',
            textBorderWidth: 2,
          },
          labelLayout: { hideOverlap: true },
          itemStyle: {
            color: palette.city,
            shadowBlur: isMobile ? 6 : 14,
            shadowColor: palette.cityGlow,
          },
          emphasis: {
            scale: 1.7,
            label: {
              show: true,
              formatter: '{b}',
              position: 'top',
              color: palette.label,
              fontSize: 12,
              backgroundColor: palette.tooltipBg,
              padding: [3, 6],
              borderRadius: 6,
            },
          },
          zlevel: 2,
        },
      ],
    }, { notMerge: false });
  }, [province, provinceZoomed, city, cityPoints, provinceStats, centers, records, isMobile, theme]);

  return <div className="map-canvas" ref={holder} />;
}
