import { redirect } from 'next/navigation'

export default function BoardRedirectPage() {
  redirect('/dashboard/workspace?tab=board')
}
