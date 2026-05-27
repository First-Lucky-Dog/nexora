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
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  Boxes,
  CheckCircle2,
  Gauge,
  KeyRound,
  Layers3,
  LockKeyhole,
  Route,
  ShieldCheck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { useStatus } from '@/hooks/use-status'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { useHomePageContent } from './hooks'

const protocolItems = ['OpenAI', 'Claude', 'Gemini', 'Responses']

const metricItems = [
  {
    value: '50+',
    label: 'Provider routes',
    description: 'Connect upstream model providers behind one endpoint',
  },
  {
    value: '100+',
    label: 'Billing models',
    description: 'Keep model usage and quota settlement visible',
  },
  {
    value: '24/7',
    label: 'Gateway logs',
    description: 'Trace requests, channels, and token consumption',
  },
]

const capabilityItems = [
  {
    icon: Route,
    title: 'Unified routing',
    description:
      'Route OpenAI-compatible, Claude, Gemini, embedding, rerank, image, audio, and video requests through one gateway.',
  },
  {
    icon: BadgeDollarSign,
    title: 'Clear metering',
    description:
      'Keep pricing, model ratios, quota, and usage logs aligned for admins and end users.',
  },
  {
    icon: ShieldCheck,
    title: 'Operational control',
    description:
      'Manage keys, groups, rate limits, provider health, and access policies without changing client integrations.',
  },
]

const workflowItems = [
  {
    icon: KeyRound,
    title: 'Keys',
    description: 'Issue scoped tokens for users and apps',
  },
  {
    icon: Layers3,
    title: 'Channels',
    description: 'Balance traffic across configured providers',
  },
  {
    icon: Gauge,
    title: 'Usage',
    description: 'Review logs, quota, latency, and spend',
  },
]

const healthRows = [
  { name: 'OpenAI-compatible', status: 'Healthy', tone: 'bg-emerald-500' },
  { name: 'Claude Messages', status: 'Ready', tone: 'bg-blue-500' },
  { name: 'Gemini format', status: 'Observed', tone: 'bg-amber-500' },
]

