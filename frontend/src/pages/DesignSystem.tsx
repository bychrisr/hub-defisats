import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import AutomationCard from '@/components/ui/AutomationCard';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Sun, 
  Moon, 
  Monitor,
  User,
  Bell,
  Search,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Home,
  BarChart3,
  Shield,
  Zap,
  Palette,
  Type,
  MousePointer,
  FileText,
  Square,
  Tag,
  AlertCircle,
  Star,
  Sparkles,
  Layout,
  Navigation,
  Layers,
  Menu,
  X,
  Play,
  Package,
  Settings,
  Grid3X3,
  Code,
  Copy,
  Check,
  Trash2,
  Download,
  Upload,
  Share,
  Pause,
  RefreshCw,
  Save,
  File,
  Folder,
  Image,
  Video,
  Music,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  TrendingDown,
  PieChart,
  Activity,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  BatteryFull,
  Volume2,
  VolumeX,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Loader2,
  Mail,
  Heart,
  Edit,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function DesignSystem() {
  const { theme } = useTheme();
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [activeSection, setActiveSection] = useState('getting-started');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: Play },
    { id: 'layout', title: 'Layout', icon: Layout },
    { id: 'typography', title: 'Typography', icon: Type },
    { id: 'colors', title: 'Colors', icon: Palette },
    { id: 'components', title: 'Components', icon: Package },
    { id: 'buttons', title: 'Buttons', icon: MousePointer },
    { id: 'forms', title: 'Forms', icon: FileText },
    { id: 'cards', title: 'Cards', icon: Square },
    { id: 'badges', title: 'Badges', icon: Tag },
    { id: 'alerts', title: 'Alerts', icon: AlertCircle },
    { id: 'navigation', title: 'Navigation', icon: Navigation },
    { id: 'tabs', title: 'Tabs', icon: Layers },
    { id: 'icons', title: 'Icons', icon: Star },
    { id: 'glassmorphism', title: 'Glassmorphism', icon: Sparkles },
    { id: 'utilities', title: 'Utilities', icon: Settings },
    { id: 'spacing', title: 'Spacing', icon: Grid3X3 }
  ];
  const [radioValue, setRadioValue] = useState('option1');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Detect active section using Intersection Observer for better performance
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Trigger when section is 20% from top
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      // Find the entry with the highest intersection ratio
      let mostVisible = null;
      let highestRatio = 0;
      
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
          mostVisible = entry;
          highestRatio = entry.intersectionRatio;
        }
      });
      
      if (mostVisible) {
        setActiveSection(mostVisible.target.id);
      }
    }, observerOptions);

    // Observe all sections
    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    // Calculate scroll progress and handle fallback for top of page
    const handleScroll = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / documentHeight) * 100;
      setScrollProgress(Math.min(progress, 100));
      
      // Fallback: if we're at the top of the page, set first section as active
      if (window.scrollY < 100) {
        setActiveSection(sections[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const CodeExample = ({ code, language = 'jsx' }: { code: string; language?: string }) => (
    <div className="relative">
      <pre className="bg-bg-card border border-border rounded-lg p-4 overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code)}
      >
        {copiedCode === code ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-bg-primary border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-text-primary">Design System</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-text-primary"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Fixed on desktop, overlay on mobile */}
        <div className={cn(
          "design-system-sidebar bg-bg-card border-r border-border transition-transform duration-300 lg:shadow-lg",
          sidebarOpen ? "open" : ""
        )}>
          {/* Progress Bar */}
          <div className="h-1 bg-border">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>
          
          <div className="p-6 h-full overflow-y-auto">
            <div className="mb-6 hidden lg:block">
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Axisor UI Docs
              </h2>
              <p className="text-xs text-text-secondary">
                Design System Documentation
              </p>
            </div>
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group",
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-text-secondary hover:text-text-primary hover:bg-primary/10"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      activeSection === section.id 
                        ? "text-primary-foreground" 
                        : "text-text-secondary group-hover:text-primary"
                    )} />
                    <span className="text-sm font-medium truncate">{section.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content - With left margin for fixed sidebar */}
        <div className="design-system-content min-h-screen">
          <div className="container mx-auto py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-8">
        {/* Getting Started */}
        <div id="getting-started" className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-text-primary">Axisor UI Docs</h1>
            <p className="text-text-secondary text-lg max-w-3xl mx-auto">
              Documentação completa dos componentes e padrões visuais do Axisor Bot. 
              Um design system moderno e responsivo para aplicações de trading e automação.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="text-sm">
                Tema Atual: {theme === 'dark' ? 'Escuro' : 'Claro'}
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Mobile-First
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Dark Mode
              </Badge>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Quick Start
              </CardTitle>
              <CardDescription>
                Comece rapidamente com o Axisor UI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-text-primary">Instalação</h4>
                <p className="text-text-secondary">
                  O Axisor UI é baseado em Tailwind CSS e React. Todos os componentes estão prontos para uso.
                </p>
                <CodeExample code={`// Importar componentes
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Usar em seu componente
function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Meu Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Clique aqui</Button>
      </CardContent>
    </Card>
  );
}`} />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-text-primary">Tema</h4>
                <p className="text-text-secondary">
                  O sistema suporta dark mode automático baseado nas preferências do usuário.
                </p>
                <CodeExample code={`// Usar contexto de tema
import { useTheme } from '@/contexts/ThemeContext';

function ThemedComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={cn(
      "p-4 rounded-lg",
      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
    )}>
      <p>Tema atual: {theme}</p>
      <Button onClick={toggleTheme}>
        Alternar tema
      </Button>
    </div>
  );
}`} />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-text-primary">Responsividade</h4>
                <p className="text-text-secondary">
                  Todos os componentes são mobile-first e se adaptam automaticamente a diferentes tamanhos de tela.
                </p>
                <CodeExample code={`// Classes responsivas
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="p-4">
    <h3 className="text-lg font-semibold">Card 1</h3>
  </Card>
  <Card className="p-4">
    <h3 className="text-lg font-semibold">Card 2</h3>
  </Card>
  <Card className="p-4">
    <h3 className="text-lg font-semibold">Card 3</h3>
  </Card>
</div>`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout */}
        <div id="layout" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Layout
              </CardTitle>
              <CardDescription>
                Sistema de layout responsivo e containers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Containers</h4>
                <p className="text-text-secondary">
                  Containers são elementos fundamentais para centralizar e limitar a largura do conteúdo.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-bg-card rounded-lg border border-border">
                    <h5 className="font-medium text-text-primary mb-2">Container Padrão</h5>
                    <div className="bg-primary/10 p-4 rounded text-center">
                      <code className="text-sm">container mx-auto</code>
                    </div>
                  </div>
                  <div className="p-4 bg-bg-card rounded-lg border border-border">
                    <h5 className="font-medium text-text-primary mb-2">Container Fluid</h5>
                    <div className="bg-primary/10 p-4 rounded text-center">
                      <code className="text-sm">w-full</code>
                    </div>
                  </div>
                </div>
                <CodeExample code={`// Container padrão (centralizado com max-width)
<div className="container mx-auto px-4">
  <h1>Conteúdo centralizado</h1>
</div>

// Container fluid (largura total)
<div className="w-full px-4">
  <h1>Conteúdo de largura total</h1>
</div>

// Container com max-width específico
<div className="max-w-4xl mx-auto px-4">
  <h1>Conteúdo limitado a 4xl</h1>
</div>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Grid System</h4>
                <p className="text-text-secondary">
                  Sistema de grid responsivo baseado em CSS Grid e Flexbox.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-primary/10 rounded text-center">
                      <span className="text-sm font-medium">Col 1</span>
                    </div>
                    <div className="p-4 bg-primary/10 rounded text-center">
                      <span className="text-sm font-medium">Col 2</span>
                    </div>
                    <div className="p-4 bg-primary/10 rounded text-center">
                      <span className="text-sm font-medium">Col 3</span>
                    </div>
                  </div>
                </div>
                <CodeExample code={`// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

// Grid com colunas específicas
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-8">Conteúdo principal</div>
  <div className="col-span-4">Sidebar</div>
</div>

// Flexbox
<div className="flex flex-col md:flex-row gap-4">
  <div className="flex-1">Conteúdo flexível</div>
  <div className="w-full md:w-64">Sidebar fixa</div>
</div>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Breakpoints</h4>
                <p className="text-text-secondary">
                  Sistema de breakpoints responsivo para diferentes tamanhos de tela.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border border-border rounded-lg">
                    <thead className="bg-bg-card">
                      <tr>
                        <th className="p-3 text-left text-text-primary font-medium">Breakpoint</th>
                        <th className="p-3 text-left text-text-primary font-medium">Min Width</th>
                        <th className="p-3 text-left text-text-primary font-medium">Container Max Width</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border">
                        <td className="p-3 text-text-secondary">xs</td>
                        <td className="p-3 text-text-secondary">0px</td>
                        <td className="p-3 text-text-secondary">100%</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-text-secondary">sm</td>
                        <td className="p-3 text-text-secondary">640px</td>
                        <td className="p-3 text-text-secondary">640px</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-text-secondary">md</td>
                        <td className="p-3 text-text-secondary">768px</td>
                        <td className="p-3 text-text-secondary">768px</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-text-secondary">lg</td>
                        <td className="p-3 text-text-secondary">1024px</td>
                        <td className="p-3 text-text-secondary">1024px</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-text-secondary">xl</td>
                        <td className="p-3 text-text-secondary">1280px</td>
                        <td className="p-3 text-text-secondary">1280px</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="p-3 text-text-secondary">2xl</td>
                        <td className="p-3 text-text-secondary">1536px</td>
                        <td className="p-3 text-text-secondary">1536px</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <CodeExample code={`// Classes responsivas
<div className="text-sm md:text-base lg:text-lg">
  Texto responsivo
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Grid responsivo
</div>

<div className="hidden md:block">
  Visível apenas em md e acima
</div>

<div className="block md:hidden">
  Visível apenas em telas menores que md
</div>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Espaçamento</h4>
                <p className="text-text-secondary">
                  Sistema de espaçamento consistente usando classes do Tailwind CSS.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-text-primary">Margin</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="p-2 bg-bg-card rounded border text-center">
                        <code className="text-xs">m-0</code>
                      </div>
                      <div className="p-2 bg-bg-card rounded border text-center">
                        <code className="text-xs">m-1</code>
                      </div>
                      <div className="p-2 bg-bg-card rounded border text-center">
                        <code className="text-xs">m-2</code>
                      </div>
                      <div className="p-2 bg-bg-card rounded border text-center">
                        <code className="text-xs">m-4</code>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-text-primary">Padding</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="p-2 bg-bg-card rounded border text-center">
                        <code className="text-xs">p-0</code>
                      </div>
                      <div className="p-2 bg-bg-card rounded border text-center">
                        <code className="text-xs">p-1</code>
                      </div>
                      <div className="p-2 bg-bg-card rounded border text-center">
                        <code className="text-xs">p-2</code>
                      </div>
                      <div className="p-2 bg-bg-card rounded border text-center">
                        <code className="text-xs">p-4</code>
                      </div>
                    </div>
                  </div>
                </div>
                <CodeExample code={`// Espaçamento uniforme
<div className="m-4 p-4">Margem e padding 4</div>

// Espaçamento direcional
<div className="mt-4 mb-2 ml-8 mr-2">Margens específicas</div>
<div className="pt-4 pb-2 pl-8 pr-2">Paddings específicos</div>

// Espaçamento responsivo
<div className="p-2 md:p-4 lg:p-6">Padding responsivo</div>

// Gap em flexbox/grid
<div className="flex gap-4">Flexbox com gap</div>
<div className="grid gap-4">Grid com gap</div>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Display e Visibilidade</h4>
                <p className="text-text-secondary">
                  Controle de exibição e visibilidade dos elementos.
                </p>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <div className="p-2 bg-bg-card rounded border">
                      <code className="text-xs">block</code>
                    </div>
                    <div className="p-2 bg-bg-card rounded border">
                      <code className="text-xs">inline</code>
                    </div>
                    <div className="p-2 bg-bg-card rounded border">
                      <code className="text-xs">flex</code>
                    </div>
                    <div className="p-2 bg-bg-card rounded border">
                      <code className="text-xs">grid</code>
                    </div>
                    <div className="p-2 bg-bg-card rounded border">
                      <code className="text-xs">hidden</code>
                    </div>
                  </div>
                </div>
                <CodeExample code={`// Display básico
<div className="block">Elemento em bloco</div>
<span className="inline">Elemento inline</span>
<div className="flex">Container flexbox</div>
<div className="grid">Container grid</div>

// Visibilidade responsiva
<div className="hidden md:block">Visível apenas em md+</div>
<div className="block md:hidden">Visível apenas em telas pequenas</div>

// Visibilidade condicional
<div className={isVisible ? 'block' : 'hidden'}>
  Conteúdo condicional
</div>`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colors */}
        <div id="colors" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Colors
              </CardTitle>
              <CardDescription>
                Paleta de cores do sistema com suporte a dark mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Primary Colors</h4>
                <p className="text-text-secondary">
                  Cores primárias do sistema, usadas para elementos principais e call-to-actions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-primary rounded-lg flex items-center justify-center text-white font-medium">
                      Primary
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">bg-primary</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-primary/80 rounded-lg flex items-center justify-center text-white font-medium">
                      Primary/80
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">bg-primary/80</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-primary/60 rounded-lg flex items-center justify-center text-white font-medium">
                      Primary/60
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">bg-primary/60</code>
                    </div>
                  </div>
                </div>
                <CodeExample code={`<div className="bg-primary text-white">Primary</div>
<div className="bg-primary/80 text-white">Primary 80%</div>
<div className="bg-primary/60 text-white">Primary 60%</div>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Semantic Colors</h4>
                <p className="text-text-secondary">
                  Cores semânticas para diferentes estados e tipos de informação.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-green-500 rounded-lg flex items-center justify-center text-white font-medium">
                      Success
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">bg-green-500</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-red-500 rounded-lg flex items-center justify-center text-white font-medium">
                      Error
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">bg-red-500</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-medium">
                      Warning
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">bg-yellow-500</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-blue-500 rounded-lg flex items-center justify-center text-white font-medium">
                      Info
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">bg-blue-500</code>
                    </div>
                  </div>
                </div>
                <CodeExample code={`<div className="bg-green-500 text-white">Success</div>
<div className="bg-red-500 text-white">Error</div>
<div className="bg-yellow-500 text-white">Warning</div>
<div className="bg-blue-500 text-white">Info</div>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Neutral Colors</h4>
                <p className="text-text-secondary">
                  Cores neutras para backgrounds, bordas e texto.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-text-primary">Background Colors</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="w-full h-12 bg-bg-primary rounded-lg border border-border flex items-center justify-center">
                          <span className="text-text-primary font-medium">Primary</span>
                        </div>
                        <div className="text-center">
                          <code className="text-sm text-text-secondary">bg-bg-primary</code>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-12 bg-bg-card rounded-lg border border-border flex items-center justify-center">
                          <span className="text-text-primary font-medium">Card</span>
                        </div>
                        <div className="text-center">
                          <code className="text-sm text-text-secondary">bg-bg-card</code>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-12 bg-bg-header rounded-lg border border-border flex items-center justify-center">
                          <span className="text-text-primary font-medium">Header</span>
                        </div>
                        <div className="text-center">
                          <code className="text-sm text-text-secondary">bg-bg-header</code>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h5 className="font-medium text-text-primary">Text Colors</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="w-full h-12 bg-bg-card rounded-lg border border-border flex items-center justify-center">
                          <span className="text-text-primary font-medium">Primary Text</span>
                        </div>
                        <div className="text-center">
                          <code className="text-sm text-text-secondary">text-text-primary</code>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-12 bg-bg-card rounded-lg border border-border flex items-center justify-center">
                          <span className="text-text-secondary font-medium">Secondary Text</span>
                        </div>
                        <div className="text-center">
                          <code className="text-sm text-text-secondary">text-text-secondary</code>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="w-full h-12 bg-bg-card rounded-lg border border-border flex items-center justify-center">
                          <span className="text-text-muted font-medium">Muted Text</span>
                        </div>
                        <div className="text-center">
                          <code className="text-sm text-text-secondary">text-text-muted</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <CodeExample code={`// Background colors
<div className="bg-bg-primary">Primary background</div>
<div className="bg-bg-card">Card background</div>
<div className="bg-bg-header">Header background</div>

// Text colors
<span className="text-text-primary">Primary text</span>
<span className="text-text-secondary">Secondary text</span>
<span className="text-text-muted">Muted text</span>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Border Colors</h4>
                <p className="text-text-secondary">
                  Cores para bordas e separadores.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="w-full h-12 bg-bg-card rounded-lg border-2 border-border flex items-center justify-center">
                      <span className="text-text-primary font-medium">Default</span>
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">border-border</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-12 bg-bg-card rounded-lg border-2 border-primary flex items-center justify-center">
                      <span className="text-text-primary font-medium">Primary</span>
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">border-primary</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-12 bg-bg-card rounded-lg border-2 border-green-500 flex items-center justify-center">
                      <span className="text-text-primary font-medium">Success</span>
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">border-green-500</code>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-12 bg-bg-card rounded-lg border-2 border-red-500 flex items-center justify-center">
                      <span className="text-text-primary font-medium">Error</span>
                    </div>
                    <div className="text-center">
                      <code className="text-sm text-text-secondary">border-red-500</code>
                    </div>
                  </div>
                </div>
                <CodeExample code={`<div className="border border-border">Default border</div>
<div className="border border-primary">Primary border</div>
<div className="border border-green-500">Success border</div>
<div className="border border-red-500">Error border</div>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Dark Mode</h4>
                <p className="text-text-secondary">
                  O sistema suporta dark mode automático. As cores se adaptam automaticamente ao tema.
                </p>
                <div className="p-4 bg-bg-card rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span className="font-medium text-text-primary">Tema Atual: {theme === 'dark' ? 'Dark' : 'Light'}</span>
                  </div>
                  <p className="text-sm text-text-secondary">
                    As cores do sistema se adaptam automaticamente ao tema selecionado pelo usuário.
                    Use as classes semânticas como <code>bg-bg-primary</code>, <code>text-text-primary</code> 
                    para garantir compatibilidade com ambos os temas.
                  </p>
                </div>
                <CodeExample code={`// Cores que se adaptam ao tema
<div className="bg-bg-primary text-text-primary">
  Background e texto que se adaptam ao tema
</div>

// Cores específicas do tema
<div className={cn(
  "p-4 rounded-lg",
  theme === 'dark' 
    ? "bg-gray-800 text-white" 
    : "bg-gray-100 text-black"
)}>
  Conteúdo com cores específicas do tema
</div>`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Typography */}
        <div id="typography" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Typography
              </CardTitle>
              <CardDescription>
                Sistema tipográfico e hierarquia de texto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Typography Classes */}
              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Classes de Tipografia Personalizadas</h4>
                <p className="text-text-secondary">
                  Sistema padronizado de classes para tipografia consistente em toda a aplicação.
                </p>
                
                {/* Display Text */}
                <div className="space-y-4">
                  <h5 className="font-medium text-text-primary">Display Text</h5>
                  <div className="space-y-3">
                    <div className="text-display-2xl text-text-primary">Display 2XL</div>
                    <div className="text-display-xl text-text-primary">Display XL</div>
                    <div className="text-display-lg text-text-primary">Display Large</div>
                    <div className="text-display-md text-text-primary">Display Medium</div>
                    <div className="text-display-sm text-text-primary">Display Small</div>
                    <div className="text-display-xs text-text-primary">Display XS</div>
                  </div>
                  
                  <CodeExample code={`<div className="text-display-2xl text-text-primary">Display 2XL</div>
<div className="text-display-xl text-text-primary">Display XL</div>
<div className="text-display-lg text-text-primary">Display Large</div>
<div className="text-display-md text-text-primary">Display Medium</div>
<div className="text-display-sm text-text-primary">Display Small</div>
<div className="text-display-xs text-text-primary">Display XS</div>`} />
                </div>

                {/* Headings */}
                <div className="space-y-4">
                  <h5 className="font-medium text-text-primary">Headings</h5>
                  <div className="space-y-3">
                    <div className="text-h1 text-text-primary">Heading 1</div>
                    <div className="text-h2 text-text-primary">Heading 2</div>
                    <div className="text-h3 text-text-primary">Heading 3</div>
                    <div className="text-h4 text-text-primary">Heading 4</div>
                    <div className="text-h5 text-text-primary">Heading 5</div>
                    <div className="text-h6 text-text-primary">Heading 6</div>
                  </div>
                  
                  <CodeExample code={`<div className="text-h1 text-text-primary">Heading 1</div>
<div className="text-h2 text-text-primary">Heading 2</div>
<div className="text-h3 text-text-primary">Heading 3</div>
<div className="text-h4 text-text-primary">Heading 4</div>
<div className="text-h5 text-text-primary">Heading 5</div>
<div className="text-h6 text-text-primary">Heading 6</div>`} />
                </div>

                {/* Body Text */}
                <div className="space-y-4">
                  <h5 className="font-medium text-text-primary">Body Text</h5>
                  <div className="space-y-3">
                    <div className="text-body-xl text-text-primary">Body XL - Texto grande para introduções</div>
                    <div className="text-body-lg text-text-primary">Body Large - Texto padrão para conteúdo</div>
                    <div className="text-body-md text-text-primary">Body Medium - Texto padrão</div>
                    <div className="text-body-sm text-text-primary">Body Small - Texto menor para detalhes</div>
                    <div className="text-body-xs text-text-primary">Body XS - Texto muito pequeno</div>
                  </div>
                  
                  <CodeExample code={`<div className="text-body-xl text-text-primary">Body XL - Texto grande</div>
<div className="text-body-lg text-text-primary">Body Large - Texto padrão</div>
<div className="text-body-md text-text-primary">Body Medium - Texto padrão</div>
<div className="text-body-sm text-text-primary">Body Small - Texto menor</div>
<div className="text-body-xs text-text-primary">Body XS - Texto muito pequeno</div>`} />
                </div>

                {/* Labels and Captions */}
                <div className="space-y-4">
                  <h5 className="font-medium text-text-primary">Labels e Captions</h5>
                  <div className="space-y-3">
                    <div className="text-label-lg text-text-primary">LABEL LARGE</div>
                    <div className="text-label-md text-text-primary">LABEL MEDIUM</div>
                    <div className="text-label-sm text-text-primary">label small</div>
                    <div className="text-caption">Caption - Texto secundário pequeno</div>
                  </div>
                  
                  <CodeExample code={`<div className="text-label-lg text-text-primary">LABEL LARGE</div>
<div className="text-label-md text-text-primary">LABEL MEDIUM</div>
<div className="text-label-sm text-text-primary">label small</div>
<div className="text-caption">Caption - Texto secundário</div>`} />
                </div>

                {/* Code and Monospace */}
                <div className="space-y-4">
                  <h5 className="font-medium text-text-primary">Code e Monospace</h5>
                  <div className="space-y-3">
                    <div className="text-code-lg text-text-primary">Code Large - const api = 'endpoint'</div>
                    <div className="text-code-md text-text-primary">Code Medium - const api = 'endpoint'</div>
                    <div className="text-code-sm text-text-primary">Code Small - const api = 'endpoint'</div>
                    <div className="text-code-xs text-text-primary">Code XS - const api = 'endpoint'</div>
                  </div>
                  
                  <CodeExample code={`<div className="text-code-lg text-text-primary">Code Large - const api = 'endpoint'</div>
<div className="text-code-md text-text-primary">Code Medium - const api = 'endpoint'</div>
<div className="text-code-sm text-text-primary">Code Small - const api = 'endpoint'</div>
<div className="text-code-xs text-text-primary">Code XS - const api = 'endpoint'</div>`} />
                </div>

                {/* Numbers and Data */}
                <div className="space-y-4">
                  <h5 className="font-medium text-text-primary">Números e Dados</h5>
                  <div className="space-y-3">
                    <div className="text-number-2xl text-text-primary">$115,457.00</div>
                    <div className="text-number-xl text-text-primary">$115,457.00</div>
                    <div className="text-number-lg text-text-primary">$115,457.00</div>
                    <div className="text-number-md text-text-primary">$115,457.00</div>
                    <div className="text-number-sm text-text-primary">$115,457.00</div>
                    <div className="text-number-xs text-text-primary">$115,457.00</div>
                  </div>
                  
                  <CodeExample code={`<div className="text-number-2xl text-text-primary">$115,457.00</div>
<div className="text-number-xl text-text-primary">$115,457.00</div>
<div className="text-number-lg text-text-primary">$115,457.00</div>
<div className="text-number-md text-text-primary">$115,457.00</div>
<div className="text-number-sm text-text-primary">$115,457.00</div>
<div className="text-number-xs text-text-primary">$115,457.00</div>`} />
                </div>
              </div>

              <Separator />

              {/* Traditional Tailwind Classes */}
              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Classes Tradicionais do Tailwind</h4>
                <p className="text-text-secondary">
                  Classes básicas do Tailwind para casos específicos e customizações.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Typography - Classes Tradicionais
              </CardTitle>
              <CardDescription>
                Classes básicas do Tailwind para tipografia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Headings</h4>
                <p className="text-text-secondary">
                  Hierarquia de títulos com tamanhos e pesos consistentes.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-text-primary">Heading 1</h1>
                    <code className="text-sm text-text-secondary">text-4xl font-bold</code>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-semibold text-text-primary">Heading 2</h2>
                    <code className="text-sm text-text-secondary">text-3xl font-semibold</code>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-text-primary">Heading 3</h3>
                    <code className="text-sm text-text-secondary">text-2xl font-semibold</code>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-semibold text-text-primary">Heading 4</h4>
                    <code className="text-sm text-text-secondary">text-xl font-semibold</code>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-lg font-semibold text-text-primary">Heading 5</h5>
                    <code className="text-sm text-text-secondary">text-lg font-semibold</code>
                  </div>
                  <div className="space-y-2">
                    <h6 className="text-base font-semibold text-text-primary">Heading 6</h6>
                    <code className="text-sm text-text-secondary">text-base font-semibold</code>
                  </div>
                </div>
                <CodeExample code={`<h1 className="text-4xl font-bold text-text-primary">Heading 1</h1>
<h2 className="text-3xl font-semibold text-text-primary">Heading 2</h2>
<h3 className="text-2xl font-semibold text-text-primary">Heading 3</h3>
<h4 className="text-xl font-semibold text-text-primary">Heading 4</h4>
<h5 className="text-lg font-semibold text-text-primary">Heading 5</h5>
<h6 className="text-base font-semibold text-text-primary">Heading 6</h6>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Body Text</h4>
                <p className="text-text-secondary">
                  Texto do corpo com diferentes tamanhos e cores.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-lg text-text-primary">Texto grande para introduções e destaques.</p>
                    <code className="text-sm text-text-secondary">text-lg text-text-primary</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base text-text-primary">Texto padrão para parágrafos e conteúdo principal.</p>
                    <code className="text-sm text-text-secondary">text-base text-text-primary</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-text-secondary">Texto pequeno para informações secundárias e metadados.</p>
                    <code className="text-sm text-text-secondary">text-sm text-text-secondary</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-text-secondary">Texto extra pequeno para labels, captions e notas.</p>
                    <code className="text-sm text-text-secondary">text-xs text-text-secondary</code>
                  </div>
                </div>
                <CodeExample code={`<p className="text-lg text-text-primary">Texto grande</p>
<p className="text-base text-text-primary">Texto padrão</p>
<p className="text-sm text-text-secondary">Texto pequeno</p>
<p className="text-xs text-text-secondary">Texto extra pequeno</p>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Font Weights</h4>
                <p className="text-text-secondary">
                  Diferentes pesos de fonte para criar hierarquia visual.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-base font-thin text-text-primary">Font Thin (100)</p>
                    <code className="text-sm text-text-secondary">font-thin</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-light text-text-primary">Font Light (300)</p>
                    <code className="text-sm text-text-secondary">font-light</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-normal text-text-primary">Font Normal (400)</p>
                    <code className="text-sm text-text-secondary">font-normal</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-medium text-text-primary">Font Medium (500)</p>
                    <code className="text-sm text-text-secondary">font-medium</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-text-primary">Font Semibold (600)</p>
                    <code className="text-sm text-text-secondary">font-semibold</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-bold text-text-primary">Font Bold (700)</p>
                    <code className="text-sm text-text-secondary">font-bold</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-extrabold text-text-primary">Font Extrabold (800)</p>
                    <code className="text-sm text-text-secondary">font-extrabold</code>
                  </div>
                </div>
                <CodeExample code={`<p className="font-thin">Font Thin</p>
<p className="font-light">Font Light</p>
<p className="font-normal">Font Normal</p>
<p className="font-medium">Font Medium</p>
<p className="font-semibold">Font Semibold</p>
<p className="font-bold">Font Bold</p>
<p className="font-extrabold">Font Extrabold</p>`} />
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Text Utilities</h4>
                <p className="text-text-secondary">
                  Classes utilitárias para alinhamento, transformação e decoração de texto.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-text-primary">Alinhamento</h5>
                    <div className="space-y-2">
                      <p className="text-left text-text-primary">Texto alinhado à esquerda</p>
                      <p className="text-center text-text-primary">Texto centralizado</p>
                      <p className="text-right text-text-primary">Texto alinhado à direita</p>
                    </div>
                    <CodeExample code={`<p className="text-left">Esquerda</p>
<p className="text-center">Centro</p>
<p className="text-right">Direita</p>`} />
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-text-primary">Transformação</h5>
                    <div className="space-y-2">
                      <p className="uppercase text-text-primary">texto em maiúsculas</p>
                      <p className="lowercase text-text-primary">TEXTO EM MINÚSCULAS</p>
                      <p className="capitalize text-text-primary">texto capitalizado</p>
                    </div>
                    <CodeExample code={`<p className="uppercase">Maiúsculas</p>
<p className="lowercase">Minúsculas</p>
<p className="capitalize">Capitalizado</p>`} />
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-text-primary">Decoração</h5>
                    <div className="space-y-2">
                      <p className="underline text-text-primary">Texto sublinhado</p>
                      <p className="line-through text-text-primary">Texto riscado</p>
                      <p className="no-underline text-text-primary">Sem decoração</p>
                    </div>
                    <CodeExample code={`<p className="underline">Sublinhado</p>
<p className="line-through">Riscado</p>
<p className="no-underline">Sem decoração</p>`} />
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-text-primary">Truncamento</h5>
                    <div className="space-y-2">
                      <p className="truncate text-text-primary max-w-xs">Texto muito longo que será truncado com reticências</p>
                      <p className="text-ellipsis overflow-hidden text-text-primary max-w-xs">Outro exemplo de texto truncado</p>
                    </div>
                    <CodeExample code={`<p className="truncate max-w-xs">Texto truncado</p>
<p className="text-ellipsis overflow-hidden max-w-xs">Texto com ellipsis</p>`} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-semibold text-lg text-text-primary">Responsive Typography</h4>
                <p className="text-text-secondary">
                  Tipografia que se adapta a diferentes tamanhos de tela.
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-text-primary">
                      Título Responsivo
                    </h1>
                    <code className="text-sm text-text-secondary">text-2xl md:text-4xl lg:text-5xl</code>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm md:text-base lg:text-lg text-text-primary">
                      Parágrafo que cresce conforme o tamanho da tela.
                    </p>
                    <code className="text-sm text-text-secondary">text-sm md:text-base lg:text-lg</code>
                  </div>
                </div>
                <CodeExample code={`<h1 className="text-2xl md:text-4xl lg:text-5xl font-bold">
  Título Responsivo
</h1>

<p className="text-sm md:text-base lg:text-lg">
  Parágrafo Responsivo
</p>`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buttons */}
        <Card id="buttons">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Button size="sm" variant="outline">B</Button>
              Botões
            </CardTitle>
            <CardDescription>
              Variações e estados dos botões com cores semânticas para aplicações financeiras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Semantic Button Colors */}
            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Cores Semânticas para Aplicações Financeiras</h4>
              <p className="text-text-secondary">
                Botões com cores semânticas específicas para indicar saldos positivos, negativos e neutros.
              </p>
              
              {/* Financial Buttons */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Botões Financeiros</h5>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-profit">+$1,250.00</button>
                  <button className="btn-loss">-$850.00</button>
                  <button className="btn-neutral">$0.00</button>
                </div>
                <CodeExample code={`<button className="btn-profit">+$1,250.00</button>
<button className="btn-loss">-$850.00</button>
<button className="btn-neutral">$0.00</button>`} />
              </div>

              {/* Success Buttons */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Botões de Sucesso</h5>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-success">Success</button>
                  <button className="btn-success-outline">Success Outline</button>
                  <button className="btn-success-ghost">Success Ghost</button>
                </div>
                <CodeExample code={`<button className="btn-success">Success</button>
<button className="btn-success-outline">Success Outline</button>
<button className="btn-success-ghost">Success Ghost</button>`} />
              </div>

              {/* Danger Buttons */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Botões de Perigo</h5>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-danger">Danger</button>
                  <button className="btn-danger-outline">Danger Outline</button>
                  <button className="btn-danger-ghost">Danger Ghost</button>
                </div>
                <CodeExample code={`<button className="btn-danger">Danger</button>
<button className="btn-danger-outline">Danger Outline</button>
<button className="btn-danger-ghost">Danger Ghost</button>`} />
              </div>

              {/* Warning Buttons */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Botões de Aviso</h5>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-warning">Warning</button>
                  <button className="btn-warning-outline">Warning Outline</button>
                  <button className="btn-warning-ghost">Warning Ghost</button>
                </div>
                <CodeExample code={`<button className="btn-warning">Warning</button>
<button className="btn-warning-outline">Warning Outline</button>
<button className="btn-warning-ghost">Warning Ghost</button>`} />
              </div>

              {/* Info Buttons */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Botões de Informação</h5>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-info">Info</button>
                  <button className="btn-info-outline">Info Outline</button>
                  <button className="btn-info-ghost">Info Ghost</button>
                </div>
                <CodeExample code={`<button className="btn-info">Info</button>
<button className="btn-info-outline">Info Outline</button>
<button className="btn-info-ghost">Info Ghost</button>`} />
              </div>
            </div>

            <Separator />

            {/* Axisor Brand Solid Colors */}
            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Cores Sólidas da Identidade Visual</h4>
              <p className="text-text-secondary">
                Botões com cores sólidas da identidade visual do Axisor Bot.
              </p>
              
              {/* Solid Colors */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Cores Sólidas</h5>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-axisor-primary-solid">Primary</button>
                  <button className="btn-axisor-secondary-solid">Secondary</button>
                  <button className="btn-axisor-accent-solid">Accent</button>
                  <button className="btn-axisor-success-solid">Success</button>
                  <button className="btn-axisor-destructive-solid">Destructive</button>
                </div>
                <CodeExample code={`<button className="btn-axisor-primary-solid">Primary</button>
<button className="btn-axisor-secondary-solid">Secondary</button>
<button className="btn-axisor-accent-solid">Accent</button>
<button className="btn-axisor-success-solid">Success</button>
<button className="btn-axisor-destructive-solid">Destructive</button>`} />
              </div>

              {/* Outline Colors */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Cores Outline</h5>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-axisor-primary-outline">Primary</button>
                  <button className="btn-axisor-secondary-outline">Secondary</button>
                  <button className="btn-axisor-accent-outline">Accent</button>
                  <button className="btn-axisor-success-outline">Success</button>
                  <button className="btn-axisor-destructive-outline">Destructive</button>
                </div>
                <CodeExample code={`<button className="btn-axisor-primary-outline">Primary</button>
<button className="btn-axisor-secondary-outline">Secondary</button>
<button className="btn-axisor-accent-outline">Accent</button>
<button className="btn-axisor-success-outline">Success</button>
<button className="btn-axisor-destructive-outline">Destructive</button>`} />
              </div>

              {/* Ghost Colors */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Cores Ghost</h5>
                <div className="flex flex-wrap gap-4">
                  <button className="btn-axisor-primary-ghost">Primary</button>
                  <button className="btn-axisor-secondary-ghost">Secondary</button>
                  <button className="btn-axisor-accent-ghost">Accent</button>
                  <button className="btn-axisor-success-ghost">Success</button>
                  <button className="btn-axisor-destructive-ghost">Destructive</button>
                </div>
                <CodeExample code={`<button className="btn-axisor-primary-ghost">Primary</button>
<button className="btn-axisor-secondary-ghost">Secondary</button>
<button className="btn-axisor-accent-ghost">Accent</button>
<button className="btn-axisor-success-ghost">Success</button>
<button className="btn-axisor-destructive-ghost">Destructive</button>`} />
              </div>
            </div>

            <Separator />

            {/* Traditional Button Variants */}
            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Variantes Tradicionais do Tailwind</h4>
              <p className="text-text-secondary">
                Diferentes estilos de botão para diferentes propósitos.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <CodeExample code={`<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>`} />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-text-primary">Tamanhos</h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
              </div>
              <CodeExample code={`<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>`} />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-text-primary">Estados</h4>
              <div className="flex flex-wrap gap-4">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
                <Button className="opacity-50 cursor-not-allowed">Loading</Button>
              </div>
              <CodeExample code={`<Button>Normal</Button>
<Button disabled>Disabled</Button>
<Button className="opacity-50 cursor-not-allowed">Loading</Button>`} />
            </div>
          </CardContent>
        </Card>

        {/* Form Elements */}
        <Card id="forms">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Input className="w-6 h-6" />
              Elementos de Formulário
            </CardTitle>
            <CardDescription>
              Inputs, selects e outros controles de formulário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Inputs</h4>
                <div className="space-y-2">
                  <Label htmlFor="input-default">Input Padrão</Label>
                  <Input id="input-default" placeholder="Digite algo..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-disabled">Input Desabilitado</Label>
                  <Input id="input-disabled" placeholder="Desabilitado" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="input-error">Input com Erro</Label>
                  <Input id="input-error" placeholder="Com erro" className="border-red-500" />
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Outros Controles</h4>
                <div className="space-y-2">
                  <Label htmlFor="textarea">Textarea Padrão</Label>
                  <Textarea id="textarea" placeholder="Digite uma mensagem..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textarea-transparent">Textarea Transparente</Label>
                  <Textarea 
                    id="textarea-transparent" 
                    placeholder="Digite uma mensagem..." 
                    className="textarea-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Select</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="option1">Opção 1</SelectItem>
                      <SelectItem value="option2">Opção 2</SelectItem>
                      <SelectItem value="option3">Opção 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold">Controles de Estado</h4>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="switch" 
                    checked={switchValue} 
                    onCheckedChange={(checked) => setSwitchValue(checked === true)} 
                  />
                  <Label htmlFor="switch">Switch</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="checkbox" 
                    checked={checkboxValue} 
                    onCheckedChange={(checked) => setCheckboxValue(checked === true)} 
                  />
                  <Label htmlFor="checkbox">Checkbox</Label>
                </div>
                <div className="space-y-2">
                  <Label>Radio Group</Label>
                  <RadioGroup value={radioValue} onValueChange={setRadioValue}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option1" id="r1" />
                      <Label htmlFor="r1">Opção 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option2" id="r2" />
                      <Label htmlFor="r2">Opção 2</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards */}
        <Card id="cards">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Card className="w-6 h-6 p-1">
                <CardContent className="p-0 w-full h-full bg-primary rounded"></CardContent>
              </Card>
              Cards
            </CardTitle>
            <CardDescription>
              Diferentes tipos e estilos de cards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-text-primary">Cards Tradicionais</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Padrão</CardTitle>
                      <CardDescription>Descrição do card</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-text-secondary">Conteúdo do card aqui.</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle>Card com Borda</CardTitle>
                      <CardDescription>Card com destaque</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-text-secondary">Card com borda colorida.</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5">
                    <CardHeader>
                      <CardTitle>Card com Fundo</CardTitle>
                      <CardDescription>Card com background</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-text-secondary">Card com fundo colorido.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-text-primary">Automation Card</h4>
                <p className="text-text-secondary">
                  Card especial com background degradê e efeito glow para elementos de automação.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AutomationCard
                    title="Configuração de Automações"
                    description="Configure suas proteções automáticas e estratégias de trading inteligentes"
                    variant="default"
                  />
                  <AutomationCard
                    title="Configurações Salvas"
                    description="Suas configurações foram salvas com sucesso"
                    variant="saved"
                  />
                  <AutomationCard
                    title="Processando..."
                    description="Aplicando suas configurações de automação"
                    variant="loading"
                  />
                </div>
                <CodeExample code={`<AutomationCard
  title="Configuração de Automações"
  description="Configure suas proteções automáticas e estratégias de trading inteligentes"
  variant="default"
/>

<AutomationCard
  title="Configurações Salvas"
  description="Suas configurações foram salvas com sucesso"
  variant="saved"
/>

<AutomationCard
  title="Processando..."
  description="Aplicando suas configurações de automação"
  variant="loading"
/>`} />
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg text-text-primary">Gradient Cards with Floating Icons</h4>
                <p className="text-text-secondary">
                  Cards especiais com background degradê e ícones flutuantes externos que animam no hover.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Red Gradient Card */}
                  <div className="relative group">
                    <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                      <div className="w-12 h-12 bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                        <TrendingUp className="w-6 h-6 text-red-300 stroke-2 group-hover:text-red-200 transition-colors duration-500" />
                      </div>
                    </div>
                    <Card className="gradient-card gradient-card-red border-2 border-red-500 hover:border-red-400 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 cursor-default">
                      <div className="card-content">
                        <div className="p-6">
                          <div className="mb-4">
                            <CardTitle className="text-h3 text-vibrant">Total PnL</CardTitle>
                          </div>
                          <div className="mb-3">
                            <div className="text-number-lg text-red-200">-7.089</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-label-sm px-2 py-1 border-red-400/60 text-red-200 bg-red-600/20">
                              -15.6%
                            </Badge>
                            <span className="text-caption text-red-300/80">vs Margin</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Green Gradient Card */}
                  <div className="relative group">
                    <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                      <div className="w-12 h-12 bg-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-green-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                        <TrendingUp className="w-6 h-6 text-green-300 stroke-2 group-hover:text-green-200 transition-colors duration-500" />
                      </div>
                    </div>
                    <Card className="gradient-card gradient-card-green border-2 border-green-500 hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/30 cursor-default">
                      <div className="card-content">
                        <div className="p-6">
                          <div className="mb-4">
                            <CardTitle className="text-h3 text-vibrant">Estimated Profit</CardTitle>
                          </div>
                          <div className="mb-3">
                            <div className="text-number-lg text-green-200">6.840</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-label-sm px-2 py-1 border-green-400/60 text-green-200 bg-green-600/20">
                              +12.5%
                            </Badge>
                            <span className="text-caption text-green-300/80">estimated</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Blue Gradient Card */}
                  <div className="relative group">
                    <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
                      <div className="w-12 h-12 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
                        <Activity className="w-6 h-6 text-blue-300 stroke-2 group-hover:text-blue-200 transition-colors duration-500" />
                      </div>
                    </div>
                    <Card className="gradient-card gradient-card-blue border-2 border-blue-500 hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/30 cursor-default">
                      <div className="card-content">
                        <div className="p-6">
                          <div className="mb-4">
                            <CardTitle className="text-h3 text-vibrant">Active Trades</CardTitle>
                          </div>
                          <div className="mb-3">
                            <div className="text-number-lg text-blue-200">11</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-label-sm px-2 py-1 border-blue-400/60 text-blue-200 bg-blue-600/20">
                              Active
                            </Badge>
                            <span className="text-caption text-blue-300/80">positions</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="font-semibold text-base text-text-primary">Floating Icon Component</h5>
                  <p className="text-text-secondary">
                    O <strong>Floating Icon</strong> é um elemento especial que aparece fora dos limites do card, 
                    criando um design moderno e interativo. Características:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-text-secondary ml-4">
                    <li><strong>Efeito Glassmorphism</strong>: Fundo semi-transparente com backdrop blur</li>
                    <li><strong>Animação Float Sutil</strong>: Movimento suave para cima e para baixo no hover</li>
                    <li><strong>Efeito Scale</strong>: Aumento de 5% no tamanho no hover para feedback sutil</li>
                    <li><strong>Transições de Cor</strong>: Mudanças suaves de cor que combinam com o tema do card</li>
                    <li><strong>Melhoria de Sombra</strong>: Sombra dinâmica que combina com a cor do card</li>
                  </ul>
                </div>

                <CodeExample code={`{/* Gradient Card with Floating Icon */}
<div className="relative group">
  {/* Floating Icon */}
  <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
    <div className="w-12 h-12 bg-red-600/20 backdrop-blur-sm border border-red-500/30 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-red-500/30 group-hover:scale-105 transition-all duration-500 ease-out">
      <TrendingUp className="w-6 h-6 text-red-300 stroke-2 group-hover:text-red-200 transition-colors duration-500" />
    </div>
  </div>
  
  <Card className="gradient-card gradient-card-red border-2 border-red-500 hover:border-red-400 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 cursor-default">
    <div className="card-content">
      <div className="p-6">
        <div className="mb-4">
          <CardTitle className="text-h3 text-vibrant">Card Title</CardTitle>
        </div>
        <div className="mb-3">
          <div className="text-number-lg text-red-200">Value</div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-label-sm px-2 py-1 border-red-400/60 text-red-200 bg-red-600/20">
            Badge
          </Badge>
          <span className="text-caption text-red-300/80">Label</span>
        </div>
      </div>
    </div>
  </Card>
</div>`} />

                <div className="space-y-4">
                  <h5 className="font-semibold text-base text-text-primary">Variantes de Gradiente Disponíveis</h5>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-lg gradient-card-red border-2 border-red-500"></div>
                      <p className="text-sm text-text-secondary">gradient-card-red</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-lg gradient-card-green border-2 border-green-500"></div>
                      <p className="text-sm text-text-secondary">gradient-card-green</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-lg gradient-card-blue border-2 border-blue-500"></div>
                      <p className="text-sm text-text-secondary">gradient-card-blue</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-lg gradient-card-purple border-2 border-purple-500"></div>
                      <p className="text-sm text-text-secondary">gradient-card-purple</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-lg gradient-card-orange border-2 border-orange-500"></div>
                      <p className="text-sm text-text-secondary">gradient-card-orange</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card id="badges">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge>B</Badge>
              Badges
            </CardTitle>
            <CardDescription>
              Diferentes tipos de badges e indicadores com cores semânticas para aplicações financeiras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Semantic Badge Colors */}
            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Cores Semânticas para Aplicações Financeiras</h4>
              <p className="text-text-secondary">
                Badges com cores semânticas específicas para indicar saldos positivos, negativos e neutros.
              </p>
              
              {/* Financial Badges */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Badges Financeiros</h5>
                <div className="flex flex-wrap gap-4">
                  <Badge className="badge-profit">+2.5%</Badge>
                  <Badge className="badge-loss">-1.8%</Badge>
                  <Badge className="badge-neutral-financial">0.0%</Badge>
                </div>
                <CodeExample code={`<Badge className="badge-profit">+2.5%</Badge>
<Badge className="badge-loss">-1.8%</Badge>
<Badge className="badge-neutral-financial">0.0%</Badge>`} />
              </div>

              {/* Badges with Glow Effects */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Badges com Efeito Glow</h5>
                <div className="flex flex-wrap gap-4">
                  <Badge className="badge-profit-glow">+$1,250.00</Badge>
                  <Badge className="badge-loss-glow">-$850.00</Badge>
                  <Badge className="badge-neutral-glow">$0.00</Badge>
                </div>
                <CodeExample code={`<Badge className="badge-profit-glow">+$1,250.00</Badge>
<Badge className="badge-loss-glow">-$850.00</Badge>
<Badge className="badge-neutral-glow">$0.00</Badge>`} />
              </div>

              {/* Semantic Badges */}
              <div className="space-y-4">
                <h5 className="font-medium text-text-primary">Badges Semânticos</h5>
                <div className="flex flex-wrap gap-4">
                  <Badge className="badge-success">Success</Badge>
                  <Badge className="badge-danger">Danger</Badge>
                  <Badge className="badge-warning">Warning</Badge>
                  <Badge className="badge-info">Info</Badge>
                  <Badge className="badge-neutral">Neutral</Badge>
                </div>
                <CodeExample code={`<Badge className="badge-success">Success</Badge>
<Badge className="badge-danger">Danger</Badge>
<Badge className="badge-warning">Warning</Badge>
<Badge className="badge-info">Info</Badge>
<Badge className="badge-neutral">Neutral</Badge>`} />
              </div>
            </div>

            <Separator />

            {/* Traditional Badge Variants */}
            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Variantes Tradicionais</h4>
              <p className="text-text-secondary">
                Diferentes estilos de badge para diferentes propósitos.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
              <CodeExample code={`<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="destructive">Destructive</Badge>`} />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-text-primary">Variantes de Cores</h4>
              <p className="text-text-secondary">
                Badges com cores específicas para diferentes contextos.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge className="badge-green">Success</Badge>
                <Badge className="badge-red">Error</Badge>
                <Badge className="badge-neutral-traditional">Neutral</Badge>
              </div>
              <CodeExample code={`<Badge className="badge-green">Success</Badge>
<Badge className="badge-red">Error</Badge>
<Badge className="badge-neutral-traditional">Neutral</Badge>`} />
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-text-primary">Tamanhos</h4>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="text-xs">Small</Badge>
                <Badge>Default</Badge>
                <Badge className="text-sm px-3 py-1">Large</Badge>
              </div>
              <CodeExample code={`<Badge className="text-xs">Small</Badge>
<Badge>Default</Badge>
<Badge className="text-sm px-3 py-1">Large</Badge>`} />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Menu */}
        <Card id="navigation">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded"></div>
              </div>
              Menu de Navegação
            </CardTitle>
            <CardDescription>
              Navegação horizontal com ícones e glow effect
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 py-6">
            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Menu com Glow Effect (Automações Style)</h4>
              <div className="flex items-center space-x-2 p-2 bg-bg-card rounded-lg">
                {/* Margin Guard - Ativo */}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 h-auto",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "transition-all duration-300 rounded-lg"
                  )}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Margin Guard</span>
                </Button>
                
                {/* Take Profit / Stop Loss - Inativo */}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 h-auto",
                    "text-text-secondary hover:text-text-primary hover:bg-primary/10",
                    "transition-all duration-300 rounded-lg"
                  )}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Take Profit / Stop Loss</span>
                </Button>
                
                {/* Entradas Automáticas - Inativo */}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 h-auto",
                    "text-text-secondary hover:text-text-primary hover:bg-primary/10",
                    "transition-all duration-300 rounded-lg"
                  )}
                >
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Entradas Automáticas</span>
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Menu com Glow Effect (Glassmorphism)</h4>
              <div className={cn(
                "flex items-center space-x-2 p-2 rounded-lg",
                theme === 'dark' ? 'profile-tabs-glow' : 'profile-tabs-glow-light'
              )}>
                {/* Opção 1 - Ativa */}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 h-auto",
                    "bg-primary/20 text-primary-foreground hover:bg-primary/30",
                    "transition-all duration-300 rounded-lg profile-tab-trigger"
                  )}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Opção 1</span>
                </Button>
                
                {/* Opção 2 - Inativa */}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 h-auto",
                    "text-text-secondary hover:text-text-primary hover:bg-primary/10",
                    "transition-all duration-300 rounded-lg profile-tab-trigger"
                  )}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Opção 2</span>
                </Button>
                
                {/* Opção 3 - Inativa */}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 h-auto",
                    "text-text-secondary hover:text-text-primary hover:bg-primary/10",
                    "transition-all duration-300 rounded-lg profile-tab-trigger"
                  )}
                >
                  <Zap className="w-5 h-5" />
                  <span className="font-medium">Opção 3</span>
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Menu Simples (Sem Glow)</h4>
              <div className="flex items-center space-x-2 p-2 bg-bg-card rounded-lg border border-border">
                {/* Opção 1 - Ativa */}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 h-auto",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "transition-all duration-300 rounded-lg"
                  )}
                >
                  <Home className="w-5 h-5" />
                  <span className="font-medium">Dashboard</span>
                </Button>
                
                {/* Opção 2 - Inativa */}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 h-auto",
                    "text-text-secondary hover:text-text-primary hover:bg-primary/10",
                    "transition-all duration-300 rounded-lg"
                  )}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Configurações</span>
                </Button>
                
                {/* Opção 3 - Inativa */}
                <Button
                  variant="ghost"
                  className={cn(
                    "flex items-center space-x-2 px-4 py-3 h-auto",
                    "text-text-secondary hover:text-text-primary hover:bg-primary/10",
                    "transition-all duration-300 rounded-lg"
                  )}
                >
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">Notificações</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card id="tabs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded"></div>
              </div>
              Abas (Tabs)
            </CardTitle>
            <CardDescription>
              Navegação por abas e seções
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 py-6">
            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Tabs Padrão</h4>
              <Tabs defaultValue="tab1" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12">
                  <TabsTrigger value="tab1" className="text-sm font-medium">Aba 1</TabsTrigger>
                  <TabsTrigger value="tab2" className="text-sm font-medium">Aba 2</TabsTrigger>
                  <TabsTrigger value="tab3" className="text-sm font-medium">Aba 3</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1" className="mt-6 p-4 bg-bg-card rounded-lg">
                  <p className="text-base text-text-primary">Conteúdo da primeira aba com melhor legibilidade.</p>
                </TabsContent>
                <TabsContent value="tab2" className="mt-6 p-4 bg-bg-card rounded-lg">
                  <p className="text-base text-text-primary">Conteúdo da segunda aba com melhor legibilidade.</p>
                </TabsContent>
                <TabsContent value="tab3" className="mt-6 p-4 bg-bg-card rounded-lg">
                  <p className="text-base text-text-primary">Conteúdo da terceira aba com melhor legibilidade.</p>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Tabs com Glow Effect (Profile Style)</h4>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className={cn(
                  "grid w-full grid-cols-2 h-12",
                  theme === 'dark' ? 'profile-tabs-glow' : 'profile-tabs-glow-light'
                )}>
                  <TabsTrigger 
                    value="profile" 
                    className="profile-tab-trigger text-sm font-medium"
                  >
                    Profile
                  </TabsTrigger>
                  <TabsTrigger 
                    value="lnmarkets" 
                    className="profile-tab-trigger text-sm font-medium"
                  >
                    LN Markets
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="mt-6 p-4 bg-bg-card rounded-lg">
                  <p className="text-base text-text-primary">Conteúdo do perfil do usuário com melhor legibilidade.</p>
                </TabsContent>
                <TabsContent value="lnmarkets" className="mt-6 p-4 bg-bg-card rounded-lg">
                  <p className="text-base text-text-primary">Configurações da LN Markets com melhor legibilidade.</p>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Tabs Simples (2 opções)</h4>
              <Tabs defaultValue="option1" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="option1" className="text-sm font-medium">Opção 1</TabsTrigger>
                  <TabsTrigger value="option2" className="text-sm font-medium">Opção 2</TabsTrigger>
                </TabsList>
                <TabsContent value="option1" className="mt-6 p-4 bg-bg-card rounded-lg">
                  <p className="text-base text-text-primary">Primeira opção selecionada com melhor legibilidade.</p>
                </TabsContent>
                <TabsContent value="option2" className="mt-6 p-4 bg-bg-card rounded-lg">
                  <p className="text-base text-text-primary">Segunda opção selecionada com melhor legibilidade.</p>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card id="alerts">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas
            </CardTitle>
            <CardDescription>
              Diferentes tipos de alertas e notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>Alerta informativo padrão.</AlertDescription>
            </Alert>
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">Alerta de sucesso.</AlertDescription>
            </Alert>
            <Alert className="border-yellow-500 bg-yellow-500/10">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-500">Alerta de aviso.</AlertDescription>
            </Alert>
            <Alert className="border-red-500 bg-red-500/10">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-500">Alerta de erro.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Icons */}
        <Card id="icons">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              Icons
            </CardTitle>
            <CardDescription>
              Biblioteca completa de ícones baseada no Lucide React
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Uso Básico</h4>
              <p className="text-text-secondary">
                Todos os ícones são importados do Lucide React e podem ser usados diretamente nos componentes.
              </p>
              <CodeExample code={`import { 
  Home, 
  User,
  Search,
  Bell, 
  Mail,
  Heart, 
  Star, 
  Plus, 
  Minus 
} from 'lucide-react';

function IconExample() {
  return (
    <div className="flex items-center gap-2">
      <Home className="w-5 h-5" />
      <span>Home</span>
    </div>
  );
}`} />
            </div>

            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Tamanhos</h4>
              <p className="text-text-secondary">
                Os ícones podem ser redimensionados usando classes do Tailwind CSS.
              </p>
              <div className="flex items-center gap-4 p-4 bg-bg-card rounded-lg">
                <Home className="w-4 h-4 text-text-primary" />
                <Home className="w-5 h-5 text-text-primary" />
                <Home className="w-6 h-6 text-text-primary" />
                <Home className="w-8 h-8 text-text-primary" />
                <Home className="w-10 h-10 text-text-primary" />
              </div>
              <CodeExample code={`<Home className="w-4 h-4" />  // 16px
<Home className="w-5 h-5" />  // 20px
<Home className="w-6 h-6" />  // 24px
<Home className="w-8 h-8" />  // 32px
<Home className="w-10 h-10" /> // 40px`} />
            </div>

            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Cores</h4>
              <p className="text-text-secondary">
                Os ícones herdam a cor do texto ou podem ter cores específicas aplicadas.
              </p>
              <div className="flex items-center gap-4 p-4 bg-bg-card rounded-lg">
                <Home className="w-6 h-6 text-text-primary" />
                <Home className="w-6 h-6 text-primary" />
                <Home className="w-6 h-6 text-green-500" />
                <Home className="w-6 h-6 text-red-500" />
                <Home className="w-6 h-6 text-yellow-500" />
                <Home className="w-6 h-6 text-blue-500" />
              </div>
              <CodeExample code={`<Home className="w-6 h-6 text-text-primary" />  // Cor padrão
<Home className="w-6 h-6 text-primary" />      // Cor primária
<Home className="w-6 h-6 text-green-500" />    // Verde
<Home className="w-6 h-6 text-red-500" />      // Vermelho
<Home className="w-6 h-6 text-yellow-500" />   // Amarelo
<Home className="w-6 h-6 text-blue-500" />     // Azul`} />
            </div>

            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Ícones Comuns</h4>
              <p className="text-text-secondary">
                Biblioteca dos ícones mais utilizados no sistema.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { name: 'Home', icon: Home },
                  { name: 'User', icon: User },
                  { name: 'Settings', icon: Settings },
                  { name: 'Search', icon: Search },
                  { name: 'Bell', icon: Bell },
                  { name: 'Mail', icon: Mail },
                  { name: 'Heart', icon: Heart },
                  { name: 'Star', icon: Star },
                  { name: 'Plus', icon: Plus },
                  { name: 'Minus', icon: Minus },
                  { name: 'Edit', icon: Edit },
                  { name: 'Trash', icon: Trash2 },
                  { name: 'Download', icon: Download },
                  { name: 'Upload', icon: Upload },
                  { name: 'Share', icon: Share },
                  { name: 'Copy', icon: Copy },
                  { name: 'Check', icon: Check },
                  { name: 'X', icon: X },
                  { name: 'ChevronLeft', icon: ChevronLeft },
                  { name: 'ChevronRight', icon: ChevronRight },
                  { name: 'ChevronUp', icon: ChevronUp },
                  { name: 'ChevronDown', icon: ChevronDown },
                  { name: 'ArrowLeft', icon: ArrowLeft },
                  { name: 'ArrowRight', icon: ArrowRight },
                  { name: 'ArrowUp', icon: ArrowUp },
                  { name: 'ArrowDown', icon: ArrowDown },
                  { name: 'Menu', icon: Menu },
                  { name: 'Play', icon: Play },
                  { name: 'Pause', icon: Pause },
                  { name: 'Stop', icon: Square },
                  { name: 'Refresh', icon: RefreshCw },
                  { name: 'Save', icon: Save },
                  { name: 'File', icon: File },
                  { name: 'Folder', icon: Folder },
                  { name: 'Image', icon: Image },
                  { name: 'Video', icon: Video },
                  { name: 'Music', icon: Music },
                  { name: 'Calendar', icon: Calendar },
                  { name: 'Clock', icon: Clock },
                  { name: 'Map', icon: MapPin },
                  { name: 'Phone', icon: Phone },
                  { name: 'Globe', icon: Globe },
                  { name: 'Shield', icon: Shield },
                  { name: 'Lock', icon: Lock },
                  { name: 'Unlock', icon: Unlock },
                  { name: 'Eye', icon: Eye },
                  { name: 'EyeOff', icon: EyeOff },
                  { name: 'Zap', icon: Zap },
                  { name: 'Target', icon: Target },
                  { name: 'TrendingUp', icon: TrendingUp },
                  { name: 'TrendingDown', icon: TrendingDown },
                  { name: 'BarChart', icon: BarChart3 },
                  { name: 'PieChart', icon: PieChart },
                  { name: 'LineChart', icon: TrendingUp },
                  { name: 'Activity', icon: Activity },
                  { name: 'Wifi', icon: Wifi },
                  { name: 'WifiOff', icon: WifiOff },
                  { name: 'Battery', icon: Battery },
                  { name: 'BatteryLow', icon: BatteryLow },
                  { name: 'BatteryFull', icon: BatteryFull },
                  { name: 'Volume', icon: Volume2 },
                  { name: 'VolumeOff', icon: VolumeX },
                  { name: 'Sun', icon: Sun },
                  { name: 'Moon', icon: Moon },
                  { name: 'Cloud', icon: Cloud },
                  { name: 'CloudRain', icon: CloudRain },
                  { name: 'CloudSnow', icon: CloudSnow },
                  { name: 'CloudLightning', icon: CloudLightning }
                ].map(({ name, icon: IconComponent }) => (
                  <div key={name} className="flex flex-col items-center p-4 border border-border rounded-lg hover:bg-bg-card transition-colors group">
                    <IconComponent className="w-6 h-6 text-text-primary mb-2 group-hover:text-primary transition-colors" />
                    <span className="text-xs text-text-secondary text-center">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Ícones com Estados</h4>
              <p className="text-text-secondary">
                Exemplos de ícones com diferentes estados visuais.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h5 className="font-medium text-text-primary">Estados de Botão</h5>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Home className="w-4 h-4 mr-2" />
                      Home
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      <Home className="w-4 h-4 mr-2" />
                      Disabled
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h5 className="font-medium text-text-primary">Ícones com Badge</h5>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Bell className="w-6 h-6 text-text-primary" />
                      <Badge className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs">
                        3
                      </Badge>
                    </div>
                    <div className="relative">
                      <Mail className="w-6 h-6 text-text-primary" />
                      <Badge variant="destructive" className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs">
                        !
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h5 className="font-medium text-text-primary">Ícones Animados</h5>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-6 h-6 text-text-primary animate-spin" />
                    <Loader2 className="w-6 h-6 text-text-primary animate-spin" />
                    <Heart className="w-6 h-6 text-red-500 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-semibold text-lg text-text-primary">Importação</h4>
              <p className="text-text-secondary">
                Como importar e usar os ícones em seus componentes.
              </p>
              <CodeExample code={`// Importação individual (recomendado)
import { Home, User, Settings } from 'lucide-react';

// Importação em lote
import * as Icons from 'lucide-react';

// Uso dinâmico
const iconName = 'Home';
const IconComponent = Icons[iconName];

function DynamicIcon() {
  return <IconComponent className="w-5 h-5" />;
}

// Com props
interface IconProps {
  name: keyof typeof Icons;
  size?: number;
  className?: string;
}

function Icon({ name, size = 24, className }: IconProps) {
  const IconComponent = Icons[name];
  return <IconComponent size={size} className={className} />;
}`} />
            </div>
          </CardContent>
        </Card>

        {/* Glassmorphism Effects */}
        <Card id="glassmorphism">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gradient-to-r from-primary to-secondary rounded opacity-50"></div>
              Efeitos Glassmorphism
            </CardTitle>
            <CardDescription>
              Efeitos de vidro fosco e transparências
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-lg glassmorphism-header">
                <h4 className="font-semibold mb-2">Header Glassmorphism</h4>
                <p className="text-sm text-text-secondary">Efeito usado no header principal</p>
              </div>
              <div className="p-6 rounded-lg dropdown-glassmorphism">
                <h4 className="font-semibold mb-2">Dropdown Glassmorphism</h4>
                <p className="text-sm text-text-secondary">Efeito usado nos dropdowns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spacing & Layout */}
        <Card id="spacing">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-5 h-5 bg-text-secondary rounded"></div>
              Espaçamento e Layout
            </CardTitle>
            <CardDescription>
              Padrões de espaçamento e grid system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Espaçamentos</h4>
              <div className="space-y-1">
                <div className="h-2 bg-primary rounded" style={{width: '0.25rem'}}></div>
                <span className="text-xs">1 (0.25rem)</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 bg-primary rounded" style={{width: '0.5rem'}}></div>
                <span className="text-xs">2 (0.5rem)</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 bg-primary rounded" style={{width: '1rem'}}></div>
                <span className="text-xs">4 (1rem)</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 bg-primary rounded" style={{width: '1.5rem'}}></div>
                <span className="text-xs">6 (1.5rem)</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 bg-primary rounded" style={{width: '2rem'}}></div>
                <span className="text-xs">8 (2rem)</span>
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}