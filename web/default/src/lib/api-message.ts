import i18next from 'i18next'

const EMAIL_DOMAIN_NOT_ALLOWED_PATTERN =
  /^Email domain (.+) is not allowed\. Please check whether the email address was typed correctly or use an allowed email domain\.$/

export function translateApiMessage(message?: string, fallback?: string) {
  const trimmedMessage = message?.trim()
  if (trimmedMessage) {
    const emailDomainMatch = trimmedMessage.match(
      EMAIL_DOMAIN_NOT_ALLOWED_PATTERN
    )
    if (emailDomainMatch) {
      return i18next.t(
        'Email domain {{domain}} is not allowed. Please check whether the email address was typed correctly or use an allowed email domain.',
        { domain: emailDomainMatch[1] }
      )
    }
    return i18next.t(trimmedMessage)
  }
  return fallback ? i18next.t(fallback) : ''
}
