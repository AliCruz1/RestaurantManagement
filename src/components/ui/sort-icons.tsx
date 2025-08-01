import { ArrowUpIcon, ArrowDownIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

export const SortIcon = ({ direction, color }: { direction: 'asc' | 'desc', color?: string }) => {
  if (direction === 'asc') {
    return <ArrowUpIcon className={`w-4 h-4 ${color || 'text-blue-400'} inline`} aria-label="Ascending" />;
  } else {
    return <ArrowDownIcon className={`w-4 h-4 ${color || 'text-blue-400'} inline`} aria-label="Descending" />;
  }
};

export const InfoIcon = () => (
  <InformationCircleIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
);
