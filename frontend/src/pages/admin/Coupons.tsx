import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, Plus, Gift, Calendar, Users } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  plan_type: 'free' | 'basic' | 'advanced' | 'pro';
  usage_limit: number;
  used_count: number;
  expires_at: string | null;
  created_at: string;
  usage_history: Array<{
    used_at: string;
    user_email: string;
  }>;
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    plan_type: 'basic' as 'free' | 'basic' | 'advanced' | 'pro',
    usage_limit: 1,
    expires_at: ''
  });

  const fetchCoupons = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/coupons', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch coupons');
      }

      const data = await response.json();
      setCoupons(data.coupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newCoupon,
          expires_at: newCoupon.expires_at || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create coupon');
      }

      setCreateDialogOpen(false);
      setNewCoupon({
        code: '',
        plan_type: 'basic',
        usage_limit: 1,
        expires_at: ''
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
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

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
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
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground">Create and manage discount coupons</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={fetchCoupons} 
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
                <DialogDescription>
                  Create a new discount coupon for users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Coupon Code</Label>
                  <Input
                    id="code"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    placeholder="e.g., WELCOME2024"
                  />
                </div>
                <div>
                  <Label htmlFor="plan_type">Plan Type</Label>
                  <Select value={newCoupon.plan_type} onValueChange={(value: any) => setNewCoupon({ ...newCoupon, plan_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="1"
                    max="1000"
                    value={newCoupon.usage_limit}
                    onChange={(e) => setNewCoupon({ ...newCoupon, usage_limit: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">Expires At (Optional)</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={newCoupon.expires_at}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCoupon} disabled={!newCoupon.code}>
                  Create Coupon
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5" />
            <span>Coupons ({coupons.length})</span>
          </CardTitle>
          <CardDescription>
            Manage discount coupons and track usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Recent Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <div className="font-mono font-medium">{coupon.code}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPlanBadgeVariant(coupon.plan_type)}>
                      {coupon.plan_type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{coupon.used_count}/{coupon.usage_limit}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isExpired(coupon.expires_at) ? (
                      <Badge variant="destructive">Expired</Badge>
                    ) : coupon.used_count >= coupon.usage_limit ? (
                      <Badge variant="secondary">Fully Used</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {coupon.expires_at ? (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className={isExpired(coupon.expires_at) ? 'text-red-500' : ''}>
                          {formatDate(coupon.expires_at)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(coupon.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.usage_history.length > 0 ? (
                      <div className="text-sm">
                        <div className="font-medium">{coupon.usage_history[0].user_email}</div>
                        <div className="text-muted-foreground">
                          {formatDate(coupon.usage_history[0].used_at)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No usage yet</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {coupons.length === 0 && (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No coupons found</h3>
              <p className="text-muted-foreground">Create your first coupon to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
