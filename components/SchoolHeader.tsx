import { useSchool } from '@/context/SchoolContext'
import { Card, CardContent } from "@/components/ui/card"

export default function SchoolHeader() {
  const { selectedSchool } = useSchool()

  if (!selectedSchool) {
    return null
  }

  return (
    <div className="mb-6">
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {selectedSchool.name}
              </h2>
              <p className="text-blue-100 mt-1">
                Welcome to your school dashboard
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}