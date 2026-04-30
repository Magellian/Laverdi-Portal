/**
 * TrialStatus Component
 * Shows countdown + upgrade prompt if user is on trial
 */

import { useEffect, useState } from 'react'

interface TrialStatusProps {
  trial_expires_at?: string | null
  trial_converted?: boolean
}

export default function TrialStatus({ trial_expires_at, trial_converted }: TrialStatusProps) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    if (!trial_expires_at || trial_converted) {
      return
    }

    const expiresAt = new Date(trial_expires_at)
    const now = new Date()
    const days = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    setDaysRemaining(days)

    if (days <= 0) {
      setMessage('Your trial has ended. Upgrade to continue.')
    } else if (days === 1) {
      setMessage('Your trial expires tomorrow.')
    } else if (days <= 3) {
      setMessage(`Your trial expires in ${days} days.`)
    } else if (days <= 7) {
      setMessage(`Your trial expires in ${days} days.`)
    }
  }, [trial_expires_at, trial_converted])

  if (!trial_expires_at || trial_converted || !daysRemaining) {
    return null
  }

  const bgColor = daysRemaining <= 1 ? 'bg-red-50' : daysRemaining <= 3 ? 'bg-yellow-50' : 'bg-blue-50'
  const borderColor = daysRemaining <= 1 ? 'border-red-200' : daysRemaining <= 3 ? 'border-yellow-200' : 'border-blue-200'
  const textColor = daysRemaining <= 1 ? 'text-red-700' : daysRemaining <= 3 ? 'text-yellow-700' : 'text-blue-700'

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`${textColor} font-semibold`}>{message}</p>
          <p className={`${textColor} text-sm`}>
            {daysRemaining === 1 ? 'Add a payment method to continue.' : 'Upgrade to Starter or Pro to keep using the service.'}
          </p>
        </div>
        <a
          href="/checkout?plan=starter"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap ml-4"
        >
          Upgrade Now
        </a>
      </div>
    </div>
  )
}
