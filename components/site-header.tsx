"use client"

import Link from "next/link"
import { Shield } from "lucide-react"

export function SiteHeader() {
  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-30 top-0 left-0">
      <div className="max-w-screen-xl mx-auto flex flex-row items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <img src="https://flowbite.com/docs/images/logo.svg" className="h-7" alt="PII Shield Logo" />
          <span className="text-2xl font-bold text-gray-900 whitespace-nowrap">PII Shield</span>
        </Link>
        <ul className="hidden md:flex flex-row gap-10 items-center text-base font-medium">
          <li>
            <Link href="#" className="text-gray-900 hover:text-blue-600 transition-colors">About</Link>
          </li>
          <li>
            <Link href="#" className="text-gray-900 hover:text-blue-600 transition-colors">Services</Link>
          </li>
          <li>
            <Link href="#" className="text-gray-900 hover:text-blue-600 transition-colors">Contact</Link>
          </li>
        </ul>
        <div className="flex items-center gap-3">
          <button type="button" className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded px-4 py-2 text-sm transition-colors">Get started</button>
          <button type="button" className="md:hidden p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
            <span className="sr-only">Open main menu</span>
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
