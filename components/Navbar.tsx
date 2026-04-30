import Link from 'next/link'
import { useState } from 'react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-max flex justify-between items-center h-16">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          Laverdi.tech
        </Link>

        <div className="hidden md:flex gap-6">
          <Link
            href="/#pricing"
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/#features"
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            Features
          </Link>
          <Link
            href="/auth/login"
            className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign Up
          </Link>
        </div>

        <button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-md p-4">
            <Link
              href="/#pricing"
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              Pricing
            </Link>
            <Link
              href="/#features"
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              Features
            </Link>
            <Link
              href="/auth/login"
              className="block py-2 text-gray-700 hover:text-blue-600"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="block py-2 px-4 bg-blue-600 text-white rounded-lg mt-2"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
