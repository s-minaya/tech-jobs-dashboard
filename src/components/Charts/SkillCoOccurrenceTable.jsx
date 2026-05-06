import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { skillCoOccurrence } from "@/data/mockData";

// Agrupa las co-ocurrencias por skill principal para mostrarlas
// como secciones separadas en la tabla.
// Resultado: { "Python": [...], "SQL": [...], ... }
const groupedBySkill = skillCoOccurrence.reduce((acc, entry) => {
  if (!acc[entry.skill]) acc[entry.skill] = [];
  acc[entry.skill].push(entry);
  return acc;
}, {});

// Tabla que muestra qué skills suelen aparecer juntas en las ofertas.
// Agrupada por skill principal, ordenada de mayor a menor co-ocurrencia.
function SkillCoOccurrenceTable() {
  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-sm font-semibold">
        Skills que suelen aparecer juntas
      </h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Skill principal</TableHead>
            <TableHead>Aparece junto con</TableHead>
            {/* tabular-nums alinea los números verticalmente */}
            <TableHead className="text-right tabular-nums">
              Co-ocurrencias
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(groupedBySkill).map(([skill, coSkills]) =>
            // Ordenamos de mayor a menor para que lo más relevante aparezca primero
            [...coSkills]
              .sort((a, b) => b.count - a.count)
              .map((entry, index) => (
                <TableRow key={`${skill}-${entry.coSkill}`}>
                  {/* Solo mostramos el nombre de la skill principal en la primera fila
                      del grupo — las siguientes quedan vacías para evitar repetición */}
                  <TableCell className="font-medium">
                    {index === 0 ? skill : ""}
                  </TableCell>
                  <TableCell>{entry.coSkill}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {entry.count.toLocaleString()}
                  </TableCell>
                </TableRow>
              )),
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default SkillCoOccurrenceTable;
