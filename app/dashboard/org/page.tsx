import { redirect } from 'next/navigation'

export default function OrgRedirectPage() {
  redirect('/dashboard/workspace?tab=org')
}
