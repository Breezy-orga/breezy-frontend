import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Breezy
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/feed" className="text-gray-600 hover:text-gray-900">
              Feed
            </Link>
            <Link href="/explore" className="text-gray-600 hover:text-gray-900">
              Explore
            </Link>
            <Link href="/profile" className="text-gray-600 hover:text-gray-900">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
} 