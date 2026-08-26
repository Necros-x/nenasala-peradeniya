"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Users, BookOpen, GraduationCap, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const data = [
  { name: "Jan", total: 120 },
  { name: "Feb", total: 210 },
  { name: "Mar", total: 180 },
  { name: "Apr", total: 320 },
  { name: "May", total: 290 },
  { name: "Jun", total: 450 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Administration Overview</h1>
          <p className="text-text-secondary">Track institutional metrics and pending operations.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/students/new">
            <Button>Register Student</Button>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 mb-4">
              <p className="text-sm font-medium text-text-muted">Total Students</p>
              <div className="p-2 bg-surface-muted rounded-md text-text-secondary">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-bold">1,248</h2>
              <span className="flex items-center text-sm font-medium text-success">
                +12% <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 mb-4">
              <p className="text-sm font-medium text-text-muted">Active Intakes</p>
              <div className="p-2 bg-surface-muted rounded-md text-text-secondary">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-bold">8</h2>
              <span className="text-sm text-text-muted font-medium">3 closing soon</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 mb-4">
              <p className="text-sm font-medium text-text-muted">Pending Verifications</p>
              <div className="p-2 bg-warning/10 rounded-md text-warning">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-bold text-foreground">15</h2>
              <span className="text-sm text-text-muted font-medium">Needs review</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 mb-4">
              <p className="text-sm font-medium text-text-muted">Active Courses</p>
              <div className="p-2 bg-surface-muted rounded-md text-text-secondary">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-bold">24</h2>
              <span className="flex items-center text-sm font-medium text-success">
                +2 <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Enrollment Trend</CardTitle>
            <CardDescription>Monthly student registrations across all programmes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="var(--brand-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: "Super Admin", action: "approved enrollment for", target: "NPU-20260041", time: "10 mins ago" },
                { user: "System", action: "created new intake", target: "WD-26.2", time: "1 hour ago" },
                { user: "Finance Dept", action: "verified payment for", target: "NPU-20260039", time: "3 hours ago" },
                { user: "Super Admin", action: "updated course", target: "React Basics", time: "Yesterday" },
                { user: "Instructor", action: "requested class cancellation", target: "Graphic Design", time: "Yesterday" },
              ].map((log, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-brand-secondary flex-shrink-0"></div>
                  <div>
                    <p className="text-text-primary">
                      <span className="font-medium">{log.user}</span> {log.action} <span className="font-medium">{log.target}</span>
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
