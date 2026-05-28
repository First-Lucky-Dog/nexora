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
  ArrowRight,
  BookOpen,
  Image as ImageIcon,
  PenLine,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { useStatus } from '@/hooks/use-status'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { useHomePageContent } from './hooks'

const modelTags = [
  'Prompt optimization',
  'Text to image',
  'Style control',
  'High detail output',
]

const ambientTokens = [
  { text: '/imagine', className: 'top-[18%] left-[12%]' },
  { text: 'seed', className: 'top-[24%] right-[14%]' },
  { text: 'cfg', className: 'bottom-[22%] left-[8%]' },
  { text: '{}', className: 'bottom-[16%] right-[9%]' },
  { text: 'prompt.expand', className: 'top-[48%] left-[3%]' },
  { text: 'style.lock', className: 'bottom-[38%] right-[4%]' },
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

  const renderConsoleAction = () => {
    if (isAuthenticated) {
      return (
        <Button
          variant='outline'
          className='border-foreground/20 h-11 gap-2 rounded-lg px-5'
          render={<Link to='/dashboard' />}
        >
          {t('Enter Console')}
          <ArrowRight className='size-4' />
        </Button>
      )
    }

    return (
      <Button
        variant='outline'
        className='border-foreground/20 h-11 rounded-lg px-5'
        render={<Link to='/sign-in' />}
      >
        {t('Sign in')}
      </Button>
    )
  }

  const renderDocsAction = () => {
    const isExternal = docsUrl.startsWith('http')
    if (isExternal) {
      return (
        <Button
          variant='outline'
          className='border-foreground/15 bg-background/70 h-9 gap-2 rounded-lg px-3 text-xs'
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
        className='border-foreground/15 bg-background/70 h-9 gap-2 rounded-lg px-3 text-xs'
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
      <main className='bg-background text-foreground relative min-h-screen overflow-hidden pt-16'>
        <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.16)_1px,transparent_0)] [background-size:88px_88px] opacity-35 dark:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.16)_1px,transparent_0)]' />
        <div className='pointer-events-none absolute inset-x-0 top-16 h-px bg-amber-400/40' />
        {ambientTokens.map((token) => (
          <span
            key={token.text}
            className={`text-muted-foreground/30 pointer-events-none absolute hidden text-xs font-semibold md:block ${token.className}`}
            aria-hidden='true'
          >
            {token.text}
          </span>
        ))}

        <section className='relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-4 pt-14 pb-10 md:grid-cols-[0.78fr_1.22fr] md:px-6 md:pt-8'>
          <div className='mx-auto max-w-xl text-center md:mx-0 md:text-left'>
            <div className='border-foreground mb-7 inline-flex items-center gap-2 rounded-lg border-2 bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-[5px_5px_0_rgba(15,23,42,0.95)]'>
              <Sparkles className='size-4' />
              {t('Focused model access')}
            </div>

            <h1 className='text-[clamp(2.4rem,6.5vw,4.9rem)] leading-[0.96] font-black tracking-normal'>
              <span className='block md:whitespace-nowrap'>
                {t('Enough inspiration,')}
              </span>
              <span className='block md:whitespace-nowrap'>
                {t('let Linghui handle the rest.')}
              </span>
            </h1>

            <p className='text-muted-foreground mt-6 max-w-[34rem] text-base leading-7 md:text-lg'>
              {t(
                'Aggregate leading image generation and prompt models to help you move from text description to visual output faster.'
              )}
            </p>

            <div className='mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start'>
              <Button
                className='border-foreground bg-foreground text-background hover:bg-foreground/90 h-11 gap-2 rounded-lg border-2 px-5 shadow-[5px_5px_0_rgba(245,158,11,0.55)]'
                render={<Link to='/pricing' />}
              >
                {t('Explore Models')}
                <ArrowRight className='size-4' />
              </Button>
              {renderConsoleAction()}
            </div>

            <div className='mt-7 hidden flex-wrap items-center justify-center gap-2 md:flex md:justify-start'>
              {modelTags.map((tag) => (
                <span
                  key={tag}
                  className='border-foreground/10 bg-background/75 text-muted-foreground rounded-lg border px-3 py-1.5 text-xs font-medium'
                >
                  {t(tag)}
                </span>
              ))}
            </div>
          </div>

          <div className='relative mx-auto grid w-full max-w-[52rem] items-center gap-4 md:grid-cols-[0.92fr_auto_1.15fr] md:gap-3'>
            <div className='home-bubble-in border-foreground bg-background relative z-10 mx-2 rounded-lg border-2 p-4 shadow-[8px_8px_0_rgba(245,158,11,0.55)] md:mx-0 md:p-5'>
              <div className='mb-4 flex items-center justify-between gap-3'>
                <div>
                  <div className='text-muted-foreground text-xs font-semibold'>
                    {t('Prompt optimization')}
                  </div>
                  <div className='mt-1 text-lg font-black'>{systemName}</div>
                </div>
                <div className='flex size-9 items-center justify-center rounded-lg bg-sky-500 text-white'>
                  <PenLine className='size-4' />
                </div>
              </div>

              <div className='space-y-3'>
                <div className='bg-muted/70 text-muted-foreground border-foreground/10 max-w-[88%] rounded-lg border px-4 py-3 text-sm leading-6'>
                  {t('Please optimize this image prompt.')}
                </div>
                <div className='ml-auto max-w-[94%] rounded-lg border-2 border-amber-300 bg-amber-400 px-4 py-3 text-sm leading-6 font-black text-slate-950 shadow-[4px_4px_0_rgba(15,23,42,0.95)]'>
                  {t(
                    'A cyberpunk mechanical Persian cat, neon lighting, 8k, extreme detail'
                  )}
                </div>
                <div className='border-foreground/10 bg-background/80 text-muted-foreground rounded-lg border px-4 py-3 text-xs leading-5'>
                  {t(
                    'Prompt model refines style, texture, lighting, and detail.'
                  )}
                </div>
              </div>
            </div>

            <div className='home-route-pulse z-20 mx-auto flex items-center justify-center md:w-24'>
              <div className='border-foreground flex items-center gap-2 rounded-lg border-2 bg-amber-400 px-4 py-3 text-sm font-black whitespace-nowrap text-slate-950 shadow-[5px_5px_0_rgba(15,23,42,0.95)]'>
                <span>{t('Image route')}</span>
                <ArrowRight className='hidden size-4 md:block' />
              </div>
            </div>

            <div className='home-card-float border-foreground bg-background relative z-10 mx-2 rounded-lg border-2 p-3 shadow-[10px_10px_0_rgba(15,23,42,0.95)] md:mx-0 dark:shadow-[10px_10px_0_rgba(245,158,11,0.5)]'>
              <div className='border-foreground absolute -top-4 right-6 z-20 rounded-lg border-2 bg-sky-500 px-3 py-2 text-xs font-black text-white shadow-[4px_4px_0_rgba(15,23,42,0.95)]'>
                {t('Generated image')}
              </div>
              <div className='border-foreground/20 overflow-hidden rounded-md border'>
                <img
                  src='/home-cyber-cat.png'
                  alt={t('Cyberpunk mechanical Persian cat')}
                  className='aspect-[1.02] w-full object-cover'
                />
              </div>
              <div className='mt-3 flex items-center justify-between gap-3 px-1'>
                <div>
                  <div className='text-sm font-black'>
                    {t('Cyber Persian Cat')}
                  </div>
                  <div className='text-muted-foreground mt-1 text-xs'>
                    {t('Neon city / mechanical detail / 8k mood')}
                  </div>
                </div>
                {renderDocsAction()}
              </div>
            </div>
          </div>
        </section>

        <section className='border-foreground/10 relative border-t px-4 py-8 md:px-6'>
          <div className='mx-auto grid max-w-6xl gap-3 sm:grid-cols-3'>
            {[
              ['Prompt optimization', 'Make rough ideas more complete.'],
              ['Text to image', 'Route polished prompts to image models.'],
              [
                'Creative expression',
                'Finish visual ideas with less friction.',
              ],
            ].map(([title, description]) => (
              <div
                key={title}
                className='border-foreground/10 bg-background/80 rounded-lg border p-4'
              >
                <div className='mb-3 flex size-9 items-center justify-center rounded-lg bg-amber-400 text-slate-950'>
                  <ImageIcon className='size-4' />
                </div>
                <h2 className='text-sm font-black'>{t(title)}</h2>
                <p className='text-muted-foreground mt-2 text-xs leading-5'>
                  {t(description)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </PublicLayout>
  )
}
