'use client';

import React, { useState } from 'react';

interface TrendPoint {
  date: string;
  label: string;
  count: number;
  grooms: number;
  brides: number;
}

interface AnalyticsChartsProps {
  totalMembers: number;
  maleCount: number;
  femaleCount: number;
  matchedCount: number;
  activeCount: number;
  inactiveCount: number;
  trend?: TrendPoint[];
}

export function AnalyticsCharts({
  totalMembers,
  maleCount,
  femaleCount,
  matchedCount,
  activeCount,
  inactiveCount,
  trend = [],
}: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState<'trend' | 'demographics'>('trend');
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);

  // SVG Chart Dimensions
  const chartWidth = 540;
  const chartHeight = 200;
  const paddingX = 40;
  const paddingY = 30;

  // Compute values for trend chart
  const points = trend.length > 0 ? trend : [
    { date: '1', label: '13 Oct', count: 0, grooms: 0, brides: 0 },
    { date: '2', label: '14 Oct', count: 1, grooms: 1, brides: 0 },
    { date: '3', label: '15 Oct', count: 1, grooms: 0, brides: 1 },
    { date: '4', label: '16 Oct', count: 2, grooms: 1, brides: 1 },
    { date: '5', label: '17 Oct', count: 1, grooms: 1, brides: 0 },
    { date: '6', label: '18 Oct', count: 1, grooms: 0, brides: 1 },
    { date: '7', label: '19 Oct', count: 1, grooms: 1, brides: 0 },
  ];

  const maxCount = Math.max(...points.map((p) => p.count), 3);
  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  // Generate SVG coordinates
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / Math.max(points.length - 1, 1)) * usableWidth;
    const y = chartHeight - paddingY - (p.count / maxCount) * usableHeight;
    return { x, y, point: p };
  });

  // Build SVG path
  let pathD = '';
  let areaD = '';
  if (coords.length > 0) {
    pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpX1 = prev.x + (curr.x - prev.x) / 2;
      const cpY1 = prev.y;
      const cpX2 = prev.x + (curr.x - prev.x) / 2;
      const cpY2 = curr.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${curr.x} ${curr.y}`;
    }
    areaD = `${pathD} L ${coords[coords.length - 1].x} ${chartHeight - paddingY} L ${coords[0].x} ${chartHeight - paddingY} Z`;
  }

  // Demographics Donut Calculations
  const total = Math.max(totalMembers, 1);
  const groomRatio = (maleCount / total) * 100;
  const brideRatio = (femaleCount / total) * 100;

  // Donut circumference (radius = 54)
  const radius = 54;
  const circumference = 2 * Math.PI * radius; // ~339.29
  const groomOffset = (maleCount / total) * circumference;
  const brideOffset = (femaleCount / total) * circumference;

  return (
    <div className="analytics-section">
      <div className="analytics-grid">
        {/* Chart 1: Registration Intake & Trends */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <div className="analytics-card-badge">Analysis</div>
              <h3 className="analytics-card-title">Registration Activity</h3>
              <p className="analytics-card-sub">Daily prospective candidate intake trends</p>
            </div>

            <div className="analytics-view-toggle">
              <button
                type="button"
                className={`toggle-pill ${activeTab === 'trend' ? 'active' : ''}`}
                onClick={() => setActiveTab('trend')}
              >
                7-Day Trend
              </button>
            </div>
          </div>

          <div className="analytics-chart-container">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="analytics-svg-chart"
              aria-label="Daily registrations line chart"
            >
              <defs>
                <linearGradient id="maroonAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#941B2B" stopOpacity="0.28" />
                  <stop offset="85%" stopColor="#941B2B" stopOpacity="0.02" />
                  <stop offset="100%" stopColor="#941B2B" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              {[0, 1, 2, 3].map((val) => {
                const y = chartHeight - paddingY - (val / 3) * usableHeight;
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#EBE5DC"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 4}
                      fill="#8A8178"
                      fontSize="10"
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              {areaD && (
                <path d={areaD} fill="url(#maroonAreaGradient)" />
              )}

              {/* Curve stroke */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#941B2B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {coords.map((c, i) => {
                const isHovered = hoveredPoint?.date === c.point.date;
                return (
                  <g key={i} className="chart-dot-group">
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={isHovered ? 6 : 4}
                      fill="#FFFFFF"
                      stroke="#941B2B"
                      strokeWidth={isHovered ? 3 : 2}
                      style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                      onMouseEnter={() => setHoveredPoint(c.point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    {/* Date label at bottom */}
                    <text
                      x={c.x}
                      y={chartHeight - 10}
                      fill="#8A8178"
                      fontSize="11"
                      textAnchor="middle"
                      fontWeight={isHovered ? '700' : '500'}
                    >
                      {c.point.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip display */}
            <div className="chart-tooltip-bar">
              {hoveredPoint ? (
                <span>
                  <strong>{hoveredPoint.label}</strong>: {hoveredPoint.count} registration{hoveredPoint.count === 1 ? '' : 's'} ({hoveredPoint.grooms} Groom, {hoveredPoint.brides} Bride)
                </span>
              ) : (
                <span>Hover over data points to inspect daily gender breakdown</span>
              )}
            </div>
          </div>

          <div className="analytics-card-footer">
            <div className="footer-metric-pill">
              <span className="dot dot-maroon" />
              <span>Total Intake: <strong>{totalMembers}</strong> Candidates</span>
            </div>
            <div className="footer-metric-pill">
              <span className="dot dot-gold" />
              <span>Daily Active: <strong>{activeCount}</strong> In Pipeline</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Demographics & Community Ratio */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div>
              <div className="analytics-card-badge">Demographics</div>
              <h3 className="analytics-card-title">Profile Distribution</h3>
              <p className="analytics-card-sub">Gender balance &amp; alliance success ratio</p>
            </div>
          </div>

          <div className="analytics-donut-container">
            <div className="donut-chart-wrapper">
              <svg width="150" height="150" viewBox="0 0 150 150" className="donut-svg">
                {/* Background Ring */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="#F3EFE7"
                  strokeWidth="16"
                />

                {/* Grooms Segment (Maroon) */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="#941B2B"
                  strokeWidth="16"
                  strokeDasharray={`${groomOffset} ${circumference}`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  transform="rotate(-90 75 75)"
                />

                {/* Brides Segment (Gold) */}
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="transparent"
                  stroke="#C9A34A"
                  strokeWidth="16"
                  strokeDasharray={`${brideOffset} ${circumference}`}
                  strokeDashoffset={`-${groomOffset}`}
                  strokeLinecap="round"
                  transform="rotate(-90 75 75)"
                />
              </svg>

              {/* Donut Center Label */}
              <div className="donut-center-content">
                <span className="donut-center-number">{totalMembers}</span>
                <span className="donut-center-label">Profiles</span>
              </div>
            </div>

            {/* Legend & Ratio Breakdown */}
            <div className="donut-legend">
              <div className="legend-row">
                <div className="legend-label">
                  <span className="legend-color-indicator color-maroon" />
                  <span>👨 Grooms</span>
                </div>
                <div className="legend-values">
                  <strong>{maleCount}</strong>
                  <span className="legend-pct">({Math.round(groomRatio)}%)</span>
                </div>
              </div>

              <div className="legend-row">
                <div className="legend-label">
                  <span className="legend-color-indicator color-gold" />
                  <span>👩 Brides</span>
                </div>
                <div className="legend-values">
                  <strong>{femaleCount}</strong>
                  <span className="legend-pct">({Math.round(brideRatio)}%)</span>
                </div>
              </div>

              <div className="status-progress-box">
                <div className="status-progress-header">
                  <span>Alliance Pipeline</span>
                  <strong>{matchedCount} Matched</strong>
                </div>
                <div className="status-progress-track">
                  <div
                    className="status-progress-fill fill-active"
                    style={{ width: `${(activeCount / total) * 100}%` }}
                    title={`Active: ${activeCount}`}
                  />
                  <div
                    className="status-progress-fill fill-matched"
                    style={{ width: `${(matchedCount / total) * 100}%` }}
                    title={`Matched: ${matchedCount}`}
                  />
                  <div
                    className="status-progress-fill fill-inactive"
                    style={{ width: `${(inactiveCount / total) * 100}%` }}
                    title={`Inactive: ${inactiveCount}`}
                  />
                </div>
                <div className="status-progress-labels">
                  <span>🟢 {activeCount} Active</span>
                  <span>💍 {matchedCount} Matched</span>
                  {inactiveCount > 0 && <span>⏸️ {inactiveCount} Inactive</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="analytics-card-footer">
            <span className="footer-subtext">
              ✨ Auspicious matchmaking balance across verified profiles
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
