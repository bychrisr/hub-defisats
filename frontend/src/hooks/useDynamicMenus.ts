import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Home, Settings, BarChart3, Activity, Shield, Coins, 
  TrendingUp, Image, Info, Package, Code, Candy, Star, User 
} from 'lucide-react';
import { useUserPermissions } from './useUserPermissions';

// Tipos para os dados dos menus
export interface MenuItem {
  id: string;
  name: string;
  mobileName: string | null;
  href: string;
  icon: string;
  order: number;
  isActive: boolean;
  isVisible: boolean;
  target: string;
  badge: string | null;
  badgeColor: string | null;
  description: string;
  menuTypeId: string;
  created_at: string;
  updated_at: string;
  menuType: {
    id: string;
    name: string;
    displayName: string;
    description: string;
    isActive: boolean;
    created_at: string;
    updated_at: string;
  };
}

export interface MenuData {
  main: MenuItem[];
  secondary: MenuItem[];
  user: MenuItem[];
}

const iconMap: Record<string, any> = {
  'Home': Home,
  'Settings': Settings,
  'BarChart3': BarChart3,
  'Activity': Activity,
  'Shield': Shield,
  'Coins': Coins,
  'TrendingUp': TrendingUp,
  'Image': Image,
  'Info': Info,
  'Package': Package,
  'Code': Code,
  'Candy': Candy,
  'Star': Star,
  'User': User,
};

// Função para buscar dados dos menus
const fetchMenus = async (): Promise<MenuData> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://defisats.site'}/api/menu`);
  if (!response.ok) {
    throw new Error('Failed to fetch menus');
  }
  const data = await response.json();
  return data.data;
};

// Hook principal para gerenciar menus dinâmicos
export const useDynamicMenus = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    data: menuData,
    isLoading: queryLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: ['menus'],
    queryFn: fetchMenus,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 3,
  });

  useEffect(() => {
    setIsLoading(queryLoading);
    setError(queryError ? 'Erro ao carregar menus' : null);
  }, [queryLoading, queryError]);

  // Função para obter ícone do menu
  const getMenuIcon = (iconName: string) => {
    return iconMap[iconName] || iconMap['Home'];
  };

  // Função para formatar dados do menu para uso nos componentes
  const formatMenuData = (menuType: 'main' | 'secondary' | 'user') => {
    if (!menuData) return [];
    
    const items = menuData[menuType] || [];
    return items
      .filter(item => item.isActive && item.isVisible)
      .sort((a, b) => a.order - b.order)
      .map(item => ({
        name: item.name,
        mobileName: item.mobileName || item.name,
        href: item.href,
        icon: getMenuIcon(item.icon),
        badge: item.badge,
        badgeColor: item.badgeColor,
        description: item.description,
        target: item.target,
      }));
  };

  // Dados formatados para cada tipo de menu
  const mainMenu = formatMenuData('main');
  const secondaryMenu = formatMenuData('secondary');
  const userMenu = formatMenuData('user');

  return {
    // Estados
    isLoading,
    error,
    
    // Dados brutos
    menuData,
    
    // Dados formatados
    mainMenu,
    secondaryMenu,
    userMenu,
    
    // Funções
    refetch,
    getMenuIcon,
  };
};

// Hook específico para menu principal (usado na navegação desktop e mobile)
export const useMainMenu = () => {
  const { mainMenu, isLoading, error, refetch } = useDynamicMenus();
  
  return {
    menuItems: mainMenu,
    isLoading,
    error,
    refetch,
  };
};

// Hook específico para menu secundário (usado no drawer mobile)
export const useSecondaryMenu = () => {
  const { secondaryMenu, isLoading, error, refetch } = useDynamicMenus();
  
  return {
    menuItems: secondaryMenu,
    isLoading,
    error,
    refetch,
  };
};

// Hook específico para menu do usuário (usado no drawer mobile)
export const useUserMenu = () => {
  const { userMenu, isLoading, error, refetch } = useDynamicMenus();
  
  return {
    menuItems: userMenu,
    isLoading,
    error,
    refetch,
  };
};

// Hook para filtrar menus baseado em permissões do usuário
export const useFilteredMenus = () => {
  const { data: menuData, isLoading, error } = useDynamicMenus();
  const { canAccessRoute } = useUserPermissions();

  const filterMenusByPermissions = (menus: MenuItem[]): MenuItem[] => {
    return menus.filter(menu => {
      // Se o menu não está ativo ou visível, não mostrar
      if (!menu.isActive || !menu.isVisible) {
        return false;
      }

      // Verificar se o usuário pode acessar a rota
      return canAccessRoute(menu.href);
    });
  };

  if (!menuData) {
    return { menuData: null, isLoading, error };
  }

  const filteredData: MenuData = {
    main: filterMenusByPermissions(menuData.main),
    secondary: filterMenusByPermissions(menuData.secondary),
    user: filterMenusByPermissions(menuData.user),
  };

  return { menuData: filteredData, isLoading, error };
};
