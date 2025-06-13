import { Link } from "wouter";
import { MapPin, FileText, Calendar, Edit, Copy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PackageWithDocuments, getStatusDisplay, formatDate } from "@/lib/types";

interface PackageCardProps {
  package: PackageWithDocuments;
  onEdit?: (packageId: number) => void;
  onDuplicate?: (packageId: number) => void;
  onSubmit?: (packageId: number) => void;
}

export function PackageCard({ package: pkg, onEdit, onDuplicate, onSubmit }: PackageCardProps) {
  const statusDisplay = getStatusDisplay(pkg.status);

  return (
    <div className="p-6 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0">
      <Link href={`/package/${pkg.id}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h4 className="text-lg font-medium text-gray-900">{pkg.projectName}</h4>
              <Badge className={`status-badge ${statusDisplay.className}`}>
                <i className={`${statusDisplay.icon} mr-1`} />
                {statusDisplay.label}
              </Badge>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-center text-sm text-gray-600 space-y-1 lg:space-y-0 lg:space-x-6">
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                {pkg.address}
              </span>
              <span className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                {pkg.permitType}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Created: {formatDate(pkg.createdAt)}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Document Progress</span>
                <span className="text-gray-900 font-medium">
                  {pkg.completedDocuments}/{pkg.totalDocuments} completed
                </span>
              </div>
              <Progress value={pkg.progressPercentage} className="h-2" />
            </div>
          </div>
          
          <div className="flex items-center space-x-3 ml-6">
            {pkg.status === 'ready_to_submit' && onSubmit && (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSubmit(pkg.id);
                }}
                className="bg-green-500 hover:bg-green-600 text-white"
                size="sm"
              >
                Submit Package
              </Button>
            )}
            
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(pkg.id);
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDuplicate(pkg.id);
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </Link>
    </div>
  );
}
