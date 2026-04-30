import Link from 'next/link'

interface PricingCardProps {
  name: string
  price: number | null
  interval: string
  features: string[]
  highlighted?: boolean
  planId: string
}

export default function PricingCard({
  name,
  price,
  interval,
  features,
  highlighted = false,
  planId,
}: PricingCardProps) {
  return (
    <div
      className={`rounded-lg border-2 p-8 ${
        highlighted
          ? 'border-blue-600 bg-blue-50 shadow-lg transform scale-105'
          : 'border-gray-200 bg-white'
      }`}
    >
      <h3 className="text-2xl font-bold mb-2">{name}</h3>

      <div className="mb-6">
        {price !== null ? (
          <>
            <span className="text-4xl font-bold">${price}</span>
            <span className="text-gray-600 ml-2">/{interval}</span>
          </>
        ) : (
          <span className="text-3xl font-bold text-gray-700">Custom</span>
        )}
      </div>

      <ul className="mb-8 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <span className="text-green-500 mr-3 font-bold">✓</span>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {planId === 'enterprise' ? (
        <Link
          href="/contact"
          className={`w-full py-3 rounded-lg font-semibold text-center transition-colors ${
            highlighted
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Contact Sales
        </Link>
      ) : (
        <Link
          href={`/checkout?plan=${planId}`}
          className={`w-full py-3 rounded-lg font-semibold text-center transition-colors ${
            highlighted
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Get Started
        </Link>
      )}
    </div>
  )
}
