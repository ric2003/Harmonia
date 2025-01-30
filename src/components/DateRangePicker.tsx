"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Define um tipo para o "range" que o Calendário devolve
 * (shadcn/ui com mode="range" devolve { from?: Date; to?: Date })
 */
type DateRange = {
  from?: Date
  to?: Date
}

interface DateRangePickerProps {
  value?: DateRange
  onChange?: (value: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  // Se recebermos um valor inicial por props, ótimo; senão, inicia vazio
  const [internalValue, setInternalValue] = React.useState<DateRange>(
    value ?? {}
  )

  // Sempre que o utilizador seleciona datas, guardamos no state
  function handleSelect(range: DateRange) {
    setInternalValue(range)
    onChange?.(range) // notifica o componente "pai"
  }

  // Formatamos o texto a mostrar no botão
  const startDate = internalValue.from
    ? format(internalValue.from, "PPP")
    : "Pick a date"
  const endDate = internalValue.to
    ? format(internalValue.to, "PPP")
    : "Pick a date"

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !internalValue.from && !internalValue.to && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {internalValue.from && internalValue.to
            ? `${startDate} → ${endDate}`
            : internalValue.from
            ? startDate
            : "Pick a date range"}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={internalValue}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
