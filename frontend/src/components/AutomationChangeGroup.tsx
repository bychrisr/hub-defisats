import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  Calendar,
  Clock,
  Activity,
  Users
} from 'lucide-react';
import { ConfigChangeDisplay } from './ConfigChangeDisplay';

interface AutomationChange {
  id: string;
  action: string;
  automation_id: string;
  old_state: boolean;
  new_state: boolean;
  config_changes: {
    old: Record<string, any>;
    new: Record<string, any>;
  };
  automation_type: string;
  change_type: string;
  reason: string;
  timestamp: string;
}

interface AutomationChangeGroupProps {
  date: string;
  changes: AutomationChange[];
}

export const AutomationChangeGroup: React.FC<AutomationChangeGroupProps> = ({
  date,
  changes
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Estatísticas do grupo
  const getGroupStats = () => {
    const activations = changes.filter(c => c.change_type === 'activation').length;
    const deactivations = changes.filter(c => c.change_type === 'deactivation').length;
    const configUpdates = changes.filter(c => c.change_type === 'config_update').length;
    
    return { activations, deactivations, configUpdates };
  };

  const stats = getGroupStats();

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  // Resumo do grupo
  const getGroupSummary = () => {
    const summaries = [];
    
    if (stats.activations > 0) {
      summaries.push(`${stats.activations} activation${stats.activations > 1 ? 's' : ''}`);
    }
    if (stats.deactivations > 0) {
      summaries.push(`${stats.deactivations} deactivation${stats.deactivations > 1 ? 's' : ''}`);
    }
    if (stats.configUpdates > 0) {
      summaries.push(`${stats.configUpdates} update${stats.configUpdates > 1 ? 's' : ''}`);
    }
    
    return summaries.join(', ');
  };

  return (
    <Card className="backdrop-blur-xl bg-card/30 border-border/50 shadow-lg">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-background/20 transition-colors py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {formatDate(date)}
                  </CardTitle>
                  <p className="text-sm text-text-secondary">
                    {getGroupSummary()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {stats.activations > 0 && (
                    <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                      {stats.activations} activated
                    </Badge>
                  )}
                  {stats.deactivations > 0 && (
                    <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                      {stats.deactivations} deactivated
                    </Badge>
                  )}
                  {stats.configUpdates > 0 && (
                    <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                      {stats.configUpdates} updated
                    </Badge>
                  )}
                </div>
                
                <Button variant="ghost" size="sm" className="p-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-3">
            <div className="space-y-2">
              {changes.map((change) => (
                <ConfigChangeDisplay
                  key={change.id}
                  configChanges={change.config_changes}
                  automationType={change.automation_type}
                  changeType={change.change_type}
                  timestamp={change.timestamp}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
