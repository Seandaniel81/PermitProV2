import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import type { PackageWithDocuments } from "@shared/schema";

export default function Reports() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  const { data: packages = [], isLoading } = useQuery<PackageWithDocuments[]>({
    queryKey: ['/api/packages'],
  });

  const filterPackages = (status: string) => {
    if (status === "in-progress") {
      return packages.filter(pkg => 
        pkg.status === "draft" || 
        pkg.status === "in_progress" || 
        pkg.status === "ready_to_submit"
      );
    }
    if (status === "completed") {
      return packages.filter(pkg => pkg.status === "submitted");
    }
    if (status !== "all") {
      return packages.filter(pkg => pkg.status === status);
    }
    return packages;
  };

  const inProgressPackages = filterPackages("in-progress");
  const completedPackages = filterPackages("completed");
  const filteredPackages = filterPackages(statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'ready_to_submit': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'ready_to_submit': return 'Ready to Submit';
      case 'submitted': return 'Submitted';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const exportToCSV = (data: PackageWithDocuments[], filename: string) => {
    const headers = ['Project Name', 'Permit Type', 'Status', 'Progress', 'Created Date', 'Updated Date'];
    const csvContent = [
      headers.join(','),
      ...data.map(pkg => [
        `"${pkg.projectName}"`,
        `"${pkg.permitType}"`,
        `"${formatStatus(pkg.status)}"`,
        `"${pkg.progressPercentage}%"`,
        `"${format(new Date(pkg.createdAt), 'MM/dd/yyyy')}"`,
        `"${format(new Date(pkg.updatedAt), 'MM/dd/yyyy')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">View and export permit package reports</p>
        </div>
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-500">
            Generated on {format(new Date(), 'MMM dd, yyyy')}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressPackages.length}</div>
            <p className="text-xs text-muted-foreground">
              {packages.length > 0 ? Math.round((inProgressPackages.length / packages.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedPackages.length}</div>
            <p className="text-xs text-muted-foreground">
              {packages.length > 0 ? Math.round((completedPackages.length / packages.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.length > 0 
                ? Math.round(packages.reduce((sum, pkg) => sum + pkg.progressPercentage, 0) / packages.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Packages</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="ready_to_submit">Ready to Submit</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => exportToCSV(filteredPackages, `permit-packages-${format(new Date(), 'yyyy-MM-dd')}.csv`)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <PackageTable packages={filteredPackages} title="All Packages" />
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          <PackageTable packages={inProgressPackages} title="In Progress Packages" />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <PackageTable packages={completedPackages} title="Completed Packages" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PackageTable({ packages, title }: { packages: PackageWithDocuments[], title: string }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'ready_to_submit': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'ready_to_submit': return 'Ready to Submit';
      case 'submitted': return 'Submitted';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {packages.length} package{packages.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Project Name</th>
                <th className="text-left p-4 font-medium">Permit Type</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Progress</th>
                <th className="text-left p-4 font-medium">Documents</th>
                <th className="text-left p-4 font-medium">Created</th>
                <th className="text-left p-4 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{pkg.projectName}</div>
                    <div className="text-sm text-gray-500">ID: {pkg.id}</div>
                  </td>
                  <td className="p-4">{pkg.permitType}</td>
                  <td className="p-4">
                    <Badge className={getStatusColor(pkg.status)}>
                      {formatStatus(pkg.status)}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${pkg.progressPercentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{pkg.progressPercentage}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">
                      {pkg.completedDocuments}/{pkg.totalDocuments}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {format(new Date(pkg.createdAt), 'MM/dd/yyyy')}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {format(new Date(pkg.updatedAt), 'MM/dd/yyyy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {packages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No packages found matching the current filters.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}