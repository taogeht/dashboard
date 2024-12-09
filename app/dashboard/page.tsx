'use client'
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, ArrowRight } from 'lucide-react'
import { Button } from "@/components/ui/button"

const DashboardCard = ({ 
  title, 
  href, 
  icon: Icon,
  description 
}: { 
  title: string
  href: string
  icon: React.ElementType
  description?: string
}) => (
  <Card className="bg-gray-800 border-gray-700 hover:bg-gray-700/50 transition-colors group">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-200">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-gray-400" />
    </CardHeader>
    {description && (
      <div className="px-6 pb-4">
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    )}
    <div className="px-6 pb-4">
      <Button 
        className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
        onClick={() => window.open(href, '_blank')}
      >
        Open Resource
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  </Card>
)

export default function DashboardPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <DashboardCard
        title="Family and Friends"
        href="https://www.oxfordlearnersbookshelf.com/home/main.html"
        icon={BookOpen}
        description="Access your Oxford Learner's Bookshelf materials"
      />
      {/* Add more cards here as needed */}
    </div>
  )
}