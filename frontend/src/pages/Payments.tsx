import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, CreditCard } from 'lucide-react';
import axios from 'axios';
import SatsIcon from '@/components/SatsIcon';

interface Payment {
  id: string;
  user_id: string;
  plan_type: string;
  amount_sats: number;
  lightning_invoice: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  user: {
    email: string;
  };
}

export const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    plan_type: 'free',
    amount_sats: 0,
    lightning_invoice: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/api/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        paid_at: formData.status === 'paid' ? new Date().toISOString() : null,
      };
      if (editingPayment) {
        await axios.put(`/api/payments/${editingPayment.id}`, data);
      } else {
        await axios.post('/api/payments', data);
      }
      fetchPayments();
      setDialogOpen(false);
      setEditingPayment(null);
      setFormData({
        user_id: '',
        plan_type: 'free',
        amount_sats: 0,
        lightning_invoice: '',
        status: 'pending',
      });
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setFormData({
      user_id: payment.user_id,
      plan_type: payment.plan_type,
      amount_sats: payment.amount_sats,
      lightning_invoice: payment.lightning_invoice,
      status: payment.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment?')) {
      try {
        await axios.delete(`/api/payments/${id}`);
        fetchPayments();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
  };

  const openCreateDialog = () => {
    setEditingPayment(null);
    setFormData({
      user_id: '',
      plan_type: 'free',
      amount_sats: 0,
      lightning_invoice: '',
      status: 'pending',
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Manage Lightning Network payments and subscriptions
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments List</CardTitle>
          <CardDescription>
            All payment transactions and subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount (sats)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.plan_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1">
                      {payment.amount_sats.toLocaleString()}
                      <SatsIcon size={16} className="text-orange-500" />
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        payment.status === 'paid'
                          ? 'default'
                          : payment.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment.paid_at
                      ? new Date(payment.paid_at).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(payment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(payment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPayment ? 'Edit Payment' : 'Add Payment'}
            </DialogTitle>
            <DialogDescription>
              {editingPayment
                ? 'Update payment details'
                : 'Record a new payment transaction'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="user_id">User ID</Label>
                <Input
                  id="user_id"
                  value={formData.user_id}
                  onChange={e =>
                    setFormData({ ...formData, user_id: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="plan_type">Plan Type</Label>
                <Select
                  value={formData.plan_type}
                  onValueChange={value =>
                    setFormData({ ...formData, plan_type: value })
                  }
                >
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount_sats">Amount (sats)</Label>
                <Input
                  id="amount_sats"
                  type="number"
                  value={formData.amount_sats}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      amount_sats: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={value =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="lightning_invoice">Lightning Invoice</Label>
              <Input
                id="lightning_invoice"
                value={formData.lightning_invoice}
                onChange={e =>
                  setFormData({
                    ...formData,
                    lightning_invoice: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingPayment ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
