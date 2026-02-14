import { DateSelector } from "./DateSelector";
import { Legend } from "./Legend";

export function TimelineLegend() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1001] flex w-full flex-col">
      <div className="flex min-h-10 items-center border-b border-white/10 bg-black/60 px-4 py-2 backdrop-blur">
        <DateSelector />
      </div>
      <div
        className="flex items-center px-4 py-2"
        style={{
          background: `linear-gradient(to right, #5E0000, #ED8200, #FFE500, #FFE500, #00DE1A, #004D1B)`,
        }}
      >
        <Legend />
      </div>
    </div>
  );
}
