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
import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Button } from '@/components/ui/button'
import { Markdown } from '@/components/ui/markdown'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { useHomePageContent } from './hooks'

const BRAND_NAME = 'AI充电站'
const BRAND_LOGO_SRC = '/ai-charging-station-logo.png'
const WECHAT_QR_SRC = '/wechat-contact.jpg'

const modelGroups = [
  {
    provider: 'Gemini',
    models: ['nanobanana', 'nanobanana2', 'nanobananapro'],
  },
  {
    provider: 'GPT',
    models: ['image2'],
  },
  {
    provider: 'Midjourney',
    models: ['Midjourney'],
  },
] as const

const gridLines = Array.from({ length: 13 }, (_, index) => index)

function BrandMark() {
  return (
    <img
      src={BRAND_LOGO_SRC}
      alt=''
      className='h-full w-full object-contain'
      aria-hidden='true'
    />
  )
}

export function Home() {
  const { t } = useTranslation()
  const { auth } = useAuthStore()
  const isAuthenticated = !!auth.user
  const { content, isLoaded, isUrl } = useHomePageContent()
  const { systemName } = useSystemConfig()
  const layoutBrandProps = {
    siteName: BRAND_NAME,
    logo: <BrandMark />,
    showNotifications: false,
    headerProps: {
      showSiteName: false,
      logoContainerClassName: 'h-11 w-44 sm:h-12 sm:w-52',
    },
  }

  useEffect(() => {
    const applyHomeTitle = () => {
      document.title = BRAND_NAME
      const metaTitle = document.querySelector(
        'meta[name="title"]'
      ) as HTMLMetaElement | null
      metaTitle?.setAttribute('content', BRAND_NAME)
    }

    applyHomeTitle()
    const timers = [600, 1800].map((delay) =>
      window.setTimeout(applyHomeTitle, delay)
    )
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [systemName])

  const renderConsoleAction = () => {
    if (isAuthenticated) {
      return (
        <Button
          variant='outline'
          className='h-11 gap-2 rounded-none border-[#0A0A0A] bg-[#FAFAF8] px-5 font-semibold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAFAF8] dark:border-[#0A0A0A] dark:bg-[#FAFAF8] dark:text-[#0A0A0A] dark:hover:bg-[#0A0A0A] dark:hover:text-[#FAFAF8]'
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
        className='h-11 rounded-none border-[#0A0A0A] bg-[#FAFAF8] px-5 font-semibold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAFAF8] dark:border-[#0A0A0A] dark:bg-[#FAFAF8] dark:text-[#0A0A0A] dark:hover:bg-[#0A0A0A] dark:hover:text-[#FAFAF8]'
        render={<Link to='/sign-in' />}
      >
        {t('Sign in')}
      </Button>
    )
  }

  if (!isLoaded) {
    return (
      <PublicLayout showMainContainer={false} {...layoutBrandProps}>
        <main className='flex min-h-screen items-center justify-center'>
          <div className='text-muted-foreground'>{t('Loading...')}</div>
        </main>
      </PublicLayout>
    )
  }

  if (content) {
    return (
      <PublicLayout showMainContainer={false} {...layoutBrandProps}>
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
    <PublicLayout showMainContainer={false} {...layoutBrandProps}>
      <main className='relative min-h-screen overflow-hidden bg-[#FAFAF8] pt-16 text-[#0A0A0A] dark:bg-[#FAFAF8] dark:text-[#0A0A0A]'>
        <div className='pointer-events-none absolute inset-x-0 top-16 h-3 bg-[#C5E803]' />
        <div
          className='pointer-events-none absolute inset-x-4 top-16 bottom-0 hidden max-w-7xl md:inset-x-6 md:mx-auto md:block'
          aria-hidden='true'
        >
          {gridLines.map((line) => (
            <span
              key={line}
              className='absolute top-0 bottom-0 w-px bg-[#D4D4D2]'
              style={{ left: `${(line / 12) * 100}%` }}
            />
          ))}
        </div>

        <section className='relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-stretch gap-8 px-4 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-6 md:py-14'>
          <div className='flex flex-col justify-between border-t border-[#0A0A0A] pt-6'>
            <div>
              <div className='grid grid-cols-[4.5rem_1fr] items-start gap-4 text-[#737373]'>
                <div className='font-mono text-sm font-semibold'>01</div>
                <div className='text-sm font-semibold tracking-[0.28em] uppercase'>
                  {t('Available Models')}
                </div>
              </div>

              <h1 className='mt-12 max-w-[38rem] text-[clamp(3rem,6.7vw,6.8rem)] leading-[0.9] font-extralight tracking-normal whitespace-nowrap text-[#0A0A0A]'>
                {BRAND_NAME}
              </h1>
            </div>

            <div className='mt-10 border-t border-[#0A0A0A] pt-6 md:mt-0'>
              <p className='max-w-[33rem] text-lg leading-8 font-normal text-[#0A0A0A] md:text-xl'>
                <span className='block font-medium'>
                  {t('Model access, simplified.')}
                </span>
                <span className='font-normal text-[#737373]'>
                  {t(
                    'Pick a model and start fast. The homepage keeps only the essentials.'
                  )}
                </span>
              </p>

              <div className='mt-8 flex flex-wrap items-center gap-3'>
                <Button
                  className='h-11 gap-2 rounded-none border border-[#0A0A0A] bg-[#C5E803] px-5 font-semibold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FAFAF8]'
                  render={<Link to='/pricing' />}
                >
                  {t('Explore Models')}
                  <ArrowRight className='size-4' />
                </Button>
                {renderConsoleAction()}
              </div>
            </div>
          </div>

          <div className='flex min-h-[34rem] flex-col border border-[#0A0A0A] bg-[#FAFAF8]'>
            <div className='flex items-start justify-between gap-4 border-b border-[#0A0A0A] bg-[#C5E803] px-4 py-5 sm:px-6'>
              <div>
                <div className='font-mono text-xs font-semibold tracking-[0.24em] uppercase'>
                  {t('{{count}} models', {
                    count: modelGroups.reduce(
                      (total, group) => total + group.models.length,
                      0
                    ),
                  })}
                </div>
                <div className='mt-2 text-[clamp(2.15rem,5.2vw,4rem)] leading-[0.9] font-extralight tracking-normal'>
                  {t('Available Models')}
                </div>
              </div>
              <div className='border border-[#0A0A0A] bg-[#FAFAF8] px-3 py-1.5 text-xs font-semibold'>
                {t('Online')}
              </div>
            </div>

            <div className='grid flex-1 gap-3 p-4 md:p-6'>
              {modelGroups.map((group, index) => (
                <div
                  key={group.provider}
                  className='group grid min-h-[8.5rem] gap-4 border border-[#0A0A0A] bg-[#FAFAF8] p-4 transition-colors duration-150 hover:bg-[#0A0A0A] hover:text-[#FAFAF8] sm:p-5 lg:grid-cols-[minmax(18rem,0.9fr)_1fr] lg:items-center'
                >
                  <div>
                    <div className='flex items-start justify-between gap-3 font-mono text-xs font-semibold tracking-[0.18em] uppercase sm:block'>
                      <span>0{index + 1}</span>
                      <span className='bg-[#C5E803] px-2 py-1 text-[#0A0A0A] sm:mt-3 sm:inline-block'>
                        {t('Ready')}
                      </span>
                    </div>
                    <div className='mt-4 text-[clamp(2.65rem,4vw,3.2rem)] leading-[0.9] font-light tracking-normal'>
                      {group.provider}
                    </div>
                  </div>

                  <div className='grid gap-2'>
                    {group.models.map((model) => (
                      <div
                        key={model}
                        className='border border-current px-3 py-2 font-mono text-sm font-medium tracking-[0.04em] break-all group-hover:bg-[#FAFAF8] group-hover:text-[#0A0A0A]'
                      >
                        {model}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className='grid grid-cols-3 border-t border-[#0A0A0A] font-mono text-[11px] font-semibold tracking-[0.22em] uppercase'>
              <div className='px-3 py-4'>Gemini</div>
              <div className='border-x border-[#0A0A0A] px-3 py-4'>GPT</div>
              <div className='px-3 py-4 text-right'>Midjourney</div>
            </div>
          </div>
        </section>
      </main>
      <Footer
        name={BRAND_NAME}
        logo={BRAND_LOGO_SRC}
        contactQrSrc={WECHAT_QR_SRC}
      />
    </PublicLayout>
  )
}
