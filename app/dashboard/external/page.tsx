// app/dashboard/external/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'

export default function ExternalContentPage() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url')

  if (!url) {
    return <div className="text-gray-100">No URL specified</div>
  }

  return (
    <div className="w-full h-[calc(100vh-2rem)]">
      <iframe 
        src={url} 
        className="w-full h-full border-0 rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  )
}