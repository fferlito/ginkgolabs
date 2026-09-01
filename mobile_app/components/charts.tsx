import type { ReactNode } from "react";
import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { G, Line, Polygon, Polyline, Rect, Text as SvgText } from "react-native-svg";

export function LineChart({
  values,
  labels,
  color,
  unit,
  height = 140,
}: {
  values: number[];
  labels: string[];
  color: string;
  unit: string;
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  if (values.length === 0) return <View style={{ height }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = Math.max(1, width - padL - padR);
  const innerH = height - padT - padB;
  const points = values
    .map((v, i) => {
      const x = padL + (i / Math.max(1, values.length - 1)) * innerW;
      const y = padT + innerH - ((v - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(" ");
  const yTicks = [max, (max + min) / 2, min];
  const xIdx = [0, Math.floor((labels.length - 1) / 2), labels.length - 1];

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {yTicks.map((_, i) => (
            <Line
              key={`g-${i}`}
              x1={padL}
              y1={padT + (i / 2) * innerH}
              x2={width - padR}
              y2={padT + (i / 2) * innerH}
              stroke="rgba(45,95,63,0.35)"
              strokeDasharray="3 3"
            />
          ))}
          <Polyline points={points} fill="none" stroke={color} strokeWidth={2} />
          {yTicks.map((t, i) => (
            <SvgText
              key={`y-${i}`}
              x={0}
              y={padT + (i / 2) * innerH + 3}
              fill="#9CA89F"
              fontSize={10}
            >
              {`${t.toFixed(0)}${unit}`}
            </SvgText>
          ))}
          {xIdx.map((i) => (
            <SvgText
              key={`x-${i}`}
              x={padL + (i / Math.max(1, labels.length - 1)) * innerW}
              y={height - 4}
              fill="#9CA89F"
              fontSize={10}
              textAnchor="middle"
            >
              {labels[i]}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

export function BarChart({
  values,
  labels,
  color,
  height = 180,
}: {
  values: number[];
  labels: string[];
  color: string;
  height?: number;
}) {
  const [width, setWidth] = useState(0);
  const padL = 36;
  const padR = 8;
  const padT = 8;
  const padB = 28;
  if (values.length === 0) return <View style={{ height }} />;

  const max = Math.max(...values, 1);
  const innerW = Math.max(1, width - padL - padR);
  const innerH = height - padT - padB;
  const gap = 2;
  const barW = Math.max(2, innerW / values.length - gap);
  const showEvery = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {[0, 0.5, 1].map((t, i) => (
            <Line
              key={`g-${i}`}
              x1={padL}
              y1={padT + (1 - t) * innerH}
              x2={width - padR}
              y2={padT + (1 - t) * innerH}
              stroke="rgba(45,95,63,0.35)"
              strokeDasharray="3 3"
            />
          ))}
          {values.map((v, i) => {
            const h = (v / max) * innerH;
            const x = padL + i * (barW + gap);
            return (
              <Rect
                key={i}
                x={x}
                y={padT + innerH - h}
                width={barW}
                height={h}
                fill={color}
                rx={2}
              />
            );
          })}
          <SvgText x={0} y={padT + 3} fill="#9CA89F" fontSize={10}>
            {`${max.toFixed(0)}%`}
          </SvgText>
          {labels.map((label, i) =>
            i % showEvery === 0 ? (
              <SvgText
                key={`x-${i}`}
                x={padL + i * (barW + gap) + barW / 2}
                y={height - 4}
                fill="#9CA89F"
                fontSize={8}
                textAnchor="middle"
              >
                {label}
              </SvgText>
            ) : null
          )}
        </Svg>
      ) : null}
    </View>
  );
}

export function HBarChart({
  items,
  color,
}: {
  items: { label: string; value: number }[];
  color: string;
}) {
  const [width, setWidth] = useState(0);
  const rowH = 22;
  const height = Math.max(rowH * items.length + 8, 80);
  const padL = 78;
  const padR = 12;
  const max = Math.max(...items.map((i) => i.value), 1);
  const innerW = Math.max(1, width - padL - padR);

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {items.map((item, i) => {
            const y = 4 + i * rowH;
            const w = (item.value / max) * innerW;
            return (
              <G key={item.label}>
                <SvgText x={0} y={y + 12} fill="#9CA89F" fontSize={10}>
                  {item.label}
                </SvgText>
                <Rect x={padL} y={y + 2} width={w} height={14} fill={color} rx={3} />
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}

export function RadarChart({
  items,
  color,
  size = 240,
}: {
  items: { subject: string; value: number }[];
  color: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 28;
  const n = items.length || 1;
  const point = (i: number, value: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (value / 100) * r;
    return [cx + rr * Math.cos(angle), cy + rr * Math.sin(angle)] as const;
  };
  const ring = (scale: number) =>
    items
      .map((_, i) => {
        const [x, y] = point(i, scale);
        return `${x},${y}`;
      })
      .join(" ");
  const dataPoly = items.map((item, i) => point(i, item.value).join(",")).join(" ");

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {[25, 50, 75, 100].map((scale) => (
          <Polygon
            key={scale}
            points={ring(scale)}
            fill="none"
            stroke="rgba(45,95,63,0.35)"
          />
        ))}
        {items.map((_, i) => {
          const [x, y] = point(i, 100);
          return <Line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(45,95,63,0.35)" />;
        })}
        <Polygon points={dataPoly} fill={color} fillOpacity={0.45} stroke={color} strokeWidth={1.5} />
        {items.map((item, i) => {
          const [x, y] = point(i, 112);
          return (
            <SvgText
              key={item.subject}
              x={x}
              y={y + 4}
              fill="#9CA89F"
              fontSize={11}
              textAnchor="middle"
            >
              {item.subject}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

export function ChartCard({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
}) {
  return (
    <View className="mb-4 rounded-xl border border-[#2D5F3F]/30 bg-[#1B3022]/60 p-3">
      <Text className="mb-1 text-sm font-medium text-[#F5F5F0]">{title}</Text>
      {caption ? <Text className="mb-2 text-xs text-[#9CA89F]">{caption}</Text> : null}
      {children}
    </View>
  );
}
