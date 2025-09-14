export const useFormatPercentage = () => {
  return (value: number): string => {
    if (value === 0) return '0%';
    if (value > 0) return `+${value.toFixed(2)}%`;
    return `${value.toFixed(2)}%`;
  };
};
