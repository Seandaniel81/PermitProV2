import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import { PackageForm } from "@/components/package-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PackageWithDocuments } from "@/lib/types";
import type { InsertPermitPackage } from "@shared/schema";

export default function PackageEdit() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const packageId = parseInt(params.id as string);

  const { data: pkg, isLoading, error } = useQuery<PackageWithDocuments>({
    queryKey: [`/api/packages/${packageId}`],
    enabled: !isNaN(packageId),
  });

  const updatePackageMutation = useMutation({
    mutationFn: async (data: InsertPermitPackage) => {
      return apiRequest("PATCH", `/api/packages/${packageId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/packages/${packageId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: "Success",
        description: "Package updated successfully",
      });
      setLocation(`/package/${packageId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive",
      });
    },
  });

  if (isNaN(packageId)) {
    return (
      <div className="flex-1 p-6">
        <Header title="Package Not Found" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Invalid package ID</p>
            <Button onClick={() => setLocation('/')}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <Header title="Error" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load package details</p>
            <Button onClick={() => setLocation('/')}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Loading..." />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="flex-1 p-6">
        <Header title="Package Not Found" />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Package not found</p>
            <Button onClick={() => setLocation('/')}>Return to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (data: InsertPermitPackage) => {
    updatePackageMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation(`/package/${packageId}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title={`Edit: ${pkg.projectName}`} />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setLocation(`/package/${packageId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Package
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Edit Permit Package</CardTitle>
            </CardHeader>
            <CardContent>
              <PackageForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                defaultValues={{
                  projectName: pkg.projectName,
                  address: pkg.address,
                  permitType: pkg.permitType,
                  status: pkg.status,
                  description: pkg.description || "",
                  clientName: pkg.clientName || "",
                  clientEmail: pkg.clientEmail || "",
                  clientPhone: pkg.clientPhone || "",
                  estimatedValue: pkg.estimatedValue ? pkg.estimatedValue / 100 : undefined,
                }}
                isLoading={updatePackageMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}