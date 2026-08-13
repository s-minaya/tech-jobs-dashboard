import {
  RiTimeLine,
  RiCalendarLine,
  RiFileTextLine,
  RiTimerLine,
  RiSunLine,
  RiMoonLine,
  RiHome3Line,
  RiBuildingLine,
  RiGlobalLine,
  RiCodeLine,
  RiCloudLine,
  RiDatabase2Line,
  RiSettings3Line,
  RiTerminalLine,
  RiFlowChart,
  RiCheckLine,
} from "react-icons/ri";
import DE from "country-flag-icons/react/3x2/DE";
import FR from "country-flag-icons/react/3x2/FR";
import ES from "country-flag-icons/react/3x2/ES";
import NL from "country-flag-icons/react/3x2/NL";
import PL from "country-flag-icons/react/3x2/PL";
import IT from "country-flag-icons/react/3x2/IT";
import AT from "country-flag-icons/react/3x2/AT";
import BE from "country-flag-icons/react/3x2/BE";
import { OPTION_LABELS } from "@/lib/filterUtils";

// Wrapper para normalizar las banderas al mismo tamaño que los react-icons
const flag = (Flag) => () => <Flag className="h-3.5 w-5 rounded-xs" />;

// ── Iconos por opción ─────────────────────────────────────────────────────────
// Mapa de opción → icono. Si no hay icono definido se omite. Mismo truco
// que OPTION_LABELS (filterUtils.js) para el texto: un objeto plano
// indexado por el valor crudo de la opción — este componente no sabe de
// qué filtro se trata (país, contrato...), solo recibe `options`
// genéricas, así que cualquier tabla de personalización por opción tiene
// que poder resolverse sin esa información.
const OPTION_ICONS = {
  // País — SVGs de country-flag-icons
  Todos: RiGlobalLine,
  DE: flag(DE),
  FR: flag(FR),
  ES: flag(ES),
  NL: flag(NL),
  PL: flag(PL),
  IT: flag(IT),
  AT: flag(AT),
  BE: flag(BE),
  // Periodo
  "Últimos 30 días": RiTimeLine,
  "Últimos 90 días": RiTimeLine,
  "Últimos 6 meses": RiCalendarLine,
  "Todo el histórico": RiCalendarLine,
  // Contrato
  Permanent: RiFileTextLine,
  Contract: RiTimerLine,
  // Jornada
  "Full time": RiSunLine,
  "Part time": RiMoonLine,
  // Remote
  Sí: RiHome3Line,
  No: RiBuildingLine,
  // Categoría
  Todas: RiSettings3Line,
  Language: RiCodeLine,
  Framework: RiFlowChart,
  Cloud: RiCloudLine,
  Database: RiDatabase2Line,
  Tool: RiTerminalLine,
  Methodology: RiSettings3Line,
};

// ── FilterChip ────────────────────────────────────────────────────────────────
// Chip pill para filtros con pocas opciones cortas (País, Categoría).
// Icono + texto en horizontal, fondo con toque de color cuando activo.
function FilterChip({ children, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
        isActive
          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
          : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground"
      } `}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </button>
  );
}

// ── FilterToggleRow ───────────────────────────────────────────────────────────
// Fila de toggle para filtros con opciones que necesitan más espacio (Periodo,
// Contrato, Jornada, Remote). Icono + texto a la izquierda, checkmark a la derecha.
// El fondo activo usa un toque sutil del primary para no saturar.
function FilterToggleRow({ children, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all duration-150 ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } `}
    >
      {Icon && (
        <Icon
          className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : ""}`}
        />
      )}
      <span className="flex-1">{children}</span>
      {/* Checkmark visible solo cuando está activo */}
      {isActive && (
        <RiCheckLine className="h-3.5 w-3.5 shrink-0 text-primary" />
      )}
    </button>
  );
}

// ── FilterSection ─────────────────────────────────────────────────────────────
// Sección de filtro con título y sus opciones.
// fullWidth=false → chips en fila (País, Categoría)
// fullWidth=true  → toggle rows en columna (Periodo, Contrato, Jornada, Remote)
function FilterSection({
  title,
  options,
  fullWidth = false,
  selected,
  onSelect,
}) {
  return (
    <div className="mb-5">
      <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </p>
      {fullWidth ? (
        // Toggle rows — columna con separación entre items
        <div className="flex flex-col gap-0.5">
          {options.map((option) => {
            const Icon = OPTION_ICONS[option];
            return (
              <FilterToggleRow
                key={option}
                icon={Icon}
                isActive={selected === option}
                onClick={() => onSelect(option)}
              >
                {OPTION_LABELS[option] ?? option}
              </FilterToggleRow>
            );
          })}
        </div>
      ) : (
        // Chips — fila que fluye
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => {
            const Icon = OPTION_ICONS[option];
            return (
              <FilterChip
                key={option}
                icon={Icon}
                isActive={selected === option}
                onClick={() => onSelect(option)}
              >
                {OPTION_LABELS[option] ?? option}
              </FilterChip>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FilterSection;
