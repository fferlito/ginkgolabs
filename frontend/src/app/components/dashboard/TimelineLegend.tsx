import { DateSelector } from "./DateSelector";
import { Legend } from "./Legend";

export function TimelineLegend() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1001] flex w-full flex-col">
      <div className="flex min-h-10 items-center border-b border-white/10 bg-black/60 px-4 py-2 backdrop-blur">
        <DateSelector />
      </div>
      <Legend />
    </div>
  );
}
