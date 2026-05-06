import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { topSkills } from "@/data/mockData";
import { filterTopSkills } from "@/lib/filterData";

// Configuración de colores y etiquetas para la gráfica.
// color usa la variable CSS --chart-1 definida por shadcn en index.css.
const chartConfig = {
  count: {
    label: "Ofertas",
    color: "var(--chart-1)",
  },
};

// Gráfica de barras horizontales con las skills más demandadas.
// Usa layout="vertical" para que las barras crezcan de izquierda a derecha
// y el nombre de la skill quede legible en el eje Y.
// Reacciona al filtro de categoría de skills.
function TopSkillsChart({ filters }) {
  const data = filterTopSkills(topSkills, filters);

  // Si no hay skills en la categoría seleccionada mostramos un mensaje
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-border p-4">
        <h2 className="mb-4 text-sm font-semibold">
          Top Skills más demandadas
        </h2>
        <p className="text-sm text-muted-foreground">
          No hay datos para la categoría seleccionada.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-sm font-semibold">Top Skills más demandadas</h2>
      <ChartContainer config={chartConfig} className="h-72 w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 16, right: 16 }}
        >
          <CartesianGrid horizontal={false} />
          {/* Eje numérico oculto, solo sirve para que Recharts calcule la escala */}
          <XAxis type="number" dataKey="count" hide />
          {/* Eje con los nombres de las skills, ancho fijo para que no se corten */}
          <YAxis
            type="category"
            dataKey="skill"
            width={90}
            tick={{ fontSize: 12 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="count" fill="var(--chart-1)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export default TopSkillsChart;
