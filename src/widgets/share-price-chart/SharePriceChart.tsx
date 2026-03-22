"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { useVaultApiQuery } from "@/entities/vault";
import type { HistoricalPoint, TimeRange } from "@/entities/vault";
import { useTranslation } from "react-i18next";

interface ChartPoint {
  date: string;
  sharePrice: number;
}

const TIME_RANGE_KEYS: TimeRange[] = ["7d", "30d", "90d", "1y", "all"];

function toChartData(points: HistoricalPoint[]): ChartPoint[] {
  return points
    .filter((p) => p.y !== null)
    .sort((a, b) => a.x - b.x)
    .map((p) => ({
      date: new Date(p.x * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      sharePrice: p.y as number,
    }));
}

const COLORS = {
  grid: "rgba(255, 255, 255, 0.06)",
  tick: "rgba(180, 190, 210, 0.6)",
  line: "#6b8afd",
  tooltipBg: "#1e2330",
  tooltipBorder: "rgba(255, 255, 255, 0.1)",
  tooltipText: "#e8ecf4",
};

export function SharePriceChart() {
  const { t } = useTranslation("chart");
  const [timeRange, setTimeRange] = useState<TimeRange>("1y");
  const { data: apiData, isLoading, error } = useVaultApiQuery(timeRange);
  const historical = apiData?.vaultV2ByAddress?.historicalState?.sharePrice;
  const chartData = historical ? toChartData(historical) : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">{t("error")}</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <div className="flex gap-1">
          {TIME_RANGE_KEYS.map((key) => (
            <Button
              key={key}
              variant={timeRange === key ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeRange(key)}
            >
              {t(`timeRange.${key}`)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: COLORS.tick }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 11, fill: COLORS.tick }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(4)}`}
              width={72}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: COLORS.tooltipBg,
                border: `1px solid ${COLORS.tooltipBorder}`,
                borderRadius: "8px",
                color: COLORS.tooltipText,
                fontSize: "13px",
              }}
              formatter={(value) => [`$${Number(value).toFixed(6)}`, t("tooltipLabel")]}
            />
            <Line
              type="monotone"
              dataKey="sharePrice"
              stroke={COLORS.line}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: COLORS.line }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
