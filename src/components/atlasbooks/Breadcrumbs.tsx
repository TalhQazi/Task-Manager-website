import React from "react";
import { useAtlasBooks } from "../../contexts/AtlasBooksContext";
import { ChevronRight, Home, Building2, MapPin, Briefcase, Layers } from "lucide-react";

export const Breadcrumbs: React.FC = () => {
  const { entityHierarchy, selectEntity } = useAtlasBooks();

  const getIcon = (level: string) => {
    switch (level) {
      case "holding":
        return <Home className="w-3.5 h-3.5 mr-1 text-amber-500" />;
      case "company":
        return <Building2 className="w-3.5 h-3.5 mr-1 text-amber-500" />;
      case "location":
        return <MapPin className="w-3.5 h-3.5 mr-1 text-amber-400" />;
      case "department":
        return <Briefcase className="w-3.5 h-3.5 mr-1 text-amber-400" />;
      case "unit":
        return <Layers className="w-3.5 h-3.5 mr-1 text-amber-300" />;
      default:
        return null;
    }
  };

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-zinc-400 bg-zinc-900/60 backdrop-blur border border-zinc-800/80 px-3 py-1.5 rounded-full inline-flex max-w-full overflow-x-auto whitespace-nowrap scrollbar-none shadow-md">
      {entityHierarchy.map((entity, index) => {
        const isLast = index === entityHierarchy.length - 1;
        return (
          <React.Fragment key={entity.id}>
            {index > 0 && <ChevronRight className="w-3 h-3 text-zinc-600 flex-shrink-0" />}
            <button
              onClick={() => selectEntity(entity.id)}
              disabled={isLast}
              className={`flex items-center transition-all duration-200 hover:text-amber-400 focus:outline-none ${
                isLast
                  ? "text-amber-400 font-semibold cursor-default"
                  : "text-zinc-400 hover:underline active:scale-95"
              }`}
            >
              {getIcon(entity.level)}
              <span>{entity.name}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};
