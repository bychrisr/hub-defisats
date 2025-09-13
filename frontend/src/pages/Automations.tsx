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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import axios from 'axios';

interface Automation {
  id: string;
  user_id: string;
  type: string;
  config: any;
  is_active: boolean;
  created_at: string;
  user: {
    email: string;
  };
}

export const Automations = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(
    null
  );
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'margin_guard',
    config: '{}',
    is_active: true,
  });

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      const response = await axios.get('/api/automations');
      setAutomations(response.data);
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        config: JSON.parse(formData.config),
      };
      if (editingAutomation) {
        await axios.put(`/api/automations/${editingAutomation.id}`, data);
      } else {
        await axios.post('/api/automations', data);
      }
      fetchAutomations();
      setDialogOpen(false);
      setEditingAutomation(null);
      setFormData({
        user_id: '',
        type: 'margin_guard',
        config: '{}',
        is_active: true,
      });
    } catch (error) {
      console.error('Error saving automation:', error);
    }
  };

  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormData({
      user_id: automation.user_id,
      type: automation.type,
      config: JSON.stringify(automation.config, null, 2),
      is_active: automation.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this automation?')) {
      try {
        await axios.delete(`/api/automations/${id}`);
        fetchAutomations();
      } catch (error) {
        console.error('Error deleting automation:', error);
      }
    }
  };

  const openCreateDialog = () => {
    setEditingAutomation(null);
    setFormData({
      user_id: '',
      type: 'margin_guard',
      config: '{}',
      is_active: true,
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
          <h1 className="text-3xl font-bold">Automations</h1>
          <p className="text-muted-foreground">Manage trading automations</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Automation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Automations List</CardTitle>
          <CardDescription>All configured automations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automations.map(automation => (
                <TableRow key={automation.id}>
                  <TableCell>{automation.user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{automation.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={automation.is_active ? 'default' : 'secondary'}
                    >
                      {automation.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(automation.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(automation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(automation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAutomation ? 'Edit Automation' : 'Add Automation'}
            </DialogTitle>
            <DialogDescription>
              {editingAutomation
                ? 'Update automation settings'
                : 'Create a new automation'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={value =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="margin_guard">Margin Guard</SelectItem>
                  <SelectItem value="tp_sl">Take Profit / Stop Loss</SelectItem>
                  <SelectItem value="auto_entry">Auto Entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={formData.config}
                onChange={e =>
                  setFormData({ ...formData, config: e.target.value })
                }
                rows={6}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={e =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
              />
              <Label htmlFor="is_active">Active</Label>
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
                {editingAutomation ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
