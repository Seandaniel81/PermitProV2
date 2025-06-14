import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Header } from "@/components/layout/header";
import { apiRequest } from "@/lib/queryClient";
import { Database, Upload, Bell, Workflow, Shield, Archive } from "lucide-react";

interface Setting {
  id: number;
  key: string;
  value: any;
  description: string;
  category: string;
  isSystem: boolean;
  updatedBy: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("database");

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Settings" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <Shield className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Admin Access Required</h2>
                <p className="text-gray-600">You need administrator privileges to access system settings.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const { data: settings = [], isLoading: settingsLoading } = useQuery<Setting[]>({
    queryKey: ['/api/settings'],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, value }: { id: number; value: any }) => {
      return apiRequest("PUT", `/api/settings/${id}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      return apiRequest("PUT", `/api/users/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, Setting[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database': return <Database className="h-5 w-5" />;
      case 'uploads': return <Upload className="h-5 w-5" />;
      case 'notifications': return <Bell className="h-5 w-5" />;
      case 'workflow': return <Workflow className="h-5 w-5" />;
      case 'backup': return <Archive className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const renderSettingField = (setting: Setting) => {
    const value = setting.value;
    
    if (typeof value === 'object' && value !== null) {
      if ('enabled' in value) {
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={value.enabled}
              onCheckedChange={(checked) => 
                updateSettingMutation.mutate({ 
                  id: setting.id, 
                  value: { ...value, enabled: checked } 
                })
              }
              disabled={setting.isSystem || updateSettingMutation.isPending}
            />
            <Label>Enabled</Label>
          </div>
        );
      }
      
      if ('type' in value) {
        return (
          <Select
            value={value.type}
            onValueChange={(type) => 
              updateSettingMutation.mutate({ 
                id: setting.id, 
                value: { ...value, type } 
              })
            }
            disabled={setting.isSystem}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="sqlite">SQLite</SelectItem>
            </SelectContent>
          </Select>
        );
      }
      
      if ('size' in value) {
        return (
          <Input
            type="number"
            value={value.size / 1048576} // Convert bytes to MB
            onChange={(e) => 
              updateSettingMutation.mutate({ 
                id: setting.id, 
                value: { ...value, size: parseInt(e.target.value) * 1048576 } 
              })
            }
            disabled={setting.isSystem || updateSettingMutation.isPending}
            placeholder="Size in MB"
          />
        );
      }
    }
    
    return (
      <Input
        value={typeof value === 'string' ? value : JSON.stringify(value)}
        onChange={(e) => 
          updateSettingMutation.mutate({ 
            id: setting.id, 
            value: e.target.value 
          })
        }
        disabled={setting.isSystem || updateSettingMutation.isPending}
      />
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <Header title="System Settings" />
      
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="settings">System Settings</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-6">
              {settingsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="flex items-center capitalize">
                          {getCategoryIcon(category)}
                          <span className="ml-2">{category}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {categorySettings.map((setting) => (
                          <div key={setting.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">
                                {setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Label>
                              {setting.isSystem && (
                                <Badge variant="secondary" className="text-xs">System</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">{setting.description}</p>
                            {renderSettingField(setting)}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-16 w-full bg-gray-200 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users.map((userData) => (
                        <div key={userData.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {userData.firstName?.[0]}{userData.lastName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {userData.firstName} {userData.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{userData.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge 
                              variant={userData.role === 'admin' ? 'default' : 'secondary'}
                            >
                              {userData.role}
                            </Badge>
                            <Select
                              value={userData.role}
                              onValueChange={(role) => 
                                updateUserMutation.mutate({ 
                                  id: userData.id, 
                                  updates: { role } 
                                })
                              }
                              disabled={updateUserMutation.isPending}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <Switch
                              checked={userData.isActive}
                              onCheckedChange={(isActive) => 
                                updateUserMutation.mutate({ 
                                  id: userData.id, 
                                  updates: { isActive } 
                                })
                              }
                              disabled={updateUserMutation.isPending}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}