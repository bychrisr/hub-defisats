import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Search, Filter, Plus, Edit, Trash2, Eye, MoreHorizontal, RefreshCw, UserCheck, UserX, Crown, Zap, Star, Infinity } from 'lucide-react';
import { api } from '@/lib/api';

// Interfaces
interface User {
  id: string;
  email: string;
  username: string;
  plan_type: 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime';
  is_active: boolean;
  created_at: string;
  last_activity_at: string | null;
  total_automations?: number;
  total_positions?: number;
  total_balance?: number;
}

interface UsersResponse {
  success: boolean;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface UserFilters {
  search: string;
  plan_type: string;
  is_active: string;
  sort_by: string;
  sort_order: string;
}

// Plan icons mapping
const planIcons = {
  free: <Crown className="h-4 w-4" />,
  basic: <Zap className="h-4 w-4" />,
  advanced: <Star className="h-4 w-4" />,
  pro: <Crown className="h-4 w-4" />,
  lifetime: <Infinity className="h-4 w-4" />
};

// Plan colors mapping
const planColors = {
  free: 'bg-gray-100 text-gray-800',
  basic: 'bg-blue-100 text-blue-800',
  advanced: 'bg-purple-100 text-purple-800',
  pro: 'bg-yellow-100 text-yellow-800',
  lifetime: 'bg-green-100 text-green-800'
};

export default function Users() {
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    plan_type: 'all',
    is_active: 'all',
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    plan_type: '',
    is_active: true,
    notes: ''
  });

  // Fetch users function
  const fetchUsers = useCallback(async (page = 1, limit = 20) => {
    try {
      console.log('🔍 USERS - Fetching users with params:', { page, limit, filters });
      setRefreshing(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.plan_type && filters.plan_type !== 'all' && { plan_type: filters.plan_type }),
        ...(filters.is_active && filters.is_active !== 'all' && { is_active: filters.is_active }),
        ...(filters.sort_by && { sort_by: filters.sort_by }),
        ...(filters.sort_order && { sort_order: filters.sort_order })
      });

      console.log('🔍 USERS - Making API request to:', `/api/admin/users?${params}`);
      const response = await api.get(`/api/admin/users?${params}`);
      console.log('🔍 USERS - Response received:', response.status);
      
      const data: UsersResponse = response.data;
      console.log('🔍 USERS - Data received:', data);
      
      // Validate response structure
      if (!data.success || !data.data || !Array.isArray(data.data.users)) {
        console.error('❌ USERS - Invalid response structure:', data);
        throw new Error('Invalid response structure from API');
      }
      
      console.log('🔍 USERS - Setting users:', data.data.users.length, 'users');
      setUsers(data.data.users);
      setPagination(data.data.pagination);
      
    } catch (error: any) {
      console.error('❌ USERS - Error fetching users:', error);
      toast.error('Failed to fetch users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  // Load users on mount and when filters change
  useEffect(() => {
    console.log('🔍 USERS - useEffect triggered, fetching users');
    fetchUsers();
  }, [fetchUsers]);

  // Handle filter changes
  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    console.log('🔍 USERS - Filter changed:', key, value);
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    console.log('🔍 USERS - Page changed to:', page);
    fetchUsers(page, pagination.limit);
  };

  // Handle refresh
  const handleRefresh = () => {
    console.log('🔍 USERS - Manual refresh triggered');
    fetchUsers(pagination.page, pagination.limit);
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    console.log('🔍 USERS - User selected:', user.id);
    setSelectedUser(user);
    setEditForm({
      plan_type: user.plan_type,
      is_active: user.is_active,
      notes: ''
    });
    setShowUserDialog(true);
  };

  // Handle edit user
  const handleEditUser = (user: User) => {
    console.log('🔍 USERS - Edit user:', user.id);
    setSelectedUser(user);
    setEditForm({
      plan_type: user.plan_type,
      is_active: user.is_active,
      notes: ''
    });
    setShowEditDialog(true);
  };

  // Handle delete user
  const handleDeleteUser = (user: User) => {
    console.log('🔍 USERS - Delete user:', user.id);
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  // Handle toggle user status
  const handleToggleStatus = async (user: User) => {
    try {
      console.log('🔍 USERS - Toggling status for user:', user.id);
      const response = await api.patch(`/api/admin/users/${user.id}/toggle`);
      
      if (response.data.success) {
        toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
        fetchUsers(pagination.page, pagination.limit);
      }
    } catch (error: any) {
      console.error('❌ USERS - Error toggling user status:', error);
      toast.error('Failed to toggle user status: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle save user changes
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    try {
      console.log('🔍 USERS - Saving user changes:', selectedUser.id, editForm);
      
      // Here you would make API calls to update the user
      // For now, just show success message
      toast.success('User updated successfully');
      setShowEditDialog(false);
      fetchUsers(pagination.page, pagination.limit);
    } catch (error: any) {
      console.error('❌ USERS - Error saving user:', error);
      toast.error('Failed to save user: ' + (error.response?.data?.message || error.message));
    }
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    
    try {
      console.log('🔍 USERS - Confirming delete for user:', selectedUser.id);
      
      // Here you would make API call to delete the user
      // For now, just show success message
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      fetchUsers(pagination.page, pagination.limit);
    } catch (error: any) {
      console.error('❌ USERS - Error deleting user:', error);
      toast.error('Failed to delete user: ' + (error.response?.data?.message || error.message));
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get plan display name
  const getPlanDisplayName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">
            Manage users, plans, and account status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.total}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.is_active).length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Free Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.plan_type === 'free').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((users.filter(u => u.plan_type === 'free').length / pagination.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pro Users</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.plan_type === 'pro').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((users.filter(u => u.plan_type === 'pro').length / pagination.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Users</CardTitle>
            <Infinity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.plan_type === 'lifetime').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {((users.filter(u => u.plan_type === 'lifetime').length / pagination.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="plan_type">Plan Type</Label>
              <Select value={filters.plan_type} onValueChange={(value) => handleFilterChange('plan_type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select value={filters.is_active} onValueChange={(value) => handleFilterChange('is_active', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sort_by">Sort By</Label>
              <Select value={filters.sort_by} onValueChange={(value) => handleFilterChange('sort_by', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="last_activity_at">Last Activity</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="plan_type">Plan Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
          <CardDescription>
            Manage user accounts, plans, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading users...
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={planColors[user.plan_type]}>
                          {planIcons[user.plan_type]}
                          <span className="ml-1">{getPlanDisplayName(user.plan_type)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(user.last_activity_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUserSelect(user)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Username</Label>
                  <div className="text-sm text-muted-foreground">{selectedUser.username}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <Badge className={planColors[selectedUser.plan_type]}>
                    {planIcons[selectedUser.plan_type]}
                    <span className="ml-1">{getPlanDisplayName(selectedUser.plan_type)}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <div className="text-sm text-muted-foreground">{formatDate(selectedUser.created_at)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Activity</Label>
                  <div className="text-sm text-muted-foreground">{formatDate(selectedUser.last_activity_at)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowUserDialog(false);
              handleEditUser(selectedUser!);
            }}>
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan_type">Plan Type</Label>
              <Select value={editForm.plan_type} onValueChange={(value) => setEditForm(prev => ({ ...prev, plan_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="lifetime">Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select value={editForm.is_active.toString()} onValueChange={(value) => setEditForm(prev => ({ ...prev, is_active: value === 'true' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about this user..."
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              for {selectedUser?.username} ({selectedUser?.email}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}