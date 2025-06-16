import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { PackageForm } from "@/components/package-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertPermitPackage } from "@shared/schema";

export default function NewPackage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPackageMutation = useMutation({
    mutationFn: async (data: InsertPermitPackage) => {
      return apiRequest("POST", "/api/packages", data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: "Success",
        description: "Package created successfully",
      });
      // Redirect to the package detail page
      response.json().then((pkg) => {
        setLocation(`/package/${pkg.id}`);
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertPermitPackage) => {
    createPackageMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation('/');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="New Package" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Permit Package</CardTitle>
            </CardHeader>
            <CardContent>
              <PackageForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={createPackageMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
