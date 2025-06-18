import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Edit, Trash2, Send, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Header } from "@/components/layout/header";
import { DocumentChecklistNew as DocumentChecklist } from "@/components/document-checklist-new";
import { PackageStatusUpdater } from "@/components/package-status-updater";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PackageWithDocuments } from "@/lib/types";
import { getStatusDisplay, formatDate, formatCurrency } from "@/lib/types";

export default function PackageDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const packageId = parseInt(params.id as string);

  const { data: pkg, isLoading, error } = useQuery<PackageWithDocuments>({
    queryKey: [`/api/packages/${packageId}`],
    enabled: !isNaN(packageId),
  });

  const deletePackageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/packages/${packageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
      setLocation('/');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    },
  });

  const submitPackageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/packages/${packageId}`, {
        status: 'submitted',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/packages/${packageId}`] });
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
          <div className="max-w-6xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
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

  const statusDisplay = getStatusDisplay(pkg.status);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title={pkg.projectName} />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          {/* Package Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold text-gray-900">{pkg.projectName}</h1>
                  <Badge className={`status-badge ${statusDisplay.className}`}>
                    <i className={`${statusDisplay.icon} mr-1`} />
                    {statusDisplay.label}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                  {pkg.status === 'ready_to_submit' && (
                    <Button
                      onClick={() => submitPackageMutation.mutate()}
                      disabled={submitPackageMutation.isPending}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {submitPackageMutation.isPending ? "Submitting..." : "Submit Package"}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => setLocation(`/package/${pkg.id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <Button variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Package</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this package? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePackageMutation.mutate()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Address:</span>
                  <p className="font-medium">{pkg.address}</p>
                </div>
                <div>
                  <span className="text-gray-500">Permit Type:</span>
                  <p className="font-medium">{pkg.permitType}</p>
                </div>
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="font-medium">{formatDate(pkg.createdAt)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Progress:</span>
                  <p className="font-medium">{pkg.completedDocuments}/{pkg.totalDocuments} documents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Package Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pkg.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{pkg.description}</p>
                  </div>
                )}
                
                {pkg.clientName && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Client Information</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Name:</span> {pkg.clientName}</p>
                      {pkg.clientEmail && <p><span className="text-gray-500">Email:</span> {pkg.clientEmail}</p>}
                      {pkg.clientPhone && <p><span className="text-gray-500">Phone:</span> {pkg.clientPhone}</p>}
                    </div>
                  </div>
                )}
                
                {pkg.estimatedValue && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Project Value</h4>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(pkg.estimatedValue)}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Created:</span> {formatDate(pkg.createdAt)}</p>
                    <p><span className="text-gray-500">Last Updated:</span> {formatDate(pkg.updatedAt)}</p>
                    {pkg.submittedAt && (
                      <p><span className="text-gray-500">Submitted:</span> {formatDate(pkg.submittedAt)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Management */}
            <div>
              <PackageStatusUpdater
                packageId={pkg.id}
                currentStatus={pkg.status}
                completedDocuments={pkg.completedDocuments}
                totalDocuments={pkg.totalDocuments}
              />
            </div>

            {/* Document Checklist */}
            <div>
              <DocumentChecklist packageId={pkg.id} documents={pkg.documents} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
