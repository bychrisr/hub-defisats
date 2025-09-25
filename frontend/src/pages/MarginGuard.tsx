import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Shield,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  Trash2,
} from 'lucide-react';
import { useAutomationStore } from '@/stores/automation';
import { toast } from 'sonner';

const marginGuardSchema = z.object({
  margin_threshold: z.number().min(0.1).max(100),
  action: z.enum(['close_position', 'reduce_position', 'add_margin']),
  reduce_percentage: z.number().min(1).max(100).optional(), // Now used as margin increase percentage
  add_margin_amount: z.number().min(0).optional(),
  enabled: z.boolean(),
});

type MarginGuardForm = z.infer<typeof marginGuardSchema>;

export default function MarginGuard() {
  const [isEditing, setIsEditing] = useState(false);
  const {
    automations,
    fetchAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    isLoading,
    error,
  } = useAutomationStore();

  const marginGuardAutomation = automations.find(
    a => a.type === 'margin_guard'
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<MarginGuardForm>({
    resolver: zodResolver(marginGuardSchema),
    defaultValues: {
      margin_threshold: 20,
      action: 'close_position',
      reduce_percentage: 50,
      add_margin_amount: 0,
      enabled: true,
    },
  });

  const selectedAction = watch('action');

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  useEffect(() => {
    if (marginGuardAutomation) {
      reset({
        margin_threshold: marginGuardAutomation.config.margin_threshold,
        action: marginGuardAutomation.config.action,
        reduce_percentage: marginGuardAutomation.config.reduce_percentage,
        add_margin_amount: marginGuardAutomation.config.add_margin_amount,
        enabled: marginGuardAutomation.is_active,
      });
    }
  }, [marginGuardAutomation, reset]);

  const onSubmit = async (data: MarginGuardForm) => {
    try {
      if (marginGuardAutomation) {
        await updateAutomation(marginGuardAutomation.id, {
          config: data,
        });
        toast.success('Margin Guard updated successfully');
      } else {
        await createAutomation({
          type: 'margin_guard',
          config: data,
        });
        toast.success('Margin Guard created successfully');
      }
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save Margin Guard');
    }
  };

  const handleToggle = async () => {
    if (marginGuardAutomation) {
      try {
        const toggledAutomation = await toggleAutomation(marginGuardAutomation.id);
        toast.success(
          toggledAutomation.is_active
            ? 'Margin Guard activated'
            : 'Margin Guard deactivated'
        );
      } catch (error: any) {
        toast.error(error.message || 'Failed to toggle Margin Guard');
      }
    }
  };

  const handleDelete = async () => {
    if (
      marginGuardAutomation &&
      confirm('Are you sure you want to delete this Margin Guard?')
    ) {
      try {
        await deleteAutomation(marginGuardAutomation.id);
        toast.success('Margin Guard deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete Margin Guard');
      }
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'close_position':
        return 'Close the entire position when price reaches threshold';
      case 'reduce_position':
        return 'Reduce position size by specified percentage';
      case 'add_margin':
        return 'Add percentage of current margin to increase liquidation distance (Recommended)';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Margin Guard</h1>
            <p className="text-gray-600">
              Protect your positions from liquidation
            </p>
          </div>
          {marginGuardAutomation && (
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  marginGuardAutomation.is_active ? 'default' : 'secondary'
                }
              >
                {marginGuardAutomation.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggle}
                disabled={isLoading}
              >
                {marginGuardAutomation.is_active ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="h-5 w-5" />
                      <span>Configuration</span>
                    </CardTitle>
                    <CardDescription>
                      Set up your margin protection parameters
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditing(false);
                            reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSubmit(onSubmit)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Save'
                          )}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="margin_threshold">
                      Margin Threshold (%)
                    </Label>
                    <Input
                      id="margin_threshold"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      placeholder="20"
                      {...register('margin_threshold', { valueAsNumber: true })}
                      className={
                        errors.margin_threshold ? 'border-red-500' : ''
                      }
                      disabled={!isEditing}
                    />
                    {errors.margin_threshold && (
                      <p className="text-sm text-red-500">
                        {errors.margin_threshold.message}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Trigger action when price reaches this percentage of distance to liquidation
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="action">Action</Label>
                    <Select
                      value={selectedAction}
                      onValueChange={value => setValue('action', value as any)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="close_position">
                          Close Position
                        </SelectItem>
                        <SelectItem value="reduce_position">
                          Reduce Position
                        </SelectItem>
                        <SelectItem value="add_margin">Add Margin (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-600">
                      {getActionDescription(selectedAction)}
                    </p>
                  </div>

                  {selectedAction === 'reduce_position' && (
                    <div className="space-y-2">
                      <Label htmlFor="reduce_percentage">
                        Reduce Percentage (%)
                      </Label>
                      <Input
                        id="reduce_percentage"
                        type="number"
                        step="1"
                        min="1"
                        max="100"
                        placeholder="50"
                        {...register('reduce_percentage', {
                          valueAsNumber: true,
                        })}
                        className={
                          errors.reduce_percentage ? 'border-red-500' : ''
                        }
                        disabled={!isEditing}
                      />
                      {errors.reduce_percentage && (
                        <p className="text-sm text-red-500">
                          {errors.reduce_percentage.message}
                        </p>
                      )}
                    </div>
                  )}

                  {selectedAction === 'add_margin' && (
                    <div className="space-y-2">
                      <Label htmlFor="reduce_percentage">
                        Margin Increase Percentage (%)
                      </Label>
                      <Input
                        id="reduce_percentage"
                        type="number"
                        step="1"
                        min="1"
                        max="100"
                        placeholder="20"
                        {...register('reduce_percentage', {
                          valueAsNumber: true,
                        })}
                        className={
                          errors.reduce_percentage ? 'border-red-500' : ''
                        }
                        disabled={!isEditing}
                      />
                      {errors.reduce_percentage && (
                        <p className="text-sm text-red-500">
                          {errors.reduce_percentage.message}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Add this percentage of current margin to increase liquidation distance
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enabled"
                      checked={watch('enabled')}
                      onCheckedChange={checked => setValue('enabled', checked)}
                      disabled={!isEditing}
                    />
                    <Label htmlFor="enabled">Enable Margin Guard</Label>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Status and Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {marginGuardAutomation ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge
                        variant={
                          marginGuardAutomation.is_active
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {marginGuardAutomation.is_active
                          ? 'Active'
                          : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Threshold</span>
                      <span className="text-sm">
                        {marginGuardAutomation.config.margin_threshold}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Action</span>
                      <span className="text-sm capitalize">
                        {marginGuardAutomation.config.action.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Created</span>
                      <span className="text-sm">
                        {new Date(
                          marginGuardAutomation.created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      No Margin Guard configured
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Create one to protect your positions
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions Card */}
            {marginGuardAutomation && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleToggle}
                    disabled={isLoading}
                  >
                    {marginGuardAutomation.is_active ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsEditing(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Configuration
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={handleDelete}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>How Margin Guard Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Monitor</h4>
                <p className="text-sm text-gray-600">
                  Continuously monitors your margin level across all positions
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Alert</h4>
                <p className="text-sm text-gray-600">
                  Triggers when margin falls below your specified threshold
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Protect</h4>
                <p className="text-sm text-gray-600">
                  Executes your chosen action to prevent liquidation
                </p>
              </div>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Margin Guard is a safety mechanism
                but cannot guarantee protection against all market conditions.
                Always monitor your positions and maintain adequate margin
                levels.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
