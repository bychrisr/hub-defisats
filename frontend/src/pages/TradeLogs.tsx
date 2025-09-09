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
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface TradeLog {
  id: string;
  user_id: string;
  automation_id: string | null;
  trade_id: string;
  status: string;
  error_message: string | null;
  executed_at: string;
  created_at: string;
  user: {
    email: string;
  };
  automation?: {
    type: string;
  };
}

export const TradeLogs = () => {
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTradeLog, setEditingTradeLog] = useState<TradeLog | null>(null);
  const [formData, setFormData] = useState({
    user_id: '',
    automation_id: '',
    trade_id: '',
    status: 'success',
    error_message: '',
    executed_at: new Date().toISOString(),
  });

  useEffect(() => {
    fetchTradeLogs();
  }, []);

  const fetchTradeLogs = async () => {
    try {
      const response = await axios.get('/api/trade-logs');
      setTradeLogs(response.data);
    } catch (error) {
      console.error('Error fetching trade logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        automation_id: formData.automation_id || null,
        error_message: formData.error_message || null,
      };
      if (editingTradeLog) {
        await axios.put(`/api/trade-logs/${editingTradeLog.id}`, data);
      } else {
        await axios.post('/api/trade-logs', data);
      }
      fetchTradeLogs();
      setDialogOpen(false);
      setEditingTradeLog(null);
      setFormData({
        user_id: '',
        automation_id: '',
        trade_id: '',
        status: 'success',
        error_message: '',
        executed_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving trade log:', error);
    }
  };

  const handleEdit = (tradeLog: TradeLog) => {
    setEditingTradeLog(tradeLog);
    setFormData({
      user_id: tradeLog.user_id,
      automation_id: tradeLog.automation_id || '',
      trade_id: tradeLog.trade_id,
      status: tradeLog.status,
      error_message: tradeLog.error_message || '',
      executed_at: tradeLog.executed_at,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this trade log?')) {
      try {
        await axios.delete(`/api/trade-logs/${id}`);
        fetchTradeLogs();
      } catch (error) {
        console.error('Error deleting trade log:', error);
      }
    }
  };

  const openCreateDialog = () => {
    setEditingTradeLog(null);
    setFormData({
      user_id: '',
      automation_id: '',
      trade_id: '',
      status: 'success',
      error_message: '',
      executed_at: new Date().toISOString(),
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
          <h1 className="text-3xl font-bold">Trade Logs</h1>
          <p className="text-muted-foreground">
            Monitor trading activities and executions
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Trade Log
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trade Logs List</CardTitle>
          <CardDescription>All recorded trading activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Trade ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Automation</TableHead>
                <TableHead>Executed At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tradeLogs.map(tradeLog => (
                <TableRow key={tradeLog.id}>
                  <TableCell>{tradeLog.user.email}</TableCell>
                  <TableCell>{tradeLog.trade_id}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tradeLog.status === 'success'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {tradeLog.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tradeLog.automation ? (
                      <Badge variant="outline">
                        {tradeLog.automation.type}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Manual</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(tradeLog.executed_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tradeLog)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(tradeLog.id)}
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
              {editingTradeLog ? 'Edit Trade Log' : 'Add Trade Log'}
            </DialogTitle>
            <DialogDescription>
              {editingTradeLog
                ? 'Update trade log details'
                : 'Record a new trade execution'}
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
                <Label htmlFor="trade_id">Trade ID</Label>
                <Input
                  id="trade_id"
                  value={formData.trade_id}
                  onChange={e =>
                    setFormData({ ...formData, trade_id: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="automation_id">Automation ID (optional)</Label>
                <Input
                  id="automation_id"
                  value={formData.automation_id}
                  onChange={e =>
                    setFormData({ ...formData, automation_id: e.target.value })
                  }
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
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="app_error">App Error</SelectItem>
                    <SelectItem value="exchange_error">
                      Exchange Error
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="error_message">Error Message (optional)</Label>
              <Input
                id="error_message"
                value={formData.error_message}
                onChange={e =>
                  setFormData({ ...formData, error_message: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="executed_at">Executed At</Label>
              <Input
                id="executed_at"
                type="datetime-local"
                value={formData.executed_at.slice(0, 16)}
                onChange={e =>
                  setFormData({
                    ...formData,
                    executed_at: new Date(e.target.value).toISOString(),
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
                {editingTradeLog ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
