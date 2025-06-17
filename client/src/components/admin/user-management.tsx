import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { CheckCircle, XCircle, Clock, UserCheck, UserX, Shield, User as UserIcon } from "lucide-react";

export function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'role' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      await apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setSelectedUser(null);
      setActionType(null);
      setRejectionReason("");
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (user: User) => {
    updateUserMutation.mutate({
      userId: user.id,
      updates: {
        approvalStatus: 'approved',
        isActive: true,
        approvedAt: new Date().toISOString(),
        rejectionReason: null,
      },
    });
  };

  const handleReject = () => {
    if (!selectedUser || !rejectionReason.trim()) return;

    updateUserMutation.mutate({
      userId: selectedUser.id,
      updates: {
        approvalStatus: 'rejected',
        isActive: false,
        rejectionReason: rejectionReason.trim(),
      },
    });
  };

  const handleRoleChange = () => {
    if (!selectedUser) return;

    updateUserMutation.mutate({
      userId: selectedUser.id,
      updates: {
        role: newRole,
      },
    });
  };

  const toggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      userId: user.id,
      updates: {
        isActive: !user.isActive,
      },
    });
  };

  const getStatusBadge = (user: User) => {
    if (user.approvalStatus === 'pending') {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    if (user.approvalStatus === 'rejected') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    if (!user.isActive) {
      return <Badge variant="outline"><UserX className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
    return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
    ) : (
      <Badge variant="outline"><UserIcon className="w-3 h-3 mr-1" />User</Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingUsers = users.filter((user: User) => user.approvalStatus === 'pending');
  const activeUsers = users.filter((user: User) => user.approvalStatus === 'approved' && user.isActive);
  const inactiveUsers = users.filter((user: User) => !user.isActive || user.approvalStatus === 'rejected');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending Approval</CardTitle>
            <CardDescription>Users awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Users</CardTitle>
            <CardDescription>Approved and active users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Inactive Users</CardTitle>
            <CardDescription>Rejected or deactivated users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.company || '-'}</TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {user.approvalStatus === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprove(user)}
                            disabled={updateUserMutation.isPending}
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Dialog open={actionType === 'reject' && selectedUser?.id === user.id} onOpenChange={() => setActionType(null)}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType('reject');
                                }}
                              >
                                <UserX className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject User Application</DialogTitle>
                                <DialogDescription>
                                  Provide a reason for rejecting {user.firstName} {user.lastName}'s application.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="rejection-reason">Rejection Reason</Label>
                                  <Textarea
                                    id="rejection-reason"
                                    placeholder="Please provide a reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setActionType(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleReject}
                                  disabled={!rejectionReason.trim() || updateUserMutation.isPending}
                                >
                                  Reject User
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {user.approvalStatus === 'approved' && (
                        <>
                          <Button
                            size="sm"
                            variant={user.isActive ? "outline" : "default"}
                            onClick={() => toggleUserStatus(user)}
                            disabled={updateUserMutation.isPending}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>

                          <Dialog open={actionType === 'role' && selectedUser?.id === user.id} onOpenChange={() => setActionType(null)}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewRole(user.role);
                                  setActionType('role');
                                }}
                              >
                                Change Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Change User Role</DialogTitle>
                                <DialogDescription>
                                  Update the role for {user.firstName} {user.lastName}.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="role-select">Role</Label>
                                  <Select value={newRole} onValueChange={(value: 'user' | 'admin') => setNewRole(value)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setActionType(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleRoleChange}
                                  disabled={updateUserMutation.isPending}
                                >
                                  Update Role
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </>
                      )}

                      {user.rejectionReason && (
                        <div className="text-sm text-red-600">
                          Reason: {user.rejectionReason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}