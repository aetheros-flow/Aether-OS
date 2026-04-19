import React, { useState } from "react"
import {
  Bar,
  CartesianGrid,
  Label,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { cn as cx } from "../../../../lib/utils"

// ─── Tooltip ────────────────────────────────────────────────────────────────

interface ChartTooltipProps {
  active?: boolean
  payload?: readonly any[]
  label?: string | number
  valueFormatter: (value: number) => string
}

const ChartTooltip = ({ active, payload, label, valueFormatter }: ChartTooltipProps) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white text-sm shadow-lg dark:border-gray-800 dark:bg-gray-950">
      <div className="border-b border-inherit px-4 py-2">
        <p className="font-semibold text-gray-900 dark:text-gray-50">{String(label)}</p>
      </div>
      <div className="space-y-1 px-4 py-2">
        {payload.map(({ value, name }: { value: number; name: string }, index: number) => (
          <div key={index} className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <span
                className={cx(
                  "size-2 shrink-0 rounded-sm",
                  value >= 0 ? "bg-emerald-500" : "bg-rose-500",
                )}
              />
              <p className="whitespace-nowrap text-gray-700 dark:text-gray-300">{name}</p>
            </div>
            <p className="whitespace-nowrap font-semibold tabular-nums text-gray-900 dark:text-gray-50">
              {valueFormatter(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Bar shape — green for positive, red for negative ───────────────────────

const CustomBar = (props: any) => {
  let { x, y, width, height, value } = props
  if (height < 0) {
    y += height
    height = Math.abs(height)
  }
  const fill = value >= 0 ? "#10b981" : "#f43f5e"
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} />
}

// ─── BarChart ────────────────────────────────────────────────────────────────

interface BarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, any>[]
  index: string
  categories: string[]
  valueFormatter?: (value: number) => string
  showXAxis?: boolean
  showYAxis?: boolean
  showGridLines?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  yAxisWidth?: number
  xAxisLabel?: string
  yAxisLabel?: string
  autoMinValue?: boolean
  minValue?: number
  maxValue?: number
  allowDecimals?: boolean
}

export const BarChart = React.forwardRef<HTMLDivElement, BarChartProps>(
  (
    {
      data = [],
      categories = [],
      index,
      valueFormatter = (v) => v.toString(),
      showXAxis = true,
      showYAxis = true,
      showGridLines = true,
      showLegend = true,
      showTooltip = true,
      yAxisWidth = 56,
      xAxisLabel,
      yAxisLabel,
      autoMinValue = false,
      minValue,
      maxValue,
      allowDecimals = true,
      className,
      ...other
    },
    forwardedRef,
  ) => {
    const [activeLegend, setActiveLegend] = useState<string | undefined>(undefined)

    const yDomain: [number | "auto", number | "auto"] = [
      autoMinValue ? "auto" : (minValue ?? "auto"),
      maxValue ?? "auto",
    ]

    return (
      <div ref={forwardedRef} className={cx("h-80 w-full", className)} {...other}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            margin={{
              bottom: xAxisLabel ? 30 : 4,
              left: yAxisLabel ? 20 : 0,
              right: 4,
              top: 4,
            }}
          >
            {showGridLines && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                horizontal
                vertical={false}
                className="dark:stroke-gray-800"
              />
            )}

            <XAxis
              hide={!showXAxis}
              dataKey={index}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              dy={6}
            >
              {xAxisLabel && (
                <Label position="insideBottom" offset={-20} className="fill-gray-800 text-sm font-medium">
                  {xAxisLabel}
                </Label>
              )}
            </XAxis>

            <YAxis
              hide={!showYAxis}
              width={yAxisWidth}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              dx={-4}
              domain={yDomain}
              tickFormatter={valueFormatter}
              allowDecimals={allowDecimals}
            >
              {yAxisLabel && (
                <Label
                  position="insideLeft"
                  style={{ textAnchor: "middle" }}
                  angle={-90}
                  offset={-15}
                  className="fill-gray-800 text-sm font-medium"
                >
                  {yAxisLabel}
                </Label>
              )}
            </YAxis>

            {showTooltip && (
              <Tooltip
                wrapperStyle={{ outline: "none" }}
                cursor={{ fill: "#d1d5db", opacity: 0.15 }}
                content={({ active, payload, label }) => (
                  <ChartTooltip
                    active={active}
                    payload={payload}
                    label={label}
                    valueFormatter={valueFormatter}
                  />
                )}
              />
            )}

            {showLegend && categories.length > 1 && (
              <div className="flex justify-center gap-4 pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveLegend(activeLegend === cat ? undefined : cat)}
                    className="flex items-center gap-1.5 text-xs text-gray-600"
                  >
                    <span className="inline-block size-2 rounded-sm bg-emerald-500" />
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {categories.map((category) => (
              <Bar
                key={category}
                name={category}
                dataKey={category}
                isAnimationActive={false}
                shape={<CustomBar />}
                opacity={activeLegend && activeLegend !== category ? 0.3 : 1}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    )
  },
)

BarChart.displayName = "BarChart"
