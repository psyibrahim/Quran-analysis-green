import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { SurahData } from '../types';
import { useTheme } from '../context/ThemeContext';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sparkles, 
  GitCompare, 
  Info, 
  Sliders, 
  Check, 
  Filter, 
  Eye, 
  X, 
  ExternalLink, 
  Pin, 
  Compass, 
  ArrowRightLeft,
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen,
  Waves,
  Ruler,
  Type,
  Music,
  Layers
} from 'lucide-react';
import { formatSurahName } from '../utils/arabic';
import { 
  SimilarityCriterionId, 
  SIMILARITY_CRITERIA,
  calculatePhoneticSimilarity,
  calculateVerseEndingsSimilarity,
  calculateDiacriticsSimilarity,
  calculateCadenceSimilarity,
  calculateVocabularySimilarity,
  calculateCompositeSimilarity
} from '../utils/similarityMetrics';

interface D3SimilarityHeatmapProps {
  surahs: SurahData[];
  similarityMatrix: number[][];
  onCompare: (surahA: number, surahB: number) => void;
  onSelectSurah?: (surah: SurahData) => void;
}

export interface CellData {
  i: number; // 0-indexed row (Surah A - 1)
  j: number; // 0-indexed col (Surah B - 1)
  surahA: SurahData;
  surahB: SurahData;
  score: number; // 0.0 to 1.0
  percentage: number; // 0 to 100
}

