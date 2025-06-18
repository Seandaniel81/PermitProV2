import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Upload, FileText, Plus, Download, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/types";
import { DocumentViewer } from "@/components/document-viewer";
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
  const [uploadingDocId, setUploadingDocId] = useState<number | null>(null);
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

  const uploadFileMutation = useMutation({
    mutationFn: async ({ documentId, file }: { documentId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/documents/${documentId}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/packages/${packageId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      setUploadingDocId(null);
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    },
    onError: () => {
      setUploadingDocId(null);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}/file`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/packages/${packageId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleDocumentToggle = (documentId: number, isCompleted: boolean) => {
    updateDocumentMutation.mutate({ documentId, isCompleted });
  };

  const handleFileUpload = (documentId: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setUploadingDocId(documentId);
        uploadFileMutation.mutate({ documentId, file });
      }
    };
    input.click();
  };

  const handleDownloadFile = (documentId: number) => {
    window.open(`/api/documents/${documentId}/download`, '_blank');
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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
                <div key={doc.id} className="p-4 bg-white border rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={doc.isCompleted === 1}
                        onCheckedChange={(checked) => handleDocumentToggle(doc.id, !!checked)}
                        disabled={updateDocumentMutation.isPending}
                      />
                      <div>
                        <span className={doc.isCompleted === 1 ? "line-through text-gray-500" : "text-gray-900 font-medium"}>
                          {doc.documentName}
                        </span>
                        {doc.fileName && (
                          <div className="mt-1 flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {doc.fileName}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)}
                            </span>
                            {doc.uploadedAt && (
                              <span className="text-xs text-gray-500">
                                Uploaded {formatDate(doc.uploadedAt)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.fileName ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(doc.id)}
                            title="Download file"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFileMutation.mutate(doc.id)}
                            disabled={deleteFileMutation.isPending}
                            title="Delete file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload(doc.id)}
                          disabled={uploadingDocId === doc.id}
                          title="Upload file"
                        >
                          {uploadingDocId === doc.id ? (
                            "Uploading..."
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </>
                          )}
                        </Button>
                      )}
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
                    </div>
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
                <div key={doc.id} className="p-4 bg-white border rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={doc.isCompleted === 1}
                        onCheckedChange={(checked) => handleDocumentToggle(doc.id, !!checked)}
                        disabled={updateDocumentMutation.isPending}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={doc.isCompleted === 1 ? "line-through text-gray-500" : "text-gray-900 font-medium"}>
                            {doc.documentName}
                          </span>
                          <Badge variant="outline" className="text-xs">Optional</Badge>
                        </div>
                        {doc.fileName && (
                          <div className="mt-1 flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {doc.fileName}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(doc.fileSize)}
                            </span>
                            {doc.uploadedAt && (
                              <span className="text-xs text-gray-500">
                                Uploaded {formatDate(doc.uploadedAt)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.fileName ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadFile(doc.id)}
                            title="Download file"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFileMutation.mutate(doc.id)}
                            disabled={deleteFileMutation.isPending}
                            title="Delete file"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileUpload(doc.id)}
                          disabled={uploadingDocId === doc.id}
                          title="Upload file"
                        >
                          {uploadingDocId === doc.id ? (
                            "Uploading..."
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </>
                          )}
                        </Button>
                      )}
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
                    </div>
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
