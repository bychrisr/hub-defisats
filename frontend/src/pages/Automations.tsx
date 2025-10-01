import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bot, Plus, Edit, Trash2, Play, Pause, CheckCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data para demonstração
const mockAutomations = [
  {
    id: '1',
    name: 'Margin Guard',
    type: 'margin_guard',
    is_active: true,
    created_at: '2024-01-15',
  },
  {
    id: '2',
    name: 'TP/SL Tracker',
    type: 'tp_sl',
    is_active: false,
    created_at: '2024-01-10',
  },
  {
    id: '3',
    name: 'DCA Bot',
    type: 'dca',
    is_active: true,
    created_at: '2024-01-05',
  },
];

export const Automations = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'all'>('all');

  const getFilteredAutomations = () => {
    switch (activeTab) {
      case 'active':
        return mockAutomations.filter(automation => automation.is_active === true);
      case 'inactive':
        return mockAutomations.filter(automation => automation.is_active === false);
      case 'all':
      default:
        return mockAutomations;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-text-primary to-text-primary/80 bg-clip-text text-transparent">
                  Automations
                </h1>
                <p className="text-text-secondary">Manage trading automations and bots</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="gradient-card-blue backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-500" />
                Total Automations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {mockAutomations.length}
              </div>
              <p className="text-xs text-text-secondary">
                All configured automations
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card-green backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Play className="h-4 w-4 text-green-500" />
                Active Automations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {mockAutomations.filter(a => a.is_active).length}
              </div>
              <p className="text-xs text-text-secondary">
                Currently running
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card-orange backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pause className="h-4 w-4 text-orange-500" />
                Inactive Automations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                {mockAutomations.filter(a => !a.is_active).length}
              </div>
              <p className="text-xs text-text-secondary">
                Paused or stopped
              </p>
            </CardContent>
          </Card>
          
          <Card className="gradient-card-purple backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl profile-sidebar-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-text-primary">
                95.2%
              </div>
              <p className="text-xs text-text-secondary">
                Last 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Automations Table */}
        <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl profile-sidebar-glow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Automations List</CardTitle>
                <CardDescription className="text-text-secondary">
                  All configured automations and their status
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value: 'active' | 'inactive' | 'all') => setActiveTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Active ({mockAutomations.filter(a => a.is_active).length})
                </TabsTrigger>
                <TabsTrigger value="inactive" className="flex items-center gap-2">
                  <Pause className="h-4 w-4" />
                  Inactive ({mockAutomations.filter(a => !a.is_active).length})
                </TabsTrigger>
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  All ({mockAutomations.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-6">
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="text-text-primary font-semibold">Name</TableHead>
                        <TableHead className="text-text-primary font-semibold">Type</TableHead>
                        <TableHead className="text-text-primary font-semibold">Status</TableHead>
                        <TableHead className="text-text-primary font-semibold">Created</TableHead>
                        <TableHead className="text-text-primary font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredAutomations().map((automation, index) => (
                        <TableRow 
                          key={automation.id}
                          className={cn(
                            "border-border/50 hover:bg-card/50 transition-colors",
                            index % 2 === 0 ? "bg-card/20" : "bg-card/10"
                          )}
                        >
                          <TableCell className="font-medium text-text-primary">
                            {automation.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                              {automation.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "border-green-500/30",
                                automation.is_active 
                                  ? "bg-green-500/20 text-green-400" 
                                  : "bg-red-500/20 text-red-400"
                              )}
                            >
                              {automation.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {new Date(automation.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "transition-all duration-200",
                                  automation.is_active 
                                    ? "hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30" 
                                    : "hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30"
                                )}
                              >
                                {automation.is_active ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30 transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all duration-200"
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};