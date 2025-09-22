import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  RefreshCw, 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Eye, 
  Crown, 
  Trash2,
  Users,
  BarChart3,
  Loader2,
  Shield,
  Activity
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { apiGet } from '@/lib/fetch';
import UserUpgradeModal from '@/components/admin/UserUpgradeModal';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  username: string;
  plan_type: 'free' | 'basic' | 'advanced' | 'pro' | 'lifetime';
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
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null
  });

  // Ref para controlar se é o carregamento inicial
  const isInitialLoad = useRef(true);
  const lastFilters = useRef(filters);

  const fetchUsers = async (page = 1, limit = 20) => {
    try {
      console.log('🔍 USERS COMPONENT - Starting fetchUsers', { page, limit, filters });
      setRefreshing(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
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

  // Apenas carrega uma vez no início
  useEffect(() => {
    console.log('🔍 USERS COMPONENT - Initial load useEffect triggered');
    fetchUsers();
    isInitialLoad.current = false;
  }, []);

  // Recarrega quando os filtros mudam (mas não em loop)
  useEffect(() => {
    console.log('🔍 USERS COMPONENT - Filter change useEffect triggered', { 
      isInitialLoad: isInitialLoad.current,
      filters: { search: filters.search, plan_type: filters.plan_type, is_active: filters.is_active },
      lastFilters: lastFilters.current
    });
    
    // Só executa se não for o carregamento inicial e se os filtros realmente mudaram
    if (!isInitialLoad.current) {
      const filtersChanged = 
        lastFilters.current.search !== filters.search ||
        lastFilters.current.plan_type !== filters.plan_type ||
        lastFilters.current.is_active !== filters.is_active;
      
      if (filtersChanged) {
        console.log('🔍 USERS COMPONENT - Filters changed, executing fetchUsers');
        lastFilters.current = { ...filters };
        fetchUsers();
      }
    }
  }, [filters.search, filters.plan_type, filters.is_active]);

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      console.log('🔍 USERS COMPONENT - Toggling user status for:', userId);
      
      const response = await fetch(`/api/admin/users/${userId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
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

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o usuário ${userEmail}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      console.log('🗑️ USERS COMPONENT - Deleting user:', userId);
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      console.log('🗑️ USERS COMPONENT - Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ USERS COMPONENT - Delete error:', errorData);
        throw new Error(`Failed to delete user: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ USERS COMPONENT - User deleted successfully:', result);

      // Refresh the users list
      fetchUsers(pagination.page);
    } catch (error) {
      console.error('❌ USERS COMPONENT - Error deleting user:', error);
    }
  };

  const handleOpenUpgradeModal = (user: User) => {
    setUpgradeModal({
      isOpen: true,
      user
    });
  };

  const handleCloseUpgradeModal = () => {
    setUpgradeModal({
      isOpen: false,
      user: null
    });
  };

  const handleUpgradeSuccess = async () => {
    console.log('✅ USERS COMPONENT - Upgrade successful, refreshing users list');
    await fetchUsers(pagination.page);
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="backdrop-blur-xl bg-card/50 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl"></div>
                    <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-text-primary">Loading Users</h3>
                    <p className="text-sm text-text-secondary">Fetching user data...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 rounded-2xl blur-3xl"></div>
            <Card className="relative backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                          User Management
                        </h1>
                        <p className="text-text-secondary">Manage users, plans, and account status</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => fetchUsers(pagination.page)} 
                    disabled={refreshing}
                    className="backdrop-blur-sm bg-primary/90 hover:bg-primary text-white shadow-lg shadow-primary/25"
                    size="sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <Filter className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Filters</CardTitle>
              </div>
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
          <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold">Users ({pagination.total})</CardTitle>
                  <CardDescription className="text-text-secondary">
                    Showing {users.length} of {pagination.total} users
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border border-border/50">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-background/50 to-background/30 backdrop-blur-sm">
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          User
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Plan
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Status
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Created
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Last Activity
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-text-primary w-[50px]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow 
                        key={user.id}
                        className={cn(
                          "hover:bg-background/50 transition-colors duration-200",
                          index % 2 === 0 ? "bg-background/20" : "bg-background/10"
                        )}
                      >
                        <TableCell className="font-medium text-text-primary">
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-sm text-text-secondary">@{user.username}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={getPlanBadgeVariant(user.plan_type)}
                            className={cn(
                              "font-semibold px-3 py-1 rounded-full border-0",
                              user.plan_type === 'lifetime' 
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/25'
                                : user.plan_type === 'pro'
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                                  : user.plan_type === 'advanced'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                                    : user.plan_type === 'basic'
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25'
                                      : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg shadow-gray-500/25'
                            )}
                          >
                            {user.plan_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={user.is_active ? 'default' : 'secondary'}
                            className={cn(
                              "font-semibold px-3 py-1 rounded-full border-0",
                              user.is_active 
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/25'
                                : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/25'
                            )}
                          >
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-lg">
                        <DropdownMenuItem 
                          className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          onClick={() => {/* TODO: Implement view details */}}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          onClick={() => handleOpenUpgradeModal(user)}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          Mudar Plano
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                          onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground text-destructive"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
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

          {/* Modal de Upgrade */}
          <UserUpgradeModal
            user={upgradeModal.user}
            isOpen={upgradeModal.isOpen}
            onClose={handleCloseUpgradeModal}
            onSuccess={handleUpgradeSuccess}
          />
        </div>
      </div>
    </div>
  );
}

