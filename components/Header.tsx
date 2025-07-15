'use client'

import { User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'

export default function Header() {
  const { user, setUser } = useUser();

  const router = useRouter()

  const handleLogout = () => {
    setUser(null);
    router.push('/');
  }

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-sm">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-semibold">✏️ QuestAI</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition-colors" onClick={handleLogout}>
          Log Out
        </button>
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
        {!user || !user.photoURL ? (
            <User size={20} className="text-gray-600" />
          ) : (
            <img src={user.photoURL} alt="User profile" className="w-full h-full rounded-full" />
          )}
        </div>
      </div>
    </header>
  )
}