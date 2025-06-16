import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, FileText, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PACKAGE_STATUSES } from "@shared/schema";

interface PackageStatusUpdaterProps {
  packageId: number;
  currentStatus: string;
  completedDocuments: number;
  totalDocuments: number;
}

export function PackageStatusUpdater({ 
  packageId, 
  currentStatus, 
  completedDocuments, 
  totalDocuments 
}: PackageStatusUpdaterProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return apiRequest("PATCH", `/api/packages/${packageId}`, {
        status: newStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/packages/${packageId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: "Success",
        description: "Package status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update package status",
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'ready_to_submit': return <CheckCircle className="h-4 w-4" />;
      case 'submitted': return <Send className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft';
      case 'in_progress': return 'In Progress';
      case 'ready_to_submit': return 'Ready to Submit';
      case 'submitted': return 'Submitted';
      default: return status;
    }
  };

  const canMoveToStatus = (targetStatus: string) => {
    switch (targetStatus) {
      case 'draft':
        return currentStatus !== 'submitted';
      case 'in_progress':
        return currentStatus !== 'submitted';
      case 'ready_to_submit':
        return completedDocuments === totalDocuments && totalDocuments > 0 && currentStatus !== 'submitted';
      case 'submitted':
        return currentStatus === 'ready_to_submit';
      default:
        return false;
    }
  };

  const getNextSuggestedAction = () => {
    if (currentStatus === 'draft') {
      return {
        status: 'in_progress',
        label: 'Start Working',
        description: 'Begin document collection and preparation',
      };
    }
    if (currentStatus === 'in_progress' && completedDocuments === totalDocuments && totalDocuments > 0) {
      return {
        status: 'ready_to_submit',
        label: 'Mark Ready',
        description: 'All documents are complete - ready for submission',
      };
    }
    if (currentStatus === 'ready_to_submit') {
      return {
        status: 'submitted',
        label: 'Submit Package',
        description: 'Submit the complete package to authorities',
      };
    }
    return null;
  };

  const suggestedAction = getNextSuggestedAction();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {getStatusIcon(currentStatus)}
          <span className="ml-2">Package Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current Status:</span>
          <span className="font-medium">{getStatusLabel(currentStatus)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Document Progress:</span>
          <span className="font-medium">{completedDocuments}/{totalDocuments}</span>
        </div>

        {suggestedAction && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">Next Step</p>
                <p className="text-sm text-blue-700">{suggestedAction.description}</p>
              </div>
              <Button
                onClick={() => updateStatusMutation.mutate(suggestedAction.status)}
                disabled={updateStatusMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                {updateStatusMutation.isPending ? "Updating..." : suggestedAction.label}
              </Button>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Change Status Manually:
          </label>
          <Select
            value={currentStatus}
            onValueChange={(value) => updateStatusMutation.mutate(value)}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PACKAGE_STATUSES).map((status) => (
                <SelectItem
                  key={status}
                  value={status}
                  disabled={!canMoveToStatus(status)}
                >
                  <div className="flex items-center">
                    {getStatusIcon(status)}
                    <span className="ml-2">{getStatusLabel(status)}</span>
                    {!canMoveToStatus(status) && status !== currentStatus && (
                      <span className="ml-2 text-xs text-gray-400">(Not available)</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}