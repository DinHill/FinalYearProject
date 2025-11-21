'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3,
  TrendingUp,
  Users,
  GraduationCap,
  DollarSign,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('fall-2024');
  const [dateRange, setDateRange] = useState('6-months');

  const handleRefresh = () => {
    toast.info('Refreshing analytics data...');
    window.location.reload();
  };

  const handleExportReport = async () => {
    try {
      toast.info('Generating report...');
      const response = await api.get('/api/v1/dashboard/analytics/export', { 
        params: { campus: selectedCampus, term: selectedTerm, range: dateRange }
      });
      
      if (response.success && response.data) {
        // Create CSV blob and download
        const blob = new Blob([JSON.stringify(response.data)], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `analytics_export_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        toast.success('Report exported successfully');
      }
    } catch {
      toast.error('Failed to export report');
    }
  };

  // Fetch real data from backend
  const { data: userActivityResponse } = useQuery({
    queryKey: ['analytics', 'user-activity', selectedCampus, selectedTerm, dateRange],
    queryFn: async () => {
      const result = await api.get('/api/v1/dashboard/analytics/user-activity', {
        params: { campus: selectedCampus !== 'all' ? selectedCampus : undefined }
      });
      return result;
    },
  });

  const { data: enrollmentResponse } = useQuery({
    queryKey: ['analytics', 'enrollment-trends', selectedCampus, selectedTerm],
    queryFn: async () => {
      const result = await api.get('/api/v1/dashboard/analytics/enrollment-trends', {
        params: { campus: selectedCampus !== 'all' ? selectedCampus : undefined }
      });
      return result;
    },
  });

  const { data: revenueResponse } = useQuery({
    queryKey: ['analytics', 'revenue', selectedCampus, selectedTerm, dateRange],
    queryFn: async () => {
      const result = await api.get('/api/v1/dashboard/analytics/revenue', {
        params: { campus: selectedCampus !== 'all' ? selectedCampus : undefined }
      });
      return result;
    },
  });

  // Use real data or fallback to empty arrays
  const userActivityData = Array.isArray(userActivityResponse?.data) ? userActivityResponse.data : [];
  const enrollmentData = Array.isArray(enrollmentResponse?.data) ? enrollmentResponse.data : [];
  const revenueData = Array.isArray(revenueResponse?.data) ? revenueResponse.data : [];

  const attendanceData = [
    { name: 'Excellent (90-100%)', value: 45, color: '#10B981' },
    { name: 'Good (80-89%)', value: 35, color: '#3B82F6' },
    { name: 'Average (70-79%)', value: 15, color: '#F59E0B' },
    { name: 'Poor (<70%)', value: 5, color: '#EF4444' }
  ];

  const documentSLAData = [
    { type: 'Official Transcript', processed: 45, onTime: 42, breached: 3 },
    { type: 'Enrollment Certificate', processed: 23, onTime: 21, breached: 2 },
    { type: 'Grade Report', processed: 67, onTime: 65, breached: 2 },
    { type: 'Degree Certificate', processed: 34, onTime: 33, breached: 1 }
  ];

  return (
    <AdminLayout>
      <PageHeader
        breadcrumbs={[{ label: 'Analytics & Reports' }]}
        subtitle="Track performance metrics and generate insights"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" className="bg-brand-orange hover:bg-brand-orange/90 text-white" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={selectedCampus} onValueChange={setSelectedCampus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Campus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campuses</SelectItem>
              <SelectItem value="main">Main Campus</SelectItem>
              <SelectItem value="north">North Campus</SelectItem>
              <SelectItem value="south">South Campus</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fall-2024">Fall 2024</SelectItem>
              <SelectItem value="spring-2024">Spring 2024</SelectItem>
              <SelectItem value="summer-2024">Summer 2024</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-month">Last Month</SelectItem>
              <SelectItem value="3-months">Last 3 Months</SelectItem>
              <SelectItem value="6-months">Last 6 Months</SelectItem>
              <SelectItem value="1-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users Today</p>
                  <p className="text-xl font-semibold">1,847</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+12% from yesterday</span>
                  </div>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Document Requests</p>
                  <p className="text-xl font-semibold">23</p>
                  <div className="flex items-center mt-2">
                    <Clock className="w-4 h-4 text-orange-600 mr-1" />
                    <span className="text-sm text-orange-600">3 near SLA breach</span>
                  </div>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
                  <p className="text-xl font-semibold font-mono">₫89.4M</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="destructive" className="text-xs">
                      34 overdue
                    </Badge>
                  </div>
                </div>
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">News Reach</p>
                  <p className="text-xl font-semibold">2,341</p>
                  <div className="flex items-center mt-2">
                    <Eye className="w-4 h-4 text-blue-600 mr-1" />
                    <span className="text-sm text-blue-600">82% open rate</span>
                  </div>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Activity Trends
              </CardTitle>
              <CardDescription>Active users by role over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="students" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Students"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="teachers" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Teachers"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="admins" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Admins"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Enrollment by Program */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                Enrollment by Program
              </CardTitle>
              <CardDescription>Current enrollment vs capacity</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="program" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="enrolled" fill="#3B82F6" name="Enrolled" />
                  <Bar dataKey="capacity" fill="#E5E7EB" name="Capacity" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Revenue Trends
              </CardTitle>
              <CardDescription>Revenue breakdown by source (₫1000s)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    formatter={(value: number) => [`₫${value.toLocaleString()}`, '']}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="tuition" 
                    stackId="1" 
                    stroke="#3B82F6" 
                    fill="#3B82F6"
                    name="Tuition"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="fees" 
                    stackId="1" 
                    stroke="#10B981" 
                    fill="#10B981"
                    name="Fees"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="documents" 
                    stackId="1" 
                    stroke="#F59E0B" 
                    fill="#F59E0B"
                    name="Documents"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Attendance Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Attendance Distribution
              </CardTitle>
              <CardDescription>Student attendance rates this semester</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Document SLA Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Document Processing SLA Performance
            </CardTitle>
            <CardDescription>Service level agreement compliance for document requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documentSLAData.map((item) => (
                <div key={item.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{item.type}</p>
                      <p className="text-sm text-muted-foreground">{item.processed} processed this month</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">On Time</p>
                      <p className="font-semibold text-green-600">{item.onTime}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Breached</p>
                      <p className="font-semibold text-red-600">{item.breached}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">SLA Rate</p>
                      <Badge 
                        variant={item.breached === 0 ? 'default' : item.breached <= 2 ? 'secondary' : 'destructive'}
                      >
                        {Math.round((item.onTime / item.processed) * 100)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}