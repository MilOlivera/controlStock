"use client";

export default function AdminLocationsList({
  onSelect,
}: {
  onSelect: (location: string) => void;
}) {
  const locations = [
    {
      id: "marpla-lomas",
      name: "MARPLA Lomas",
      description: "Local medialunas",
    },
    {
      id: "evolvere",
      name: "EVOLVERE",
      description: "Gimnasio",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm text-zinc-400">
        Locales disponibles
      </div>

      {locations.map((loc) => (
        <button
          key={loc.id}
          onClick={() => onSelect(loc.id)}
          className="w-full bg-zinc-900 p-4 rounded text-left hover:bg-zinc-800"
        >
          <div className="font-semibold">
            {loc.name}
          </div>

          <div className="text-sm text-zinc-400">
            {loc.description}
          </div>
        </button>
      ))}
    </div>
  );
}
