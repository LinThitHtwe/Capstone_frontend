"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  DayCountPoint,
  AvailabilityCountPoint,
  RoleCountPoint,
} from "@/lib/data/admin-chart-data"

const programChartConfig = {
  count: {
    label: "Students",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const timelineChartConfig = {
  count: {
    label: "Reservations",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig

const statusChartConfig = {
  confirmed: {
    label: "Confirmed",
    color: "hsl(var(--chart-1))",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
  cancelled: {
    label: "Cancelled",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

type Props = {
  roleData: RoleCountPoint[]
  availabilityData: AvailabilityCountPoint[]
  timelineData: DayCountPoint[]
}

export function AdminHomeCharts({
  roleData,
  availabilityData,
  timelineData,
}: Props) {
  const pieData = availabilityData.filter((d) => d.count > 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Users by role</CardTitle>
          <CardDescription>
            Headcount grouped by role (sample data).
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer
            config={programChartConfig}
            className="aspect-auto h-[280px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={roleData}
              margin={{ left: 12, right: 12, top: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="role"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                width={32}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservation availability</CardTitle>
          <CardDescription>Share of records by availability flag.</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[280px] flex-col items-center justify-center pb-4">
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reservation data yet.</p>
          ) : (
            <ChartContainer
              config={statusChartConfig}
              className="aspect-square w-full max-w-[280px]"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      nameKey="availability"
                    />
                  }
                />
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="availability"
                  innerRadius={56}
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  <LabelList
                    dataKey="count"
                    stroke="none"
                    fontSize={12}
                    fontWeight={500}
                    fill="hsl(var(--foreground))"
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reservations by day</CardTitle>
          <CardDescription>
            Number of reservations starting on each day.
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer
            config={timelineChartConfig}
            className="aspect-auto h-[260px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={timelineData}
              margin={{ left: 12, right: 12, top: 12 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                width={32}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="count"
                type="monotone"
                fill="var(--color-count)"
                fillOpacity={0.25}
                stroke="var(--color-count)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
