import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Database, 
  HardDrive, 
  Server, 
  Clock, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw
} from "lucide-react";

interface SystemHealth {
  database: {
    connected: boolean;
    responseTime: number;
    error?: string;
  };
  storage: {
    uploadsWritable: boolean;
    backupsWritable: boolean;
    diskSpace: {
      total: number;
      free: number;
      used: number;
      percentage: number;
    };
  };
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  lastCheck: string;
  config?: {
    environment: string;
    databaseHost: string;
    uploadsDirectory: string;
    backupDirectory: string;
    maxFileSize: number;
    autoBackup: boolean;
  };
  version?: string;
  nodeVersion?: string;
}

export default function SystemStatus() {
  const { toast } = useToast();

  const { data: systemHealth, isLoading } = useQuery<SystemHealth>({
    queryKey: ["/api/system/status"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const backupMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/system/backup", "POST", {});
    },
    onSuccess: (data) => {
      toast({
        title: "Backup Created",
        description: `Database backup completed successfully. Size: ${Math.round(data.size / (1024 * 1024))} MB`,
      });
    },
    onError: (error) => {
      toast({
        title: "Backup Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refreshStatus = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (isHealthy: boolean, label: string) => {
    if (isHealthy) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{label}</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{label}</Badge>;
  };

  const getStorageStatusColor = (percentage: number) => {
    if (percentage < 70) return "bg-green-500";
    if (percentage < 85) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!systemHealth) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium">Unable to load system status</h3>
        <p className="text-gray-500">Please try refreshing the page</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Status</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshStatus} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => backupMutation.mutate()} 
            disabled={backupMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            {backupMutation.isPending ? "Creating Backup..." : "Create Backup"}
          </Button>
        </div>
      </div>

      {/* Overall System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-500">Database</div>
              {getStatusBadge(systemHealth.database.connected, systemHealth.database.connected ? "Connected" : "Disconnected")}
              {systemHealth.database.connected && (
                <div className="text-xs text-gray-500">Response: {systemHealth.database.responseTime}ms</div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-500">File Storage</div>
              {getStatusBadge(systemHealth.storage.uploadsWritable && systemHealth.storage.backupsWritable, "Accessible")}
            </div>
            
            <div className="space-y-2">
              <div className="text-sm text-gray-500">System Uptime</div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-green-500" />
                <span className="text-sm font-medium">{formatUptime(systemHealth.system.uptime)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Database Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Connection Status</span>
              {getStatusBadge(systemHealth.database.connected, systemHealth.database.connected ? "Connected" : "Disconnected")}
            </div>
            
            {systemHealth.database.connected && (
              <div className="flex items-center justify-between">
                <span>Response Time</span>
                <span className="text-sm font-medium">{systemHealth.database.responseTime}ms</span>
              </div>
            )}
            
            {systemHealth.database.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm text-red-800">{systemHealth.database.error}</div>
              </div>
            )}
            
            {systemHealth.config && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <span className="text-sm text-gray-500">Host</span>
                  <div className="font-medium">{systemHealth.config.databaseHost}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Environment</span>
                  <div className="font-medium capitalize">{systemHealth.config.environment}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HardDrive className="h-5 w-5 mr-2" />
            Storage Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Disk Usage</span>
                <span className="text-sm font-medium">
                  {systemHealth.storage.diskSpace.used}GB / {systemHealth.storage.diskSpace.total}GB
                </span>
              </div>
              <Progress 
                value={systemHealth.storage.diskSpace.percentage} 
                className="h-2"
              />
              <div className="text-xs text-gray-500">
                {systemHealth.storage.diskSpace.free}GB free ({100 - systemHealth.storage.diskSpace.percentage}% available)
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span>Uploads Directory</span>
                {getStatusBadge(systemHealth.storage.uploadsWritable, systemHealth.storage.uploadsWritable ? "Writable" : "Error")}
              </div>
              <div className="flex items-center justify-between">
                <span>Backups Directory</span>
                {getStatusBadge(systemHealth.storage.backupsWritable, systemHealth.storage.backupsWritable ? "Writable" : "Error")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="h-5 w-5 mr-2" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Memory Usage</span>
                <span className="text-sm font-medium">
                  {systemHealth.system.memory.used}MB / {systemHealth.system.memory.total}MB
                </span>
              </div>
              <Progress 
                value={systemHealth.system.memory.percentage} 
                className="h-2"
              />
            </div>
            
            {systemHealth.config && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <span className="text-sm text-gray-500">Application Version</span>
                  <div className="font-medium">{systemHealth.version || "1.0.0"}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Node.js Version</span>
                  <div className="font-medium">{systemHealth.nodeVersion}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Auto Backup</span>
                  <div className="font-medium">{systemHealth.config.autoBackup ? "Enabled" : "Disabled"}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Max File Size</span>
                  <div className="font-medium">{Math.round(systemHealth.config.maxFileSize / (1024 * 1024))}MB</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}