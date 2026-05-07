import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { parliament } from '../lib/d3-parliament';

export interface ParliamentData {
  id: string;
  name: string;
  seats: number;
  color: string;
}

interface ParliamentChartProps {
  data: ParliamentData[];
  width?: number;
  height?: number;
  innerRadiusCoef?: number;
}

export const ParliamentChart: React.FC<ParliamentChartProps> = ({
  data,
  width = 500,
  height = 250,
  innerRadiusCoef = 0.4
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const parliamentChart = parliament();
    parliamentChart.width(width).innerRadiusCoef(innerRadiusCoef);
    parliamentChart.enter.fromCenter(true).smallToBig(true);
    parliamentChart.update.animate(true);

    svg.datum(data).call(parliamentChart as any);

    // Apply colors using the id
    data.forEach(party => {
      svg.selectAll(`.seat.${party.id}`)
        .style('fill', party.color);
    });

  }, [data, width, height, innerRadiusCoef]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      className="mx-auto"
    />
  );
};
