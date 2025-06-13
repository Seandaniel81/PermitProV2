import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Upload, FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PackageDocument } from "@/lib/types";

interface DocumentChecklistProps {
  packageId: number;
  documents: PackageDocument[];
}

interface AddDocumentForm {
  documentName: string;
  isRequired: boolean;
}

export function DocumentChecklist({ packageId, documents }: DocumentChecklistProps) {
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddDocumentForm>({
    defaultValues: {
      documentName: "",
      isRequired: false,
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async ({ documentId, isCompleted }: { documentId: number; isCompleted: boolean }) => {
      return apiRequest("PATCH", `/api/documents/${documentId}`, {
        isCompleted: isCompleted ? 1 : 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/packages/${packageId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      });
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: async (data: AddDocumentForm) => {
      return apiRequest("POST", `/api/packages/${packageId}/documents`, {
        documentName: data.documentName,
        isRequired: data.isRequired ? 1 : 0,
        isCompleted: 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/packages/${packageId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      setIsAddingDocument(false);
      form.reset();
      toast({
        title: "Success",
        description: "Document added to checklist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add document",
        variant: "destructive",
      });
    },
  });

  const handleDocumentToggle = (documentId: number, isCompleted: boolean) => {
    updateDocumentMutation.mutate({ documentId, isCompleted });
  };

  const handleAddDocument = (data: AddDocumentForm) => {
    addDocumentMutation.mutate(data);
  };

  const requiredDocuments = documents.filter(doc => doc.isRequired === 1);
  const optionalDocuments = documents.filter(doc => doc.isRequired === 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Document Checklist
          </CardTitle>
          <Dialog open={isAddingDocument} onOpenChange={setIsAddingDocument}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Document to Checklist</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAddDocument)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="documentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter document name" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Required document</FormLabel>
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddingDocument(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addDocumentMutation.isPending}>
                      {addDocumentMutation.isPending ? "Adding..." : "Add Document"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required Documents */}
        {requiredDocuments.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Required Documents</h4>
            <div className="space-y-3">
              {requiredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={doc.isCompleted === 1}
                      onCheckedChange={(checked) => handleDocumentToggle(doc.id, !!checked)}
                      disabled={updateDocumentMutation.isPending}
                    />
                    <span className={doc.isCompleted === 1 ? "line-through text-gray-500" : "text-gray-900"}>
                      {doc.documentName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.isCompleted === 1 ? (
                      <div className="flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        <span className="text-sm">Complete</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <X className="h-4 w-4 mr-1" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                    <Button variant="ghost" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Documents */}
        {optionalDocuments.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Optional Documents</h4>
            <div className="space-y-3">
              {optionalDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={doc.isCompleted === 1}
                      onCheckedChange={(checked) => handleDocumentToggle(doc.id, !!checked)}
                      disabled={updateDocumentMutation.isPending}
                    />
                    <span className={doc.isCompleted === 1 ? "line-through text-gray-500" : "text-gray-900"}>
                      {doc.documentName}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Optional</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.isCompleted === 1 ? (
                      <div className="flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        <span className="text-sm">Complete</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <X className="h-4 w-4 mr-1" />
                        <span className="text-sm">Pending</span>
                      </div>
                    )}
                    <Button variant="ghost" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {documents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No documents in checklist yet</p>
            <p className="text-sm">Add documents to track your permit package progress</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
