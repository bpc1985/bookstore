"use client";

import { useEffect, useState } from "react";
import { DollarSign, Package, BookOpen, Users, TrendingUp, Star, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Analytics } from "@bookstore/types";
import Link from "next/link";
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AdminAnalytics extends Analytics {
  books_by_category?: Array<{ name: string; value: number }>;
  user_growth?: Array<{ month: string; users: number }>;
  recently_added_books?: Array<{ date: string; books: number }>;
}

const COLORS = ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"];

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await api.getAnalytics() as AdminAnalytics;
        setAnalytics(data);
      } catch {
        console.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Revenue",
      value: `$${analytics?.total_revenue || "0.00"}`,
      icon: DollarSign,
      gradient: "from-emerald-500/20 to-emerald-600/10",
      iconColor: "text-emerald-600",
      link: "/orders",
    },
    {
      title: "Total Orders",
      value: analytics?.total_orders || 0,
      icon: Package,
      gradient: "from-blue-500/20 to-blue-600/10",
      iconColor: "text-blue-600",
      link: "/orders",
    },
    {
      title: "Pending Orders",
      value: analytics?.pending_orders || 0,
      icon: TrendingUp,
      gradient: "from-amber-500/20 to-amber-600/10",
      iconColor: "text-amber-600",
      link: "/orders",
    },
    {
      title: "Total Books",
      value: analytics?.total_books || 0,
      icon: BookOpen,
      gradient: "from-violet-500/20 to-violet-600/10",
      iconColor: "text-violet-600",
      link: "/books",
    },
    {
      title: "Total Users",
      value: analytics?.total_users || 0,
      icon: Users,
      gradient: "from-indigo-500/20 to-indigo-600/10",
      iconColor: "text-indigo-600",
      link: "/users",
    },
    {
      title: "Total Reviews",
      value: analytics?.total_reviews || 0,
      icon: Star,
      gradient: "from-orange-500/20 to-orange-600/10",
      iconColor: "text-orange-600",
      link: "/reviews",
    },
  ];

  const booksByCategoryData = analytics?.books_by_category || [];
  const userGrowthData = analytics?.user_growth || [];
  const recentBooksData = analytics?.recently_added_books || [];

  const now = new Date();
  const greeting =
    now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting}!</h1>
        <p className="text-muted-foreground">
          {now.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.link}>
              <Card className="group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient}`}
                    >
                      <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    <span>View details</span>
                    <ArrowUpRight className="ml-1 h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Books per Category Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Books by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {booksByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={booksByCategoryData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                  >
                    {booksByCategoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`var(${COLORS[index % COLORS.length]})`}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Growth Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">User Growth (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Added Books Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recently Added Books (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBooksData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentBooksData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="books"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
