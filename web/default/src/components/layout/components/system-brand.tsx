/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { isWordmarkLogo } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type SystemBrandProps = {
  defaultName?: string
  defaultVersion?: string
  /**
   * Visual layout:
   * - 'sidebar': stacked card style (used inside the sidebar header).
   * - 'inline': compact horizontal pill (used inside the top app bar).
   */
  variant?: 'sidebar' | 'inline'
}

/**
 * System brand component
 * Displays current system logo + name.
 * - inline: compact pill in the top app bar; clicking navigates to home (/)
 * - sidebar: stacked card in the sidebar header (display only)
 */
export function SystemBrand(props: SystemBrandProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { logo } = useSystemConfig()

  const variant = props.variant ?? 'sidebar'
  const name = status?.system_name || props.defaultName || 'New API'
  const version =
    status?.version || props.defaultVersion || t('Unknown version')
  const logoIsWordmark = isWordmarkLogo(logo)

  if (variant === 'inline') {
    return (
      <Link
        to='/'
        aria-label={t('Go to home')}
        className={cn(
          'text-foreground inline-flex items-center gap-1.5 rounded-md px-1.5 text-sm font-medium transition-colors outline-none select-none',
          logoIsWordmark ? 'h-9' : 'h-7',
          'hover:bg-accent focus-visible:ring-ring/40 focus-visible:ring-2'
        )}
      >
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden',
            logoIsWordmark ? 'h-8 w-36 rounded-none' : 'size-5 rounded-md'
          )}
        >
          <img
            src={logo}
            alt={t('Logo')}
            className={cn(
              logoIsWordmark
                ? 'h-full w-full object-contain'
                : 'size-full rounded-md object-cover'
            )}
          />
        </div>
        {!logoIsWordmark && (
          <span className='max-w-[12rem] truncate'>{name}</span>
        )}
      </Link>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='hover:text-sidebar-foreground active:text-sidebar-foreground cursor-default hover:bg-transparent active:bg-transparent'
          render={<div />}
        >
          <div
            className={cn(
              'flex items-center justify-center overflow-hidden',
              logoIsWordmark
                ? 'h-8 w-32 rounded-none'
                : 'aspect-square size-8 rounded-lg'
            )}
          >
            <img
              src={logo}
              alt={t('Logo')}
              className={cn(
                logoIsWordmark
                  ? 'h-full w-full object-contain'
                  : 'size-full rounded-lg object-cover'
              )}
            />
          </div>
          <div
            className={cn(
              'grid flex-1 text-start text-sm leading-tight group-data-[collapsible=icon]:hidden',
              logoIsWordmark && 'sr-only'
            )}
          >
            <span className='truncate font-semibold'>{name}</span>
            <span className='truncate text-xs'>{version}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
