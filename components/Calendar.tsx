import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarProps {
  value?: Date
  onChange?: (date: Date) => void
  attendanceData?: {
    date: string
    presentCount: number
    totalCount: number
  }[]
  minDate?: Date
  maxDate?: Date
}

export default function Calendar({
  value,
  onChange,
  attendanceData = [],
  minDate,
  maxDate,
}: CalendarProps) {
  const [month, setMonth] = useState(() => value || new Date())

  // Get calendar metadata
  const calendar = useMemo(() => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0)
    const startingDayIndex = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    // Create calendar grid
    const days = []
    let currentWeek = []
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayIndex; i++) {
      currentWeek.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(new Date(month.getFullYear(), month.getMonth(), day))
      
      if (currentWeek.length === 7) {
        days.push(currentWeek)
        currentWeek = []
      }
    }
    
    // Add empty cells for remaining days
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    if (currentWeek.length > 0) {
      days.push(currentWeek)
    }
    
    return days
  }, [month])

  // Format date for comparison with attendance data
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  // Get attendance data for a specific date
  const getAttendanceData = (date: Date) => {
    const dateStr = formatDate(date)
    return attendanceData.find(d => d.date === dateStr)
  }

  // Navigation handlers
  const handlePreviousMonth = () => {
    setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  // Date selection handler
  const handleDateSelect = (date: Date) => {
    if (onChange) {
      onChange(date)
    }
  }

  // Check if a date should be disabled
  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return false
  }

  // Get color for attendance indicator
  const getAttendanceColor = (presentCount: number, totalCount: number) => {
    const ratio = presentCount / totalCount
    if (ratio >= 0.9) return 'bg-green-500'
    if (ratio >= 0.75) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-100">
          {month.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePreviousMonth}
            className="text-gray-400 hover:text-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="text-gray-400 hover:text-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-400 py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendar.map((week, weekIndex) => (
          week.map((date, dayIndex) => {
            if (!date) {
              return (
                <div
                  key={`empty-${weekIndex}-${dayIndex}`}
                  className="aspect-square p-2 bg-gray-900/50 text-gray-600"
                />
              )
            }

            const isSelected = value && formatDate(date) === formatDate(value)
            const isDisabled = isDateDisabled(date)
            const attendance = getAttendanceData(date)

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isDisabled && handleDateSelect(date)}
                disabled={isDisabled}
                className={cn(
                  "aspect-square p-2 relative group transition-colors",
                  isSelected ? "bg-blue-600" : "bg-gray-900/50 hover:bg-gray-700",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className={cn(
                  "text-sm",
                  isSelected ? "text-white" : "text-gray-300"
                )}>
                  {date.getDate()}
                </span>

                {/* Attendance Indicator */}
                {attendance && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        getAttendanceColor(attendance.presentCount, attendance.totalCount)
                      )}
                    />
                  </div>
                )}

                {/* Tooltip */}
                {attendance && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 rounded shadow-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    Present: {attendance.presentCount}/{attendance.totalCount}
                  </div>
                )}
              </button>
            )
          })
        ))}
      </div>
    </div>
  )
}