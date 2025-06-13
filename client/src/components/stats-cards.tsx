import { Folder, Clock, CheckCircle, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PackageStats } from "@/lib/types";

interface StatsCardsProps {
  stats: PackageStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const statItems = [
    {
      label: "Total Packages",
      value: stats.total,
      icon: Folder,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      label: "Ready to Submit",
      value: stats.readyToSubmit,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Submitted",
      value: stats.submitted,
      icon: Send,
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{item.label}</p>
                <p className="text-3xl font-bold text-gray-900">{item.value}</p>
              </div>
              <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                <item.icon className={`h-6 w-6 ${item.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
