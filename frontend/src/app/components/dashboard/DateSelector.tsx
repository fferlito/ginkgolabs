import { format, addDays } from "date-fns";
import { useDashboard } from "../../context/dashboard-context";

const today = new Date();

export function DateSelector() {
  const { state, dispatch } = useDashboard();

  const dates = [0, 1, 2].map((i) => {
    const d = addDays(today, i);
    return {
      fullDate: format(d, "yyyy-MM-dd"),
      dayText: i === 0 ? "Today" : format(d, "EEE"),
      dayNumber: format(d, "d"),
    };
  });

  return (
    <div className="flex w-full justify-between gap-0 overflow-x-auto">
      {dates.map((dateObj) => (
        <button
          key={dateObj.fullDate}
          type="button"
          onClick={() =>
            dispatch({ type: "SET_SELECTED_DATE", payload: dateObj.fullDate })
          }
          className={`flex flex-1 flex-col items-center justify-center py-1 transition-all hover:bg-white/10 ${
            state.selectedDate === dateObj.fullDate
              ? "bg-white/20 text-[#F5F5F0]"
              : "text-[#F5F5F0]/80"
          }`}
        >
          <span className="text-[11px] font-medium uppercase tracking-wide">
            {dateObj.dayText}
          </span>
          <span className="text-sm font-medium">{dateObj.dayNumber}</span>
        </button>
      ))}
    </div>
  );
}