export const D3SimilarityHeatmap: React.FC<D3SimilarityHeatmapProps> = ({
  surahs,
  similarityMatrix,
  onCompare,
  onSelectSurah
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Active comparison criterion
  const [activeCriterion, setActiveCriterion] = useState<SimilarityCriterionId>('letters');

  // User interactive controls
  const [filterType, setFilterType] = useState<'all' | 'Meccan' | 'Medinan'>('all');
  const [minThreshold, setMinThreshold] = useState<number>(0.0);
  const [hoveredCell, setHoveredCell] = useState<CellData | null>(null);
  const [selectedIntersection, setSelectedIntersection] = useState<CellData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Compute or retrieve matrix for the selected criterion
  const computedMatrix = useMemo(() => {
    if (activeCriterion === 'letters') {
      return similarityMatrix;
    }
    const n = surahs.length;
    const mat: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      mat[i][i] = 100;
      for (let j = i + 1; j < n; j++) {
        const s1 = surahs[i];
        const s2 = surahs[j];
        let val = 0;
        switch (activeCriterion) {
          case 'phonetics':
            val = calculatePhoneticSimilarity(s1, s2).similarity;
            break;
          case 'verse_endings':
            val = calculateVerseEndingsSimilarity(s1, s2).similarity;
            break;
          case 'diacritics':
            val = calculateDiacriticsSimilarity(s1, s2);
            break;
          case 'cadence':
            val = calculateCadenceSimilarity(s1, s2, surahs);
            break;
          case 'vocabulary':
            val = calculateVocabularySimilarity(s1, s2).similarity;
            break;
          case 'composite':
            val = calculateCompositeSimilarity(s1, s2, surahs);
            break;
          default:
            val = similarityMatrix[i]?.[j] ?? 0;
        }
        mat[i][j] = val;
        mat[j][i] = val;
      }
    }
    return mat;
  }, [activeCriterion, surahs, similarityMatrix]);

  // Filtered surah list based on user filter
  const activeSurahs = useMemo(() => {
    if (filterType === 'all') return surahs;
    return surahs.filter(s => filterType === 'Meccan' ? s.isMeccan : !s.isMeccan);
  }, [surahs, filterType]);

  const activeIndices = useMemo(() => {
    return activeSurahs.map(s => s.number - 1);
  }, [activeSurahs]);

  // Matrix Macro Statistical Summary for the currently active criterion
  const matrixSummary = useMemo(() => {
    let maxScore = -1;
    let maxPair: [number, number] = [0, 0];
    let minScore = 2;
    let minPair: [number, number] = [0, 0];
    let sum = 0;
    let count = 0;

    const n = surahs.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const raw = computedMatrix[i]?.[j] ?? 0;
        const s = raw > 1 ? raw / 100 : raw;
        sum += s;
        count++;
        if (s > maxScore) {
          maxScore = s;
          maxPair = [i, j];
        }
        if (s < minScore) {
          minScore = s;
          minPair = [i, j];
        }
      }
    }

    return {
      topPair: { 
        surahA: surahs[maxPair[0]], 
        surahB: surahs[maxPair[1]], 
        score: maxScore,
        percentage: Number((maxScore * 100).toFixed(1))
      },
      minPair: { 
        surahA: surahs[minPair[0]], 
        surahB: surahs[minPair[1]], 
        score: minScore,
        percentage: Number((minScore * 100).toFixed(1))
      },
      averagePct: count > 0 ? ((sum / count) * 100).toFixed(1) : '78.5'
    };
  }, [surahs, computedMatrix]);

  // Scholarly Quranic Emerald sequential scale with distinct gold diagonal
  const getColor = useMemo(() => {
    return (val: number) => {
      const score = val > 1 ? val / 100 : val;
      if (score >= 0.999) {
        return isLight ? '#B8935F' : '#F59E0B'; // Distinct gold for diagonal identity
      }

      if (isLight) {
        // Light mode scale (Noble Quranic Emerald / Sage):
        // 50% (0.50): Soft parchment sage (#EDF6F4)
        // 70% (0.70): Gentle Quranic sage (#62A89C)
        // 85% (0.85): Rich Quranic emerald (#1A5C5C)
        // 95% (0.95): Deep imperial pine (#0A3330)
        if (score <= 0.50) return '#EDF6F4';
        if (score <= 0.70) {
          const t = (score - 0.50) / 0.20;
          return d3.interpolateRgb('#EDF6F4', '#62A89C')(t);
        }
        if (score <= 0.85) {
          const t = (score - 0.70) / 0.15;
          return d3.interpolateRgb('#62A89C', '#1A5C5C')(t);
        }
        if (score <= 0.95) {
          const t = (score - 0.85) / 0.10;
          return d3.interpolateRgb('#1A5C5C', '#0A3330')(t);
        }
        const t = Math.min(1, (score - 0.95) / 0.049);
        return d3.interpolateRgb('#0A3330', '#041C1A')(t);
      } else {
        // Dark mode scale (Nocturnal Pine to Radiant Jade):
        // 50% (0.50): Deep nocturnal pine (#091A18)
        // 70% (0.70): Dark forest green (#16534E)
        // 85% (0.85): Vibrant emerald green (#2FA89D)
        // 95% (0.95): Radiant jade glow (#5EEAD4)
        if (score <= 0.50) return '#091A18';
        if (score <= 0.70) {
          const t = (score - 0.50) / 0.20;
          return d3.interpolateRgb('#091A18', '#16534E')(t);
        }
        if (score <= 0.85) {
          const t = (score - 0.70) / 0.15;
          return d3.interpolateRgb('#16534E', '#2FA89D')(t);
        }
        if (score <= 0.95) {
          const t = (score - 0.85) / 0.10;
          return d3.interpolateRgb('#2FA89D', '#5EEAD4')(t);
        }
        const t = Math.min(1, (score - 0.95) / 0.049);
        return d3.interpolateRgb('#5EEAD4', '#A7F3D0')(t);
      }
    };
  }, [isLight]);

  // Main D3 Rendering & Zoom Setup
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const n = activeIndices.length;
    if (n === 0) return;

    const margin = { top: 32, right: 32, bottom: 32, left: 32 };
    const width = 640;
    const height = 640;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const cellSize = innerWidth / n;

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('width', '100%')
       .attr('height', '100%');

    // Create defs for clipping
    const defs = svg.append('defs');
    defs.append('clipPath')
      .attr('id', 'matrix-clip')
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight);

    // Root Group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Container for zooming cells
    const zoomLayer = g.append('g')
      .attr('class', 'zoom-layer')
      .attr('clip-path', 'url(#matrix-clip)');

    const cellsGroup = zoomLayer.append('g').attr('class', 'cells-group');

    // Hover Crosshairs lines (dashed emerald green)
    const crosshairH = zoomLayer.append('line')
      .attr('class', 'hover-crosshair-h')
      .attr('stroke', isLight ? '#1A5C5C' : '#34d399')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    const crosshairV = zoomLayer.append('line')
      .attr('class', 'hover-crosshair-v')
      .attr('stroke', isLight ? '#1A5C5C' : '#34d399')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    // Pinned Crosshairs (solid radiant emerald green) for clicked intersection
    zoomLayer.append('line')
      .attr('class', 'pinned-crosshair-h')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '5,2')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('filter', 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.8))');

    zoomLayer.append('line')
      .attr('class', 'pinned-crosshair-v')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '5,2')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('filter', 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.8))');

    // Pinned selected cell rect (highlight ring)
    zoomLayer.append('rect')
      .attr('class', 'pinned-cell-rect')
      .attr('fill', 'rgba(16, 185, 129, 0.45)')
      .attr('stroke', '#059669')
      .attr('stroke-width', Math.max(2, cellSize * 0.45))
      .style('opacity', 0)
      .style('pointer-events', 'none');

    // Prepare cell dataset based on active criterion computedMatrix
    const cellData: CellData[] = [];
    for (let rowIdx = 0; rowIdx < n; rowIdx++) {
      const origI = activeIndices[rowIdx];
      const sA = surahs[origI];
      for (let colIdx = 0; colIdx < n; colIdx++) {
        const origJ = activeIndices[colIdx];
        const sB = surahs[origJ];
        const raw = computedMatrix[origI]?.[origJ] ?? 0;
        const score = origI === origJ ? 1.0 : (raw > 1 ? raw / 100 : raw);
        cellData.push({
          i: origI,
          j: origJ,
          surahA: sA,
          surahB: sB,
          score,
          percentage: Number((score * 100).toFixed(1))
        });
      }
    }

    // Render cells using D3
    cellsGroup.selectAll('rect.matrix-cell')
      .data(cellData)
      .enter()
      .append('rect')
      .attr('class', 'matrix-cell')
      .attr('x', (d, idx) => (idx % n) * cellSize)
      .attr('y', (d, idx) => Math.floor(idx / n) * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', d => {
        if (d.score < minThreshold) {
          return isLight ? '#F1ECE0' : '#10211F';
        }
        return getColor(d.score);
      })
      .attr('stroke', isLight ? 'rgba(151, 168, 163, 0.35)' : 'rgba(0,0,0,0.25)')
      .attr('stroke-width', 0.35)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .attr('stroke', isLight ? '#1A5C5C' : '#2FA89D')
          .attr('stroke-width', Math.max(1, cellSize * 0.25));

        const colIdx = activeIndices.indexOf(d.j);
        const rowIdx = activeIndices.indexOf(d.i);

        crosshairH
          .attr('x1', 0)
          .attr('y1', (rowIdx + 0.5) * cellSize)
          .attr('x2', innerWidth)
          .attr('y2', (rowIdx + 0.5) * cellSize)
          .style('opacity', 0.85);

        crosshairV
          .attr('x1', (colIdx + 0.5) * cellSize)
          .attr('y1', 0)
          .attr('x2', (colIdx + 0.5) * cellSize)
          .attr('y2', innerHeight)
          .style('opacity', 0.85);

        setHoveredCell(d);
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
        }
      })
      .on('mousemove', function(event) {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          });
        }
      })
      .on('mouseleave', function() {
        d3.select(this)
          .attr('stroke', isLight ? 'rgba(151, 168, 163, 0.35)' : 'rgba(0,0,0,0.25)')
          .attr('stroke-width', 0.35);

        crosshairH.style('opacity', 0);
        crosshairV.style('opacity', 0);
        setHoveredCell(null);
        setTooltipPos(null);
      })
      .on('click', function(event, d) {
        // Prevent default drag and select the clicked intersection instead of jumping away!
        event.stopPropagation();
        setSelectedIntersection(d);
      });

    // D3 Zoom implementation with Drag and Pinch
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        zoomLayer.attr('transform', event.transform);
        setZoomLevel(event.transform.k);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

  }, [activeIndices, surahs, computedMatrix, minThreshold, isLight, getColor]);

  // Separate effect to update pinned crosshairs and selected cell rect instantly
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const pinnedH = svg.select('.pinned-crosshair-h');
    const pinnedV = svg.select('.pinned-crosshair-v');
    const pinnedRect = svg.select('.pinned-cell-rect');
    if (pinnedH.empty() || pinnedV.empty() || pinnedRect.empty()) return;

    const n = activeIndices.length;
    if (n === 0 || !selectedIntersection) {
      pinnedH.style('opacity', 0);
      pinnedV.style('opacity', 0);
      pinnedRect.style('opacity', 0);
      return;
    }

    const margin = { top: 32, right: 32, bottom: 32, left: 32 };
    const width = 640;
    const height = 640;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const cellSize = innerWidth / n;

    const rowIdx = activeIndices.indexOf(selectedIntersection.i);
    const colIdx = activeIndices.indexOf(selectedIntersection.j);

    if (rowIdx !== -1 && colIdx !== -1) {
      pinnedH
        .attr('x1', 0)
        .attr('y1', (rowIdx + 0.5) * cellSize)
        .attr('x2', innerWidth)
        .attr('y2', (rowIdx + 0.5) * cellSize)
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2.5)
        .style('opacity', 1)
        .raise();

      pinnedV
        .attr('x1', (colIdx + 0.5) * cellSize)
        .attr('y1', 0)
        .attr('x2', (colIdx + 0.5) * cellSize)
        .attr('y2', innerHeight)
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2.5)
        .style('opacity', 1)
        .raise();

      pinnedRect
        .attr('x', colIdx * cellSize)
        .attr('y', rowIdx * cellSize)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('stroke', '#059669')
        .attr('stroke-width', Math.max(2, cellSize * 0.45))
        .attr('fill', 'rgba(16, 185, 129, 0.45)')
        .style('opacity', 1)
        .raise();
    } else {
      pinnedH.style('opacity', 0);
      pinnedV.style('opacity', 0);
      pinnedRect.style('opacity', 0);
    }
  }, [selectedIntersection, activeIndices]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.scaleBy, 1.4);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // Qualitative similarity descriptor
  const getSimilarityDescriptor = (score: number, isSameSurah: boolean) => {
    if (isSameSurah) {
      return {
        label: 'تطابق ذاتي تام (100%)',
        color: 'text-amber-500',
        badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
        desc: 'نقطة على القطر الرئيسي للمصفوفة، تمثل مقارنة السورة مع نفسها.'
      };
    }
    if (score >= 0.96) {
      return {
        label: 'تشابه فائق واستثنائي',
        color: 'text-amber-400',
        badge: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
        desc: 'تقارب متين ونادر في توزيع ونسب تكرار الحروف والصفات الصوتية.'
      };
    }
    if (score >= 0.90) {
      return {
        label: 'تشابه مرتفع جداً',
        color: isLight ? 'text-emerald-700' : 'text-emerald-400',
        badge: isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        desc: 'تجانس إحصائي بارز في الأنماط التوزيعية لكلمات وحروف السورتين.'
      };
    }
    if (score >= 0.80) {
      return {
        label: 'تشابه قوي ومعتدل',
        color: isLight ? 'text-teal-700' : 'text-teal-400',
        badge: isLight ? 'bg-teal-100 text-teal-800 border-teal-300' : 'bg-teal-500/10 text-teal-400 border-teal-500/30',
        desc: 'توافق عام يندرج ضمن التجانس اللغوي المشترك بين سور القرآن.'
      };
    }
    return {
      label: 'تمايز نسبي طبيعي',
      color: 'text-ink-400',
      badge: 'bg-ink-500/10 text-ink-400 border-ink-500/30',
      desc: 'تباين يعكس خصوصية الموضوعات وتنوع الأطوال والمعجم اللفظي.'
    };
  };

  // Active item to display in the inspector (selected/pinned takes priority, else hover)
  // Computes score and percentage dynamically based on the current computedMatrix
  const inspectedItem = useMemo(() => {
    const base = selectedIntersection || hoveredCell;
    if (!base) return null;
    const raw = computedMatrix[base.i]?.[base.j] ?? 0;
    const score = base.i === base.j ? 1.0 : (raw > 1 ? raw / 100 : raw);
    const percentage = base.i === base.j ? 100 : Number((score * 100).toFixed(1));
    return {
      ...base,
      score,
      percentage
    };
  }, [selectedIntersection, hoveredCell, computedMatrix]);

  const isPinned = Boolean(selectedIntersection);
  const currentCriterionDef = SIMILARITY_CRITERIA.find(c => c.id === activeCriterion) || SIMILARITY_CRITERIA[0];

  return (
    <div className={`rounded-2xl border p-4 sm:p-5 transition-all space-y-4 ${
      isLight ? 'bg-white border-ink-200 shadow-sm' : 'sci-bg sci-border'
    }`}>
      
      {/* 1. Criteria Selection Bar */}
      <div className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
        isLight ? 'bg-ink-50 border-ink-200' : 'bg-ink-900/70 border-ink-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
            isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          }`}>
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold font-heading ${isLight ? 'text-ink-900' : 'text-ink-100'}`}>
                معايير المقارنة وأبعاد التشابه القرآني:
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold ${
                isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
              }`}>
                {currentCriterionDef.badge}
              </span>
            </div>
            <p className="text-[11px] text-ink-500 dark:text-ink-400 font-sans mt-0.5">
              {currentCriterionDef.description}
            </p>
          </div>
        </div>

        {/* 6 Dimension Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
          {SIMILARITY_CRITERIA.map(crit => {
            const Icon = crit.icon;
            const isSelected = activeCriterion === crit.id;
            return (
              <button
                key={crit.id}
                onClick={() => {
                  setActiveCriterion(crit.id);
                  if (crit.id === 'verse_endings' || crit.id === 'vocabulary') {
                    setMinThreshold(0.0);
                  }
                }}
                title={`${crit.label} — ${crit.formula}`}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                  isSelected
                    ? (isLight 
                        ? 'bg-[#1A5C5C] text-white font-bold border-[#1A5C5C] shadow-xs' 
                        : 'bg-emerald-500/20 text-emerald-300 font-bold border-emerald-500/50 shadow-xs')
                    : (isLight 
                        ? 'bg-white hover:bg-ink-100 text-ink-700 border-ink-300' 
                        : 'bg-ink-900/80 hover:bg-ink-800 text-ink-300 border-ink-700/80')
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? (isLight ? 'text-white' : 'text-emerald-300') : crit.color.text}`} />
                <span>{crit.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Controls, Filters & D3 Zoom Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-ink-700/50">
        
        {/* Revelation Filter & Threshold */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className={`text-[11px] font-bold ${isLight ? 'text-ink-600' : 'text-emerald-400'}`}>
              تصفية السور:
            </span>
          </div>

          <div className={`flex items-center gap-1 p-0.5 rounded-lg border ${
            isLight ? 'bg-ink-100 border-ink-300' : 'bg-ink-900 border-ink-800'
          }`}>
            {[
              { id: 'all', label: 'الكل (114)' },
              { id: 'Meccan', label: 'مكية (86)' },
              { id: 'Medinan', label: 'مدنية (28)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] transition-all cursor-pointer ${
                  filterType === tab.id
                    ? (isLight ? 'bg-[#1A5C5C] text-white font-bold shadow-2xs' : 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40')
                    : (isLight ? 'text-ink-600 hover:text-ink-900' : 'text-ink-400 hover:text-ink-200')
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 sm:mr-2">
            <span className={`text-[11px] ${isLight ? 'text-ink-600' : 'text-ink-400'}`}>
              عتبة التشابه:
            </span>
            <select
              value={minThreshold}
              onChange={(e) => setMinThreshold(Number(e.target.value))}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono border cursor-pointer ${
                isLight ? 'bg-white border-ink-300 text-ink-800' : 'bg-ink-900 border-ink-700 text-ink-200'
              }`}
            >
              <option value="0.0">إظهار الكل (كافة الدرجات 0-100٪)</option>
              <option value="0.50">تشابه &gt; 50٪</option>
              <option value="0.70">تشابه متوسط فأعلى (&gt; 70٪)</option>
              <option value="0.85">تشابه مرتفع (&gt; 85٪)</option>
              <option value="0.92">تشابه فائق (&gt; 92٪)</option>
            </select>
          </div>
        </div>

        {/* D3 Zoom Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <span className={`text-[10px] font-mono px-2 py-1 rounded border ${
            isLight ? 'bg-ink-100 border-ink-300 text-ink-600' : 'bg-ink-900 border-ink-800 text-ink-400'
          }`}>
            تضخيم: {zoomLevel.toFixed(1)}x
          </span>
          <button
            onClick={handleZoomIn}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight ? 'bg-white hover:bg-ink-100 text-ink-700 border-ink-300' : 'bg-ink-800 hover:bg-ink-700 text-ink-200 border-ink-700'
            }`}
            title="تكبير الخريطة (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isLight ? 'bg-white hover:bg-ink-100 text-ink-700 border-ink-300' : 'bg-ink-800 hover:bg-ink-700 text-ink-200 border-ink-700'
            }`}
            title="تصغير الخريطة (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              isLight ? 'bg-white hover:bg-ink-100 text-ink-700 border-ink-300' : 'bg-ink-800 hover:bg-ink-700 text-ink-200 border-ink-700'
            }`}
            title="إعادة ضبط المقياس والمركز"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة ضبط</span>
          </button>
        </div>

      </div>

      {/* 3. Color Scale Gradient Strip (Calibrated for daylight and night in Quranic Green) */}
      <div className={`p-2.5 rounded-xl border space-y-1.5 transition-colors ${
        isLight ? 'bg-ink-50 border-ink-200' : 'bg-[#0B1716] border-ink-800'
      }`}>
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            مفتاح التدرج اللوني للتشابه (وفق الهوية البصرية بالأخضر القرآني والذهب):
          </span>
          <span className="text-ink-500 dark:text-ink-400">
            {isLight ? 'ميرمية عاجية 50% ← زمردي هادئ 70% ← أخضر قرآني 85% ← زمردي عميق 95% ← ذهبي 100% للقطر' : 'أخضر ليلي 50% ← غابي داكن 70% ← زمردي مشرق 85% ← ياقوتي أخضر 95% ← ذهبي 100% للقطر'}
          </span>
        </div>

        <div 
          className="h-2.5 w-full rounded-md border border-ink-300 dark:border-ink-700/40 shadow-inner"
          style={{
            background: isLight
              ? 'linear-gradient(to left, #EDF6F4 0%, #62A89C 40%, #1A5C5C 70%, #0A3330 90%, #B8935F 100%)'
              : 'linear-gradient(to left, #091A18 0%, #16534E 40%, #2FA89D 70%, #5EEAD4 90%, #F59E0B 100%)'
          }}
        />

        <div className="flex justify-between items-center text-[10px] font-mono text-ink-500 dark:text-ink-400 px-0.5">
          <span>50٪ (ميرمية عاجية)</span>
          <span>70٪ (زمردي هادئ)</span>
          <span>85٪ (أخضر قرآني)</span>
          <span>95٪ (زمردي عميق)</span>
          <span className="text-amber-600 dark:text-amber-500 font-bold">100٪ (القطر الذهبي)</span>
        </div>
      </div>

      {/* Main Grid: Interactive Heatmap Matrix (Left/Center) + Intersection Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Interactive Heatmap Map Container (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center">
          
          <div 
            ref={containerRef} 
            className={`relative w-full aspect-square max-w-[620px] rounded-xl border overflow-hidden select-none transition-colors ${
              isLight ? 'bg-white border-ink-300 shadow-inner' : 'bg-[#0B1716] border-ink-800 shadow-2xl'
            }`}
          >
            <svg 
              ref={svgRef} 
              className="w-full h-full block cursor-grab active:cursor-grabbing"
            />

            {/* Quick Floating Tooltip over hovered cell (without obscuring) */}
            {hoveredCell && tooltipPos && !selectedIntersection && (
              <div 
                className={`absolute pointer-events-none z-30 p-2.5 rounded-xl shadow-xl border backdrop-blur-md transition-all font-sans text-right ${
                  isLight 
                    ? 'bg-ink-900/95 text-white border-emerald-500/60 shadow-ink-900/40' 
                    : 'bg-[#0B1716]/95 text-ink-100 border-emerald-500/50 shadow-black/80'
                }`}
                style={{
                  left: `${Math.max(12, Math.min(360, tooltipPos.x - 90))}px`,
                  top: `${tooltipPos.y < 120 ? tooltipPos.y + 20 : tooltipPos.y - 110}px`,
                  minWidth: '200px'
                }}
              >
                <div className="flex items-center justify-between border-b border-ink-700/80 pb-1 mb-1.5 font-mono text-[11px]">
                  <span className="text-emerald-300 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    تقاطع
                  </span>
                  <span className="text-amber-400 font-bold text-xs">
                    {hoveredCell.percentage}%
                  </span>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-400 text-[10px]">الأولى:</span>
                    <span className="font-bold text-emerald-200 font-heading truncate">
                      {hoveredCell.surahA.number}. {hoveredCell.surahA.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ink-400 text-[10px]">الثانية:</span>
                    <span className="font-bold text-teal-200 font-heading truncate">
                      {hoveredCell.surahB.number}. {hoveredCell.surahB.name}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 pt-1 border-t border-ink-700/60 text-[9px] text-emerald-300 font-mono text-center">
                  انقر لتثبيت وفحص هذا التقاطع بالمؤشر الأخضر
                </div>
              </div>
            )}
          </div>

          {/* Map Footnote & Legend */}
          <div className="w-full max-w-[620px] text-[11px] font-mono text-ink-500 dark:text-ink-400 mt-2.5 space-y-1.5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">خط التقاطع المثبت (أخضر زمردي للتباين العالي)</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>القطر الذهبي (تطابق السورة مع ذاتها 100٪)</span>
              </div>
            </div>
            <div className="text-[10px] text-ink-400">
              عجلة الفأرة للتكبير والتصغير • السحب للتحريك • انقر على أي تقاطع لتثبيته وفحصه في اللوحة المجاورة
            </div>
          </div>

        </div>

        {/* Intersection Inspector Panel (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-3.5">
          
          <div className={`p-4 rounded-xl border transition-all ${
            isLight 
              ? 'bg-ink-50 border-ink-200 text-ink-900 shadow-sm' 
              : 'bg-[#0B1716] border-ink-800 text-ink-100 shadow-md'
          }`}>
            
            {/* Inspector Panel Title */}
            <div className="flex items-center justify-between border-b pb-2.5 mb-3 border-ink-700/50">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${
                  isPinned 
                    ? (isLight ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300')
                    : (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-800 text-emerald-300')
                }`}>
                  {isPinned ? <Pin className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono flex items-center gap-1.5">
                    <span>{isPinned ? 'التقاطع المُثبّت (المؤشر الأخضر)' : (inspectedItem ? 'معاينة التقاطع عند التأشير' : 'فاحص تقاطع السور')}</span>
                    {isPinned && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    )}
                  </h4>
                  <p className="text-[10px] text-ink-400 font-mono">
                    {isPinned ? 'مؤشر التقاطع الأخضر نشط ومثبت' : 'انقر على أي خلية لتثبيت النقطة'}
                  </p>
                </div>
              </div>

              {isPinned && (
                <button
                  onClick={() => setSelectedIntersection(null)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                    isLight 
                      ? 'bg-white hover:bg-ink-200 text-ink-600 border-ink-300' 
                      : 'bg-ink-800 hover:bg-ink-700 text-ink-300 border-ink-700'
                  }`}
                  title="إلغاء التثبيت والعودة للفحص الحر"
                >
                  <X className="w-3 h-3" />
                  <span>إلغاء التثبيت</span>
                </button>
              )}
            </div>

            {inspectedItem ? (
              <div className="space-y-3 font-mono text-xs">
                
                {/* Active Criterion Notice in Inspector */}
                <div className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${
                  isLight ? 'bg-ink-100/80 border-ink-200' : 'bg-ink-900 border-ink-800'
                }`}>
                  <span className="text-ink-400">معيار الحساب النشط:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    {currentCriterionDef.shortLabel}
                  </span>
                </div>

                {/* Similarity Badge & Description */}
                {(() => {
                  const isSame = inspectedItem.surahA.number === inspectedItem.surahB.number;
                  const desc = getSimilarityDescriptor(inspectedItem.score, isSame);
                  return (
                    <div className={`p-3 rounded-lg border space-y-1.5 ${
                      isLight ? 'bg-white border-ink-200 shadow-2xs' : 'bg-[#0B1716] border-ink-800'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${desc.badge}`}>
                          {desc.label}
                        </span>
                        <span className="text-lg font-bold font-mono text-amber-500">
                          {inspectedItem.percentage}%
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-ink-400 font-sans">
                        {desc.desc}
                      </p>
                    </div>
                  );
                })()}

                {/* Two Surahs Compared Side-by-Side */}
                <div className="space-y-2">
                  
                  {/* Surah A */}
                  <div className={`p-2.5 rounded-lg border transition-all ${
                    isLight ? 'bg-white border-ink-200' : 'bg-ink-900/80 border-ink-800'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-ink-400 mb-1">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">السورة الأولى (أفقياً):</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] ${
                        inspectedItem.surahA.isMeccan 
                          ? (isLight ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-amber-950/40 text-amber-300 border-amber-800/40')
                          : (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40')
                      }`}>
                        {inspectedItem.surahA.isMeccan ? 'مكية' : 'مدنية'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="font-heading font-bold text-base flex items-center gap-1.5">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">#{inspectedItem.surahA.number}</span>
                        <span className={isLight ? 'text-ink-900 font-extrabold' : 'text-ink-100'}>
                          {formatSurahName(inspectedItem.surahA.name)}
                        </span>
                      </div>

                      {onSelectSurah && (
                        <button
                          onClick={() => onSelectSurah(inspectedItem.surahA)}
                          className={`p-1 rounded text-[10px] transition-all cursor-pointer ${
                            isLight ? 'hover:bg-ink-100 text-ink-700' : 'hover:bg-ink-800 text-ink-400 hover:text-white'
                          }`}
                          title={`فتح بطاقة التحليل الشامل لـ ${formatSurahName(inspectedItem.surahA.name)}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className={`grid grid-cols-3 gap-1 text-[10px] mt-2 pt-1.5 border-t ${
                      isLight ? 'text-ink-600 border-ink-200' : 'text-ink-400 border-ink-700/30'
                    }`}>
                      <div>الآيات: <strong className={isLight ? 'text-ink-900' : 'text-ink-200'}>{inspectedItem.surahA.totalAyahs ?? 0}</strong></div>
                      <div>الكلمات: <strong className={isLight ? 'text-ink-900' : 'text-ink-200'}>{(inspectedItem.surahA.totalWords ?? 0).toLocaleString('en-US')}</strong></div>
                      <div>الحروف: <strong className={isLight ? 'text-ink-900' : 'text-ink-200'}>{(inspectedItem.surahA.totalChars ?? inspectedItem.surahA.letters?.totalLettersPlain ?? 0).toLocaleString('en-US')}</strong></div>
                    </div>
                  </div>

                  {/* Inter-surah Link Indicator */}
                  <div className="flex items-center justify-center -my-1 relative z-10">
                    <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${
                      isLight ? 'bg-ink-100 border-ink-300 text-ink-700' : 'bg-ink-800 border-ink-700 text-ink-400'
                    }`}>
                      <ArrowRightLeft className="w-3 h-3" />
                    </span>
                  </div>

                  {/* Surah B */}
                  <div className={`p-2.5 rounded-lg border transition-all ${
                    isLight ? 'bg-white border-ink-200' : 'bg-ink-900/80 border-ink-800'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-bold text-teal-600 dark:text-teal-400">السورة الثانية (رأسياً):</span>
                      <span className={`px-1.5 py-0.2 rounded border text-[9px] ${
                        inspectedItem.surahB.isMeccan 
                          ? (isLight ? 'bg-amber-50 text-amber-900 border-amber-200 font-bold' : 'bg-amber-950/40 text-amber-300 border-amber-800/40')
                          : (isLight ? 'bg-emerald-50 text-emerald-900 border-emerald-200 font-bold' : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40')
                      }`}>
                        {inspectedItem.surahB.isMeccan ? 'مكية' : 'مدنية'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="font-heading font-bold text-base flex items-center gap-1.5">
                        <span className="text-xs text-teal-600 dark:text-teal-400 font-mono">#{inspectedItem.surahB.number}</span>
                        <span className={isLight ? 'text-ink-900 font-extrabold' : 'text-ink-100'}>
                          {formatSurahName(inspectedItem.surahB.name)}
                        </span>
                      </div>

                      {onSelectSurah && (
                        <button
                          onClick={() => onSelectSurah(inspectedItem.surahB)}
                          className={`p-1 rounded text-[10px] transition-all cursor-pointer ${
                            isLight ? 'hover:bg-ink-100 text-ink-700' : 'hover:bg-ink-800 text-ink-400 hover:text-white'
                          }`}
                          title={`فتح بطاقة التحليل الشامل لـ ${formatSurahName(inspectedItem.surahB.name)}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className={`grid grid-cols-3 gap-1 text-[10px] mt-2 pt-1.5 border-t ${
                      isLight ? 'text-ink-600 border-ink-200' : 'text-ink-400 border-ink-700/30'
                    }`}>
                      <div>الآيات: <strong className={isLight ? 'text-ink-900' : 'text-ink-200'}>{inspectedItem.surahB.totalAyahs ?? 0}</strong></div>
                      <div>الكلمات: <strong className={isLight ? 'text-ink-900' : 'text-ink-200'}>{(inspectedItem.surahB.totalWords ?? 0).toLocaleString('en-US')}</strong></div>
                      <div>الحروف: <strong className={isLight ? 'text-ink-900' : 'text-ink-200'}>{(inspectedItem.surahB.totalChars ?? inspectedItem.surahB.letters?.totalLettersPlain ?? 0).toLocaleString('en-US')}</strong></div>
                    </div>
                  </div>

                </div>

                {/* Additional Intersection Statistics */}
                <div className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${
                  isLight ? 'bg-white border-ink-200 text-ink-700' : 'bg-[#0B1716] border-ink-800 text-ink-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-ink-600 font-medium' : 'text-ink-400'}>فارق الترتيب المصحفي:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {Math.abs(inspectedItem.surahA.number - inspectedItem.surahB.number) === 0
                        ? 'نفس السورة (القطر)'
                        : Math.abs(inspectedItem.surahA.number - inspectedItem.surahB.number) === 1
                        ? 'سورتان متتاليتان في المصحف'
                        : `${Math.abs(inspectedItem.surahA.number - inspectedItem.surahB.number)} سورة`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-ink-600 font-medium' : 'text-ink-400'}>تناغم فترة النزول:</span>
                    <span className={inspectedItem.surahA.isMeccan === inspectedItem.surahB.isMeccan 
                      ? (isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400') 
                      : (isLight ? 'text-ink-700' : 'text-ink-300')}>
                      {inspectedItem.surahA.isMeccan === inspectedItem.surahB.isMeccan 
                        ? (inspectedItem.surahA.isMeccan ? 'كلتا السورتين مكيتان' : 'كلتا السورتين مدنيتان')
                        : 'سورة مكية وأخرى مدنية'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={isLight ? 'text-ink-600 font-medium' : 'text-ink-400'}>جيب التمام الدقيق (Cosine):</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {inspectedItem.score.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Optional Action Button: Compare Directly in comparator */}
                <button
                  onClick={() => onCompare(inspectedItem.surahA.number, inspectedItem.surahB.number)}
                  className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border shadow-sm ${
                    isLight 
                      ? 'bg-[#1A5C5C] hover:bg-[#134747] text-white border-[#1A5C5C] shadow-emerald-900/20' 
                      : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40 hover:border-emerald-500/60'
                  }`}
                  title="فتح المقارنة المتجهية الكاملة بين السورتين في مختبر المقارنة"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>فتح المقارنة المتجهية بين السورتين</span>
                </button>

              </div>
            ) : (
              <div className="py-5 text-center space-y-3">
                <Compass className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400 opacity-60 animate-pulse" />
                <div className="space-y-1">
                  <p className={`text-xs font-bold ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                    انقر على أي تقاطع لتثبيته وفحصه
                  </p>
                  <p className={`text-[11px] leading-relaxed max-w-[260px] mx-auto ${isLight ? 'text-ink-600 font-medium' : 'text-ink-400'}`}>
                    عند النقر على أي خلية، سيتم تثبيت السورتين وعرض كامل خصائصهما ومقياس التشابه هنا دون مغادرة المصفوفة.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Quick Matrix Statistical Highlights */}
          <div className={`p-3.5 rounded-xl border space-y-2.5 transition-colors text-xs ${
            isLight ? 'bg-ink-50 border-ink-200' : 'bg-[#0B1716] border-ink-800'
          }`}>
            <h5 className="font-bold text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5 font-mono">
              <Award className="w-3.5 h-3.5" />
              أبرز معالم المصفوفة (114 × 114)
            </h5>

            <div className="space-y-2 text-[11px] font-mono">
              <div className={`flex items-center justify-between p-2 rounded-lg border ${
                isLight ? 'bg-white border-ink-200' : 'bg-black/20 border border-ink-800/60'
              }`}>
                <div className="space-y-0.5">
                  <div className={`text-[10px] ${isLight ? 'text-ink-600 font-medium' : 'text-ink-400'}`}>أعلى زوج تشابهاً (خارج القطر):</div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 font-heading text-xs">
                    {matrixSummary.topPair.surahA.name} ↔ {matrixSummary.topPair.surahB.name}
                  </div>
                </div>
                <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">
                  {matrixSummary.topPair.percentage}%
                </span>
              </div>

              <div className={`flex items-center justify-between p-2 rounded-lg border ${
                isLight ? 'bg-white border-ink-200' : 'bg-black/20 border border-ink-800/60'
              }`}>
                <div className="space-y-0.5">
                  <div className={`text-[10px] ${isLight ? 'text-ink-600 font-medium' : 'text-ink-400'}`}>أدنى زوج تشابهاً:</div>
                  <div className={`font-bold font-heading text-xs ${isLight ? 'text-ink-800' : 'text-ink-300'}`}>
                    {matrixSummary.minPair.surahA.name} ↔ {matrixSummary.minPair.surahB.name}
                  </div>
                </div>
                <span className={`font-bold text-xs ${isLight ? 'text-ink-700' : 'text-ink-400'}`}>
                  {matrixSummary.minPair.percentage}%
                </span>
              </div>

              <div className={`flex items-center justify-between text-[11px] pt-1 ${isLight ? 'text-ink-600 font-medium' : 'text-ink-400'}`}>
                <span>متوسط التشابه الإجمالي العام:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{matrixSummary.averagePct}%</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
