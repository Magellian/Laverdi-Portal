import { redirect } from 'next/navigation'

export default function DocsRedirectPage() {
  redirect('/dashboard/workspace?tab=docs')
}
