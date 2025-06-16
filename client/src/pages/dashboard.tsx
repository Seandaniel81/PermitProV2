import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/stats-cards";
import { PackageCard } from "@/components/package-card";
import { QuickActions } from "@/components/quick-actions";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PackagesResponse, FilterOptions } from "@/lib/types";
import { statusOptions, permitTypeOptions } from "@/lib/types";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    permitType: 'all',
    search: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<PackagesResponse>({
    queryKey: ['/api/packages', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      if (filters.permitType && filters.permitType !== 'all') params.append('permitType', filters.permitType);
      if (filters.search) params.append('search', filters.search);
      
      const response = await fetch(`/api/packages?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch packages');
      return response.json();
    },
  });

  const submitPackageMutation = useMutation({
    mutationFn: async (packageId: number) => {
      return apiRequest("PATCH", `/api/packages/${packageId}`, {
        status: 'submitted',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: "Success",
        description: "Package submitted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit package",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query }));
  };

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickFilterChange = (newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({ status: 'all', permitType: 'all', search: '' });
  };

  const handleEdit = (packageId: number) => {
    setLocation(`/package/${packageId}/edit`);
  };

  const handleDuplicate = (packageId: number) => {
    // TODO: Implement duplication
    toast({
      title: "Feature Coming Soon",
      description: "Package duplication will be available soon",
    });
  };

  const handleSubmit = (packageId: number) => {
    submitPackageMutation.mutate(packageId);
  };

  if (error) {
    return (
      <div className="flex-1 p-6">
        <Header title="Dashboard" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load dashboard data</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="Dashboard" onSearch={handleSearch} />
      
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          data && <StatsCards stats={data.stats} />
        )}

        {/* Quick Actions */}
        <QuickActions onFilterChange={handleQuickFilterChange} />

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-wrap items-center gap-4">
                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Permit Type Filter */}
                <Select
                  value={filters.permitType}
                  onValueChange={(value) => handleFilterChange('permitType', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {permitTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Date Range - TODO: Implement */}
                <Input type="date" className="w-40" />
                <span className="text-gray-500 text-sm">to</span>
                <Input type="date" className="w-40" />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Packages List */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Packages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y divide-gray-200">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </div>
                ))}
              </div>
            ) : data?.packages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No packages found</p>
                <Button onClick={() => setLocation('/new-package')}>
                  Create Your First Package
                </Button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-200">
                  {data?.packages.map((pkg) => (
                    <PackageCard
                      key={pkg.id}
                      package={pkg}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicate}
                      onSubmit={handleSubmit}
                    />
                  ))}
                </div>
                
                {/* Pagination - TODO: Implement */}
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{data?.packages.length || 0}</span> of <span className="font-medium">{data?.packages.length || 0}</span> packages
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Previous
                    </Button>
                    <Button size="sm">1</Button>
                    <Button variant="outline" size="sm" disabled>
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
