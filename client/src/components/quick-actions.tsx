import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Copy, 
  FileText, 
  Download, 
  Search, 
  Filter,
  Calendar,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { permitTypeOptions } from "@/lib/types";

interface QuickActionsProps {
  onFilterChange?: (filters: any) => void;
}

export function QuickActions({ onFilterChange }: QuickActionsProps) {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [projectName, setProjectName] = useState("");
  const [address, setAddress] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createFromTemplateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/packages", {
        projectName,
        address,
        permitType: selectedTemplate,
        status: "draft",
        description: `New ${selectedTemplate} package created from template`,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      setIsTemplateDialogOpen(false);
      setProjectName("");
      setAddress("");
      setSelectedTemplate("");
      toast({
        title: "Success",
        description: "Package created from template",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create package from template",
        variant: "destructive",
      });
    },
  });

  const quickActions = [
    {
      label: "New Package",
      icon: Plus,
      href: "/new-package",
      variant: "default" as const,
      description: "Start a new permit package"
    },
    {
      label: "From Template",
      icon: Copy,
      onClick: () => setIsTemplateDialogOpen(true),
      variant: "outline" as const,
      description: "Create from common templates"
    },
    {
      label: "Export Data",
      icon: Download,
      onClick: () => {
        toast({
          title: "Coming Soon",
          description: "Export functionality will be available soon",
        });
      },
      variant: "outline" as const,
      description: "Export packages to PDF/Excel"
    },
    {
      label: "Analytics",
      icon: BarChart3,
      onClick: () => {
        toast({
          title: "Coming Soon",
          description: "Analytics dashboard will be available soon",
        });
      },
      variant: "outline" as const,
      description: "View detailed analytics"
    }
  ];

  const quickFilters = [
    {
      label: "In Progress",
      onClick: () => onFilterChange?.({ status: 'in_progress' }),
      icon: Calendar,
    },
    {
      label: "Ready to Submit",
      onClick: () => onFilterChange?.({ status: 'ready_to_submit' }),
      icon: FileText,
    },
    {
      label: "Building Permits",
      onClick: () => onFilterChange?.({ permitType: 'Building Permit' }),
      icon: Search,
    },
    {
      label: "Clear Filters",
      onClick: () => onFilterChange?.({}),
      icon: Filter,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <div key={action.label}>
                {action.href ? (
                  <Link href={action.href}>
                    <Button
                      variant={action.variant}
                      className="w-full h-20 flex flex-col space-y-2"
                    >
                      <action.icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{action.label}</span>
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant={action.variant}
                    onClick={action.onClick}
                    className="w-full h-20 flex flex-col space-y-2"
                  >
                    <action.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <Button
                key={filter.label}
                variant="outline"
                size="sm"
                onClick={filter.onClick}
                className="flex items-center space-x-2"
              >
                <filter.icon className="h-4 w-4" />
                <span>{filter.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Package from Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template">Permit Type</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select permit type" />
                </SelectTrigger>
                <SelectContent>
                  {permitTypeOptions.slice(1).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter project address"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsTemplateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => createFromTemplateMutation.mutate()}
                disabled={!selectedTemplate || !projectName || !address || createFromTemplateMutation.isPending}
              >
                {createFromTemplateMutation.isPending ? "Creating..." : "Create Package"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}