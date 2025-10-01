// TradingView Widget Types
declare global {
  interface Window {
    TradingView: {
      widget: (config: TradingViewWidgetConfig) => TradingViewWidget;
    };
  }
}

interface TradingViewWidgetConfig {
  container_id: string;
  width: string | number;
  height: string | number;
  symbol: string;
  interval: string;
  timezone: string;
  theme: 'light' | 'dark';
  style: string;
  locale: string;
  toolbar_bg: string;
  enable_publishing: boolean;
  allow_symbol_change: boolean;
  details: boolean;
  hotlist: boolean;
  calendar: boolean;
  hide_side_toolbar: boolean;
  hide_top_toolbar: boolean;
  hide_legend: boolean;
  studies: string[];
  show_popup_button: boolean;
  popup_width: string;
  popup_height: string;
}

interface TradingViewWidget {
  remove: () => void;
  onChartReady: (callback: () => void) => void;
}

export {};
