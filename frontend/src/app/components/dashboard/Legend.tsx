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
    <footer className="relative w-full text-xs" style={{ height: "1.5em" }}>
      <div
        className="absolute inset-0 w-full"
        style={{
          background: `linear-gradient(to right, ${gradientColors.join(", ")})`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-3 font-semibold text-[#F5F5F0] drop-shadow-[0_0_2px_rgba(0,0,0,0.8)] pointer-events-none">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </footer>
  );
}