export function Home() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const { status } = useStatus()
  const isAuthenticated = !!auth.user
  const { content, isLoaded, isUrl } = useHomePageContent()
  const systemName = (status?.system_name as string | undefined) || 'New API'
  const docsUrl =
    (status?.docs_link as string | undefined) || 'https://docs.newapi.pro'

  const renderPrimaryAction = () => {
    if (isAuthenticated) {
      return (
        <Button
          className='h-10 gap-2 rounded-lg px-4'
          render={<Link to='/dashboard' />}
        >
          {t('Go to Dashboard')}
          <ArrowRight className='size-4' />
        </Button>
      )
    }

    return (
      <Button
        className='h-10 gap-2 rounded-lg px-4'
        render={<Link to='/sign-up' />}
      >
        {t('Get Started')}
        <ArrowRight className='size-4' />
      </Button>
    )
  }

  const renderDocsAction = () => {
    const isExternal = docsUrl.startsWith('http')
    if (isExternal) {
      return (
        <Button
          variant='outline'
          className='h-10 gap-2 rounded-lg px-4'
          render={
            <a href={docsUrl} target='_blank' rel='noopener noreferrer' />
          }
        >
          <BookOpen className='size-4' />
          {t('Docs')}
        </Button>
      )
    }

    return (
      <Button
        variant='outline'
        className='h-10 gap-2 rounded-lg px-4'
        render={<Link to={docsUrl} />}
      >
        <BookOpen className='size-4' />
        {t('Docs')}
      </Button>
    )
  }

  if (!isLoaded) {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='flex min-h-screen items-center justify-center'>
          <div className='text-muted-foreground'>{t('Loading...')}</div>
        </main>
      </PublicLayout>
    )
  }

  if (content) {
    return (
      <PublicLayout showMainContainer={false}>
        <main className='overflow-x-hidden'>
          {isUrl ? (
            <iframe
              src={content}
              className='h-screen w-full border-none'
              title={t('Custom Home Page')}
            />
          ) : (
            <div className='container mx-auto py-8'>
              <Markdown className='custom-home-content'>{content}</Markdown>
            </div>
          )}
        </main>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout showMainContainer={false}>
      <main className='min-h-screen overflow-hidden pt-24'>
        <section className='border-border/50 border-b px-4 pb-16 md:px-6 md:pb-20'>
          <div className='mx-auto flex max-w-6xl flex-col gap-12'>
            <div className='mx-auto flex max-w-3xl flex-col items-center text-center'>
              <div className='border-border bg-muted/35 text-muted-foreground mb-6 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium'>
                <Activity className='size-3.5 text-emerald-600 dark:text-emerald-400' />
                {t('AI gateway workspace')}
              </div>

              <h1 className='max-w-[18rem] text-3xl leading-tight font-semibold break-words sm:max-w-3xl sm:text-4xl md:text-5xl'>
                {t('One calm front door for every model.')}
              </h1>
              <p className='text-muted-foreground mt-5 max-w-[21rem] text-base leading-7 break-words sm:max-w-2xl md:text-lg'>
                {t(
                  'Operate providers, keys, billing, and logs from a single gateway that stays compatible with your current New API system settings.'
                )}
              </p>

              <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
                {renderPrimaryAction()}
                {renderDocsAction()}
                {!isAuthenticated ? (
                  <Button
                    variant='ghost'
                    className='h-10 rounded-lg px-4'
                    render={<Link to='/pricing' />}
                  >
                    {t('View Pricing')}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className='border-border/70 bg-card mx-auto w-full max-w-5xl overflow-hidden rounded-lg border shadow-sm'>
              <div className='border-border/70 bg-muted/25 flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-2'>
                  <div className='bg-background border-border flex size-8 items-center justify-center rounded-lg border'>
                    <Boxes className='text-muted-foreground size-4' />
                  </div>
                  <div>
                    <div className='text-sm font-medium'>{systemName}</div>
                    <div className='text-muted-foreground text-xs'>
                      {t('Live gateway overview')}
                    </div>
                  </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  {protocolItems.map((item) => (
                    <span
                      key={item}
                      className='border-border bg-background text-muted-foreground rounded-md border px-2 py-1 text-xs'
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className='grid gap-0 lg:grid-cols-[1.2fr_0.8fr]'>
                <div className='border-border/70 border-b p-5 lg:border-r lg:border-b-0'>
                  <div className='mb-5 flex items-center justify-between gap-4'>
                    <div>
                      <h2 className='text-sm font-semibold'>
                        {t('Request pipeline')}
                      </h2>
                      <p className='text-muted-foreground mt-1 text-xs'>
                        {t('A simple path from client apps to upstream models')}
                      </p>
                    </div>
                    <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                      <span className='size-2 rounded-sm bg-emerald-500' />
                      {t('Online')}
                    </div>
                  </div>

                  <div className='grid gap-3 md:grid-cols-3'>
                    {workflowItems.map((item, index) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.title}
                          className='border-border/70 bg-background rounded-lg border p-4'
                        >
                          <div className='mb-4 flex items-center justify-between'>
                            <div className='border-border bg-muted/40 flex size-9 items-center justify-center rounded-lg border'>
                              <Icon className='text-foreground/70 size-4' />
                            </div>
                            <span className='text-muted-foreground text-xs'>
                              0{index + 1}
                            </span>
                          </div>
                          <h3 className='text-sm font-medium'>
                            {t(item.title)}
                          </h3>
                          <p className='text-muted-foreground mt-2 text-xs leading-5'>
                            {t(item.description)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className='p-5'>
                  <div className='mb-5'>
                    <h2 className='text-sm font-semibold'>
                      {t('Route health')}
                    </h2>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {t('Keep channel status readable at a glance')}
                    </p>
                  </div>

                  <div className='space-y-3'>
                    {healthRows.map((row) => (
                      <div
                        key={row.name}
                        className='border-border/70 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5'
                      >
                        <div className='flex min-w-0 items-center gap-2'>
                          <span
                            className={`size-2.5 shrink-0 rounded-sm ${row.tone}`}
                          />
                          <span className='truncate text-sm'>{row.name}</span>
                        </div>
                        <span className='text-muted-foreground shrink-0 text-xs'>
                          {t(row.status)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className='bg-muted/30 mt-5 rounded-lg p-4'>
                    <div className='flex items-start gap-3'>
                      <LockKeyhole className='text-muted-foreground mt-0.5 size-4' />
                      <p className='text-muted-foreground text-xs leading-5'>
                        {t(
                          'Existing navigation, authentication, documentation links, and custom home page overrides continue to work.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='px-4 py-12 md:px-6'>
          <div className='mx-auto grid max-w-6xl gap-4 md:grid-cols-3'>
            {metricItems.map((item) => (
              <div
                key={item.label}
                className='border-border/70 rounded-lg border p-5'
              >
                <div className='text-3xl font-semibold'>{item.value}</div>
                <h2 className='mt-3 text-sm font-medium'>{t(item.label)}</h2>
                <p className='text-muted-foreground mt-2 text-sm leading-6'>
                  {t(item.description)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className='border-border/50 border-t px-4 py-14 md:px-6 md:py-16'>
          <div className='mx-auto max-w-6xl'>
            <div className='mb-8 max-w-2xl'>
              <h2 className='text-2xl font-semibold md:text-3xl'>
                {t('Built for daily API operations')}
              </h2>
              <p className='text-muted-foreground mt-3 text-sm leading-6 md:text-base'>
                {t(
                  'A quieter homepage that points users to the product quickly while keeping the gateway value clear.'
                )}
              </p>
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
              {capabilityItems.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className='border-border/70 bg-card rounded-lg border p-5'
                  >
                    <div className='mb-5 flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400'>
                      <Icon className='size-4' />
                    </div>
                    <h3 className='text-base font-semibold'>{t(item.title)}</h3>
                    <p className='text-muted-foreground mt-3 text-sm leading-6'>
                      {t(item.description)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className='px-4 py-14 md:px-6 md:py-16'>
          <div className='mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]'>
            <div>
              <h2 className='text-2xl font-semibold md:text-3xl'>
                {t('Compatible with the current system')}
              </h2>
              <p className='text-muted-foreground mt-3 text-sm leading-6 md:text-base'>
                {t(
                  'The new homepage stays inside the default frontend and uses existing status, auth, docs, pricing, and dashboard routes.'
                )}
              </p>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              {[
                'System name and logo',
                'Docs link setting',
                'Pricing route',
                'Dashboard route',
                'Custom home page content',
                'Public header and footer',
              ].map((item) => (
                <div
                  key={item}
                  className='border-border/70 flex items-center gap-3 rounded-lg border px-4 py-3'
                >
                  <CheckCircle2 className='size-4 shrink-0 text-emerald-600 dark:text-emerald-400' />
                  <span className='text-sm'>{t(item)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </PublicLayout>
  )
}
