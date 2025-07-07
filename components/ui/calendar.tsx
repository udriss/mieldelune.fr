import React, { useState, useEffect } from "react"
import { DateRange, DayPicker, getDefaultClassNames } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { fr } from "date-fns/locale"
import { myFetch } from "@/lib/fetch-wrapper"
import { IconButton, Box, Typography } from "@mui/material"
import { Refresh } from "@mui/icons-material"

interface CalendarProps {
  onChange: (dateRange: DateRange) => void
}

const Calendar = ({ onChange }: CalendarProps) => {
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([])

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await myFetch('/api/availability')
        const data = await res.json()
        if (data.unavailableDates) {
          setUnavailableDates(data.unavailableDates.map((d: string) => new Date(d)))
        }
      } catch (error) {
        console.error("Erreur lors du chargement des disponibilités.", error)
      }
    }
    fetchAvailability()
  }, [])

  const handleDateChange = (range: DateRange) => {
    if (range.from && range.to) {
      setDateRange(range)
      onChange(range)
    } else {
      setDateRange({ from: range.from, to: undefined })
      onChange({ from: range.from, to: undefined })
    }
  }

  const handleReset = () => {
    const resetRange = { from: undefined, to: undefined }
    setDateRange(resetRange)
    onChange(resetRange)
  }

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "non renseignée"
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  const endtMonth = new Date()
  endtMonth.setFullYear(endtMonth.getFullYear() + 5)

  const defaultClassNames = getDefaultClassNames()

  const disabledDays = [{ before: new Date() }, ...unavailableDates]

  return (
    <Box sx={{ fontSize: '1rem' }}>
      <DayPicker
      disabled={disabledDays}
      mode="range"
      selected={dateRange}
      onSelect={handleDateChange}
      required
      captionLayout="dropdown"
      startMonth={new Date()}
      endMonth={endtMonth}
      locale={fr}
      classNames={{
        today: `border-amber-500`,
        selected: `bg-green-200 border-amber-500 text-black rounded-lg font-bold`,
        range_end: `bg-green-200 border-amber-500 text-black rounded-lg`,
        range_start: `bg-amber-500 border-amber-500 text-black rounded-lg font-bold`,
        root: `shadow-lg p-5`,
        chevron: `fill-black`, 
      }}
      modifiersClassNames={{
        disabled: "text-red-500 line-through",
        selected: `bg-green-200 border-amber-500 text-black rounded-lg font-bold`,
        today: `border-amber-500`,
        range_end: `bg-green-200 border-amber-500 text-black rounded-lg`,
        range_start: `bg-amber-500 border-amber-500 text-black rounded-lg font-bold`,
      }}
      />
      <Box 
        sx={{ 
          mt: 2, 
          textAlign: 'center', 
          position: 'relative', 
          pr: 10 
        }}
      >
        <Typography variant="body2">
          Du : {formatDate(dateRange.from)}
        </Typography>
        <Typography variant="body2">
          au : {formatDate(dateRange.to)}
        </Typography>
        <Box 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            right: 0, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}
        >
          <IconButton
            onClick={handleReset}
            size="small"
            className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-200"
            sx={{ 
              color: '#6b7280',
              '&:hover': { 
                color: '#374151',
                transform: 'rotate(180deg)',
                transition: 'all 0.3s ease-in-out'
              }
            }}
          >
            <Refresh fontSize="small" />
          </IconButton>
          <Typography 
            variant="caption" 
            sx={{ 
              color: '#6b7280', 
              mt: 0.5, 
              whiteSpace: 'nowrap',
              fontSize: '12px !important',
            }}
          >
            réinitialiser dates
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

export default Calendar