'use client'

import { useState } from 'react'
import { Calendar } from 'lucide-react'

interface DateRange {
  startDate: Date
  endDate: Date
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (dateRange: DateRange) => void
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = new Date(e.target.value + 'T00:00:00.000Z')
    onChange({
      startDate: newStartDate,
      endDate: value.endDate
    })
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = new Date(e.target.value + 'T23:59:59.999Z')
    onChange({
      startDate: value.startDate,
      endDate: newEndDate
    })
  }

  const setPresetRange = (days: number) => {
    // For "Last N days", we want to exclude today and get the previous N complete days
    // For example, "Last 7 days" from Aug 10 should be Aug 3-9 (not Aug 4-10)
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() - 1) // Yesterday
    
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - (days - 1)) // N-1 days before yesterday
    
    onChange({
      startDate,
      endDate
    })
    setIsOpen(false)
  }

  const getDaysAgo = () => {
    const diffTime = Math.abs(value.endDate.getTime() - value.startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDisplayText = () => {
    // Check if this is actually a "Last N days" preset by comparing with what the preset would generate
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    // Check for Last 7 days preset
    const last7Start = new Date(yesterday)
    last7Start.setDate(yesterday.getDate() - 6)
    if (formatDate(value.startDate) === formatDate(last7Start) && formatDate(value.endDate) === formatDate(yesterday)) {
      return 'Last 7 days'
    }
    
    // Check for Last 30 days preset  
    const last30Start = new Date(yesterday)
    last30Start.setDate(yesterday.getDate() - 29)
    if (formatDate(value.startDate) === formatDate(last30Start) && formatDate(value.endDate) === formatDate(yesterday)) {
      return 'Last 30 days'
    }
    
    // Check for Last 90 days preset
    const last90Start = new Date(yesterday)
    last90Start.setDate(yesterday.getDate() - 89)
    if (formatDate(value.startDate) === formatDate(last90Start) && formatDate(value.endDate) === formatDate(yesterday)) {
      return 'Last 90 days'
    }
    
    // For custom date ranges, show the actual dates
    return `${formatDate(value.startDate)} - ${formatDate(value.endDate)}`
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
      >
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">{getDisplayText()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Select Date Range</h3>
            
            {/* Preset buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => setPresetRange(7)}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Last 7 days
              </button>
              <button
                onClick={() => setPresetRange(30)}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Last 30 days
              </button>
              <button
                onClick={() => setPresetRange(90)}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Last 90 days
              </button>
            </div>

            {/* Custom date inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formatDate(value.startDate)}
                  onChange={handleStartDateChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formatDate(value.endDate)}
                  onChange={handleEndDateChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}