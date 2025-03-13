import type { ReactNode } from 'react';

import {
  faCheckCircle,
  faCircleInfo,
  faCommentDots,
  faExclamationCircle,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { cn } from '~/utils/tailwind-utils';

export type AlertType = 'warning' | 'success' | 'danger' | 'info' | 'comment';

export interface ContextualAlertProps {
  children: ReactNode;
  type: AlertType;
}

const alertBackgroundColors: Partial<Record<AlertType, string>> & { default: string } = {
  comment: 'bg-sky-50',
  default: 'bg-white',
};

const alertBorderColors: Partial<Record<AlertType, string>> & { default: string } = {
  comment: 'border-l-sky-800',
  danger: 'border-l-red-700',
  default: 'border-l-gray-700',
  info: 'border-l-cyan-700',
  warning: 'border-l-amber-700',
  success: 'border-l-green-700',
};

export function ContextualAlert(props: ContextualAlertProps) {
  const { children, type } = props;

  const alertBackgroundColor = alertBackgroundColors[type] ?? alertBackgroundColors.default;
  const alertBorderColor = alertBorderColors[type] ?? alertBorderColors.default;

  return (
    <div className={cn('relative pl-4 sm:pl-6', alertBackgroundColor)}>
      <div className={cn('absolute top-3 left-2 py-1 sm:left-4', alertBackgroundColor)}>
        <Icon type={type} />
      </div>
      <div className={cn('overflow-auto border-l-4 pt-3 pb-2.5 pl-6', alertBorderColor)}>{children}</div>
    </div>
  );
}

function Icon({ type }: { type: string }) {
  switch (type) {
    case 'warning':
      return <FontAwesomeIcon icon={faExclamationTriangle} className="size-5 text-amber-700" data-testid="warning" />;
    case 'success':
      return <FontAwesomeIcon icon={faCheckCircle} className="size-5 text-green-700" data-testid="success" />;
    case 'danger':
      return <FontAwesomeIcon icon={faExclamationCircle} className="size-5 text-red-700" data-testid="danger" />;
    case 'info':
      return <FontAwesomeIcon icon={faCircleInfo} className="size-5 text-cyan-700" data-testid="info" />;
    case 'comment':
      return <FontAwesomeIcon icon={faCommentDots} className="size-5 text-sky-800" data-testid="comment" />;
    default:
      break;
  }
}
