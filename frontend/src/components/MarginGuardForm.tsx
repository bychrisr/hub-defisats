// frontend/src/components/MarginGuardForm.tsx
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { MarginGuardConfig } from '@/stores/automationStore';

interface MarginGuardFormProps {
  config: MarginGuardConfig;
  setConfig: (newConfig: MarginGuardConfig) => void;
}

export const MarginGuardForm = ({ config, setConfig }: MarginGuardFormProps) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Margin Guard</h2>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Ativo</label>
        <Switch
          checked={config.enabled}
          onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Limite de Margem (%)</label>
        <Slider
          value={[config.threshold]}
          onValueChange={([value]) => setConfig({ ...config, threshold: value })}
          min={0.1}
          max={100}
          step={0.1}
          className="w-full"
        />
        <div className="text-sm text-gray-600">
          {config.threshold}% - Quando a posição atingir este percentual da distância até a liquidação, a ação será executada
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Ação a Executar</label>
        <Select
          value={config.action}
          onValueChange={(value: 'add_margin' | 'close_position' | 'reduce_position') => 
            setConfig({ ...config, action: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="add_margin">Adicionar Margem</SelectItem>
            <SelectItem value="close_position">Fechar Posição</SelectItem>
            <SelectItem value="reduce_position">Reduzir Posição</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.action === 'add_margin' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Valor de Margem (%)</label>
          <Slider
            value={[config.add_margin_amount || 20]}
            onValueChange={([value]) => setConfig({ ...config, add_margin_amount: value })}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="text-sm text-gray-600">
            {config.add_margin_amount}% - Percentual da margem atual que será adicionado
          </div>
        </div>
      )}

      {config.action === 'reduce_position' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Redução (%)</label>
          <Slider
            value={[config.reduce_percentage || 20]}
            onValueChange={([value]) => setConfig({ ...config, reduce_percentage: value })}
            min={1}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="text-sm text-gray-600">
            {config.reduce_percentage}% - Percentual da posição que será reduzido
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Como Funciona:</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• O sistema monitora suas posições ativas automaticamente</li>
          <li>• Quando a distância até a liquidação atingir {config.threshold}%, a ação será executada</li>
          <li>• A automação funciona 24/7 enquanto estiver ativa</li>
        </ul>
      </div>
    </div>
  );
};
