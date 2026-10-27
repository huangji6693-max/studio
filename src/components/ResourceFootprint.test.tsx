import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ResourceFootprint,
  computeResourceFootprintMetrics,
  formatBytes,
} from './ResourceFootprint';

export function runResourceFootprintUnitTests(): void {
  // 1. Optimal footprint below warning thresholds
  const lowMetrics = computeResourceFootprintMetrics('1250000', '524288');
  if (lowMetrics.isCpuHigh || lowMetrics.isMemHigh) {
    throw new Error('Expected low simulation footprint not to trigger warning flags');
  }
  if (lowMetrics.formattedMem !== '512.00 KB') {
    throw new Error(`Unexpected formatted memory: ${lowMetrics.formattedMem}`);
  }

  const optimalHtml = renderToStaticMarkup(
    <ResourceFootprint cpuInsns="1250000" memBytes="524288" minResourceFee="14500" />
  );
  if (!optimalHtml.includes('OPTIMAL') || !optimalHtml.includes('1,250,000')) {
    throw new Error('Optimal ResourceFootprint render missing expected labels');
  }

  // 2. High CPU (> 5,000,000) and High Memory (> 2MB) warning badges
  const highMetrics = computeResourceFootprintMetrics('6500000', String(3 * 1024 * 1024));
  if (!highMetrics.isCpuHigh || !highMetrics.isMemHigh) {
    throw new Error('Expected high simulation footprint to trigger CPU and Memory warning flags');
  }

  const warningHtml = renderToStaticMarkup(
    <ResourceFootprint cpuInsns={6_500_000} memBytes={3 * 1024 * 1024} />
  );
  if (
    !warningHtml.includes('HIGH RESOURCE USAGE') ||
    !warningHtml.includes('WARN &gt; 5M') ||
    !warningHtml.includes('WARN &gt; 2MB')
  ) {
    throw new Error('Warning ResourceFootprint render missing warning badges');
  }

  if (formatBytes(0) !== '0 B') {
    throw new Error('formatBytes(0) should return 0 B');
  }
}
