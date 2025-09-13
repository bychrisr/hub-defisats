import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, Search, Filter, MoreHorizontal, UserCheck, UserX, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiGet } from '@/lib/fetch';

interface User {
  id: string;
  email: string;
  username: string;
  plan_type: 'free' | 'basic' | 'advanced' | 'pro';
  is_active: boolean;
  created_at: string;
  last_activity_at: string | null;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    plan_type: 'all',
    is_active: 'all'
  });

  const fetchUsers = async (page = 1) => {
    try {
      console.log('🔍 USERS COMPONENT - Starting fetchUsers');
      setRefreshing(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.plan_type && filters.plan_type !== 'all' && { plan_type: filters.plan_type }),
        ...(filters.is_active && filters.is_active !== 'all' && { is_active: filters.is_active })
      });

      console.log('🔍 USERS COMPONENT - Making API request to:', `/api/admin/users?${params}`);
      const response = await apiGet(`/api/admin/users?${params}`);
      console.log('🔍 USERS COMPONENT - Response received:', response.status);
      
      const data: UsersResponse = await response.json();
      console.log('🔍 USERS COMPONENT - Data received:', { usersCount: data.users.length, pagination: data.pagination });
      
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('❌ USERS COMPONENT - Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      console.log('🔍 USERS COMPONENT - Toggling user status for:', userId);
      
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 USERS COMPONENT - Toggle response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ USERS COMPONENT - Toggle error:', errorData);
        throw new Error(`Failed to toggle user status: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ USERS COMPONENT - User status toggled successfully:', result);

      // Refresh the users list
      fetchUsers(pagination.page);
    } catch (error) {
      console.error('❌ USERS COMPONENT - Error toggling user status:', error);
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'default';
      case 'advanced':
        return 'secondary';
      case 'basic':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, plans, and account status</p>
        </div>
        <Button 
          onClick={() => fetchUsers(pagination.page)} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.plan_type} onValueChange={(value) => setFilters({ ...filters, plan_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Plans" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.is_active} onValueChange={(value) => setFilters({ ...filters, is_active: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => setFilters({ search: '', plan_type: 'all', is_active: 'all' })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({pagination.total})</CardTitle>
          <CardDescription>
            Showing {users.length} of {pagination.total} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(user.plan_type)}>
                      {user.plan_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(user.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {user.last_activity_at ? formatDate(user.last_activity_at) : 'Never'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
