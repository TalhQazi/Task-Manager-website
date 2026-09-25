import React, { useState } from "react";
import { useAtlasBooks, EntityNode } from "../../contexts/AtlasBooksContext";
import { ChevronDown, Globe, Home, Building2, MapPin, Briefcase, Layers, Check } from "lucide-react";

export const EntitySelector: React.FC = () => {
  const { activeEntity, entities, selectEntity } = useAtlasBooks();
  const [isOpen, setIsOpen] = useState(false);

  // Flatten the tree with indentation labels for rendering flat in a beautiful select layout
  const getFlatList = (node: EntityNode, depth = 0, accumulator: Array<{ node: EntityNode; depth: number }> = []): Array<{ node: EntityNode; depth: number }> => {
    accumulator.push({ node, depth });
    if (node.children) {
      node.children.forEach(child => getFlatList(child, depth + 1, accumulator));
    }
    return accumulator;
  };

  const flatList = getFlatList(entities);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "holding":
        return <Globe className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case "company":
        return <Building2 className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case "location":
        return <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
      case "department":
        return <Briefcase className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case "unit":
        return <Layers className="w-4 h-4 text-purple-400 flex-shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:w-80 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900/80 text-white rounded-lg px-4 py-2.5 text-sm transition-all duration-300 shadow-lg group focus:outline-none focus:ring-1 focus:ring-amber-500"
      >
        <div className="flex items-center space-x-3 truncate">
          {getLevelIcon(activeEntity.level)}
          <div className="text-left truncate">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">
              {activeEntity.level} scope
            </div>
            <div className="font-medium text-zinc-100 truncate group-hover:text-amber-400 transition-colors">
              {activeEntity.name}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 group-hover:text-amber-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-full md:w-80 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto p-1 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            <div className="px-3 py-2 text-[10px] text-zinc-500 font-mono tracking-widest uppercase border-b border-zinc-900 mb-1">
              Select Financial Entity Scope
            </div>
            {flatList.map(({ node, depth }) => {
              const isSelected = node.id === activeEntity.id;
              return (
                <button
                  key={node.id}
                  onClick={() => {
                    selectEntity(node.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full text-left rounded-lg py-2 px-3 text-xs transition-all duration-150 mb-0.5 hover:bg-zinc-900 group ${
                    isSelected
                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      : "text-zinc-400 hover:text-white border border-transparent"
                  }`}
                  style={{ paddingLeft: `${Math.max(12, depth * 14)}px` }}
                >
                  <div className="flex items-center space-x-2 truncate">
                    {getLevelIcon(node.level)}
                    <span className={`truncate ${isSelected ? "font-semibold" : "font-normal group-hover:translate-x-0.5 transition-transform"}`}>
                      {node.name}
                    </span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
