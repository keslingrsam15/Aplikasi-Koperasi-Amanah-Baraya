import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'pharmacode';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  className?: string;
  text?: string;
  background?: string;
  lineColor?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 45,
  displayValue = true,
  fontSize = 13,
  margin = 4,
  className = '',
  text,
  background = 'transparent',
  lineColor = '#111827',
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format,
        width,
        height,
        displayValue,
        fontSize,
        font: 'monospace',
        fontOptions: 'bold',
        text: text || value,
        textMargin: 2,
        margin,
        background,
        lineColor,
      });
    } catch (err) {
      console.warn('JsBarcode render error:', err);
    }
  }, [value, format, width, height, displayValue, fontSize, margin, text, background, lineColor]);

  return <svg ref={svgRef} className={`max-w-full inline-block ${className}`} />;
};
