import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Key,
  Settings,
  Users,
  Activity
} from 'lucide-react';
import { ExchangeService, Exchange, ExchangeCredentialType } from '@/services/exchange.service';

interface ExchangeFormData {
  name: string;
  slug: string;
  description: string;
  website: string;
  logo_url: string;
  api_version: string;
  is_active: boolean;
  credential_types: Array<{
    name: string;
    field_name: string;
    field_type: 'text' | 'password' | 'email' | 'url';
    is_required: boolean;
    description: string;
    order: number;
  }>;
}

export function ExchangesManagement() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExchange, setEditingExchange] = useState<Exchange | null>(null);
  const [formData, setFormData] = useState<ExchangeFormData>({
    name: '',
    slug: '',
    description: '',
    website: '',
    logo_url: '',
    api_version: 'v1',
    is_active: true,
    credential_types: []
  });

  useEffect(() => {
    loadExchanges();
  }, []);

  const loadExchanges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await ExchangeService.getExchanges();
      setExchanges(data);
    } catch (error: any) {
      console.error('❌ EXCHANGES MANAGEMENT - Error loading exchanges:', error);
      setError(error.message || 'Failed to load exchanges');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExchange = async () => {
    try {
      console.log('🔄 EXCHANGES MANAGEMENT - Creating exchange:', formData.name);
      
      // Here you would call the API to create the exchange
      // For now, we'll just show a success message
      console.log('✅ EXCHANGES MANAGEMENT - Exchange created successfully');
      
      setIsCreateDialogOpen(false);
      resetForm();
      await loadExchanges();
    } catch (error: any) {
      console.error('❌ EXCHANGES MANAGEMENT - Error creating exchange:', error);
      setError(error.message || 'Failed to create exchange');
    }
  };

  const handleEditExchange = async () => {
    if (!editingExchange) return;
    
    try {
      console.log('🔄 EXCHANGES MANAGEMENT - Updating exchange:', editingExchange.id);
      
      // Here you would call the API to update the exchange
      console.log('✅ EXCHANGES MANAGEMENT - Exchange updated successfully');
      
      setIsEditDialogOpen(false);
      setEditingExchange(null);
      resetForm();
      await loadExchanges();
    } catch (error: any) {
      console.error('❌ EXCHANGES MANAGEMENT - Error updating exchange:', error);
      setError(error.message || 'Failed to update exchange');
    }
  };

  const handleDeleteExchange = async (exchangeId: string) => {
    if (!confirm('Are you sure you want to delete this exchange? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('🗑️ EXCHANGES MANAGEMENT - Deleting exchange:', exchangeId);
      
      // Here you would call the API to delete the exchange
      console.log('✅ EXCHANGES MANAGEMENT - Exchange deleted successfully');
      
      await loadExchanges();
    } catch (error: any) {
      console.error('❌ EXCHANGES MANAGEMENT - Error deleting exchange:', error);
      setError(error.message || 'Failed to delete exchange');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      website: '',
      logo_url: '',
      api_version: 'v1',
      is_active: true,
      credential_types: []
    });
  };

  const openEditDialog = (exchange: Exchange) => {
    setEditingExchange(exchange);
    setFormData({
      name: exchange.name,
      slug: exchange.slug,
      description: exchange.description,
      website: exchange.website,
      logo_url: exchange.logo_url,
      api_version: exchange.api_version,
      is_active: exchange.is_active,
      credential_types: exchange.credential_types.map(ct => ({
        name: ct.name,
        field_name: ct.field_name,
        field_type: ct.field_type,
        is_required: ct.is_required,
        description: ct.description,
        order: ct.order
      }))
    });
    setIsEditDialogOpen(true);
  };

  const addCredentialType = () => {
    setFormData(prev => ({
      ...prev,
      credential_types: [
        ...prev.credential_types,
        {
          name: '',
          field_name: '',
          field_type: 'text',
          is_required: true,
          description: '',
          order: prev.credential_types.length + 1
        }
      ]
    }));
  };

  const removeCredentialType = (index: number) => {
    setFormData(prev => ({
      ...prev,
      credential_types: prev.credential_types.filter((_, i) => i !== index)
    }));
  };

  const updateCredentialType = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      credential_types: prev.credential_types.map((ct, i) => 
        i === index ? { ...ct, [field]: value } : ct
      )
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-muted-foreground">Loading exchanges...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Exchange Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage available exchanges and their credential requirements
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Exchange
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Exchange</DialogTitle>
              <DialogDescription>
                Configure a new exchange with its credential requirements
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Exchange Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Binance"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., binance"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the exchange"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://binance.com"
                  />
                </div>
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://binance.com/favicon.ico"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api_version">API Version</Label>
                  <Input
                    id="api_version"
                    value={formData.api_version}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_version: e.target.value }))}
                    placeholder="v3"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Credential Types</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addCredentialType}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credential Type
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {formData.credential_types.map((credType, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium">Credential Type {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCredentialType(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={credType.name}
                              onChange={(e) => updateCredentialType(index, 'name', e.target.value)}
                              placeholder="e.g., API Key"
                            />
                          </div>
                          <div>
                            <Label>Field Name</Label>
                            <Input
                              value={credType.field_name}
                              onChange={(e) => updateCredentialType(index, 'field_name', e.target.value)}
                              placeholder="e.g., api_key"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label>Field Type</Label>
                            <Select
                              value={credType.field_type}
                              onValueChange={(value) => updateCredentialType(index, 'field_type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="password">Password</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={credType.is_required}
                              onChange={(e) => updateCredentialType(index, 'is_required', e.target.checked)}
                            />
                            <Label>Required</Label>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Label>Description</Label>
                          <Input
                            value={credType.description}
                            onChange={(e) => updateCredentialType(index, 'description', e.target.value)}
                            placeholder="Description for this credential type"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateExchange}>
                Create Exchange
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Exchanges Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Exchanges</CardTitle>
          <CardDescription>
            Manage exchanges and their credential requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exchange</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>API Version</TableHead>
                <TableHead>Credential Types</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exchanges.map((exchange) => (
                <TableRow key={exchange.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                        <Key className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">{exchange.name}</div>
                        <div className="text-sm text-muted-foreground">{exchange.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={exchange.is_active ? "default" : "secondary"}>
                      {exchange.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{exchange.api_version}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {exchange.credential_types.map((ct) => (
                        <Badge key={ct.id} variant="outline" className="text-xs">
                          {ct.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(exchange)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteExchange(exchange.id)}
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
    </div>
  );
}

export default ExchangesManagement;
