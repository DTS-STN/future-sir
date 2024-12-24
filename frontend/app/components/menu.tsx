import type { ComponentProps} from "react";
import { useState } from "react"
import { useTranslation } from "react-i18next";
import { cn } from "~/utils/tailwind-utils";
import { InlineLink } from "./inline-link";

type MenuItemProps = ComponentProps<typeof InlineLink>

export function MenuItem({children, ...props}: MenuItemProps) {
  return (
    <InlineLink 
      role="menuitem"
      id="menu-item"
      className="hover:text-blue-950 active:text-white focus:text-blue-400 text-md text-white block px-4 py-2 text-md hover:bg-slate-300 focus:bg-slate-600 active:bg-slate-800 text-md"
      {...props}
    >
      {children}
    </InlineLink>
  )
}

interface MenuProps {
  className?: string;
  children: React.ReactNode;
}

export function Menu({ className, children }: MenuProps) {
  const { t } = useTranslation(['gcweb']);
  const [open, setOpen] = useState(false);
  const baseClassName = cn(`${open ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-slate-700 text-white hover:bg-slate-600"} hover:underline text-lg inline-flex justify-center space-x-2 rounded-b-md border-b border-l border-r border-slate-700 px-4 py-2 ring-black ring-opacity-5`);

  const onClick = () => {
    setOpen((value) => !value)
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={onClick}
        className={cn(baseClassName, className)}
        aria-haspopup={true}
        aria-expanded={open}
      >
        <span>{t('gcweb:app.menu')}</span>
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 my-auto">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        )}
      </button>
      {open && (
        <div className="origin-top-left absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-slate-700 ring-1 ring-black ring-opacity-5"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
