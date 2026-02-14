const gradientColors = [
  "#5E0000",
  "#ED8200",
  "#FFE500",
  "#FFE500",
  "#00DE1A",
  "#004D1B",
];

export function Legend() {

  return (
    <div className="flex w-full flex-col items-center gap-1">
      <div
        className="h-5 w-full rounded"
        style={{
          background: `linear-gradient(to right, ${gradientColors.join(", ")})`,
        }}
      />
      <div className="flex w-full justify-between px-1 text-xs font-semibold text-[#F5F5F0] drop-shadow">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
