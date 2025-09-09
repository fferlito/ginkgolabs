import React from 'react'
import moment from 'moment'
import { useDashboard } from '../../context/DashboardContext'
import './DateSelector.css'

const DateSelector = () => {
  const { state, dispatch } = useDashboard()

  // Generate dates for today, tomorrow, and the day after
  const dates = []
  for (let i = 0; i < 3; i++) {
    const date = moment().add(i, 'days')
    dates.push({
      date: date,
      fullDate: date.format('YYYY-MM-DD'),
      dayText: i === 0 ? 'Today' : date.format('ddd'),
      dayNumber: date.format('D')
    })
  }

  const handleDateSelect = (selectedDate) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: selectedDate })
  }

  return (
    <div className="calendar-wrapper">
      <div className="calendar-scroll">
        {dates.map((dateObj, index) => (
          <div
            key={dateObj.fullDate}
            className={`date-card ${state.selectedDate === dateObj.fullDate ? 'active' : ''}`}
            onClick={() => handleDateSelect(dateObj.fullDate)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleDateSelect(dateObj.fullDate)
              }
            }}
          >
            <div className="date-card-day">{dateObj.dayText}</div>
            <div className="date-card-number">{dateObj.dayNumber}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DateSelector
