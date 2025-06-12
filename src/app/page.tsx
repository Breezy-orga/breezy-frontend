'use client'

import { useState } from 'react'
import PostForm from '@/components/PostForm'
import PostList from '@/components/PostList'

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePostCreated = () => {
    // Rafraîchir la liste des posts après la création d'un nouveau post
    setRefreshKey((prev: number) => prev + 1)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <PostForm onPostCreated={handlePostCreated} />
        <div className="mt-8">
          <PostList
            key={refreshKey}
            fetchUrl={`${process.env.NEXT_PUBLIC_API_URL}/posts`}
          />
        </div>
      </div>
    </main>
  )
} 