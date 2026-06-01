import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SkillAutocomplete from "@/components/ui/SkillAutocomplete";

// Datos de prueba que representan la respuesta de /api/skills/list
const skills = [
  { name: "Python", category: "language" },
  { name: "React", category: "framework" },
  { name: "PostgreSQL", category: "database" },
  { name: "AWS", category: "cloud" },
  { name: "Docker", category: "tool" },
];

// Helper que renderiza el componente con callbacks mockeados.
// La mayoría de tests no necesitan inspeccionar onSelect/onClear,
// pero los pasamos para evitar warnings de props no definidas.
function renderAutocomplete(props = {}) {
  const onSelect = vi.fn();
  const onClear = vi.fn();
  render(
    <SkillAutocomplete
      skills={skills}
      selectedSkill={null}
      onSelect={onSelect}
      onClear={onClear}
      {...props}
    />,
  );
  return { onSelect, onClear };
}

describe("SkillAutocomplete", () => {
  describe("estado inicial", () => {
    it("muestra el input con el placeholder correcto", () => {
      renderAutocomplete();
      expect(screen.getByPlaceholderText(/buscar skill/i)).toBeInTheDocument();
    });

    it("no muestra el dropdown al montar", () => {
      renderAutocomplete();
      // El dropdown solo aparece cuando el input tiene foco
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("no muestra el botón de limpiar cuando el input está vacío", () => {
      renderAutocomplete();
      expect(screen.queryByLabelText(/limpiar/i)).not.toBeInTheDocument();
    });
  });

  describe("abrir el dropdown", () => {
    it("muestra todas las skills al hacer foco en el input", async () => {
      const user = userEvent.setup();
      renderAutocomplete();

      await user.click(screen.getByPlaceholderText(/buscar skill/i));

      // Todas las skills deben aparecer en el dropdown
      for (const skill of skills) {
        expect(screen.getByText(skill.name)).toBeInTheDocument();
      }
    });

    it("muestra la categoría de cada skill como texto secundario", async () => {
      const user = userEvent.setup();
      renderAutocomplete();

      await user.click(screen.getByPlaceholderText(/buscar skill/i));

      expect(screen.getByText("language")).toBeInTheDocument();
      expect(screen.getByText("framework")).toBeInTheDocument();
    });
  });

  describe("filtrado mientras se escribe", () => {
    it("filtra las skills según el texto introducido", async () => {
      const user = userEvent.setup();
      renderAutocomplete();

      await user.type(screen.getByPlaceholderText(/buscar skill/i), "py");

      expect(screen.getByText("Python")).toBeInTheDocument();
      expect(screen.queryByText("React")).not.toBeInTheDocument();
      expect(screen.queryByText("AWS")).not.toBeInTheDocument();
    });

    it("el filtrado es insensible a mayúsculas y minúsculas", async () => {
      const user = userEvent.setup();
      renderAutocomplete();

      await user.type(screen.getByPlaceholderText(/buscar skill/i), "PYTHON");

      expect(screen.getByText("Python")).toBeInTheDocument();
    });

    it("muestra mensaje cuando no hay coincidencias", async () => {
      const user = userEvent.setup();
      renderAutocomplete();

      await user.type(screen.getByPlaceholderText(/buscar skill/i), "xyz123");

      expect(
        screen.getByText(/no hay skills que coincidan/i),
      ).toBeInTheDocument();
    });

    it("muestra el botón de limpiar cuando hay texto en el input", async () => {
      const user = userEvent.setup();
      renderAutocomplete();

      await user.type(screen.getByPlaceholderText(/buscar skill/i), "py");

      expect(screen.getByLabelText(/limpiar/i)).toBeInTheDocument();
    });
  });

  describe("selección de una skill", () => {
    it("llama a onSelect con el nombre correcto al hacer click", async () => {
      const user = userEvent.setup();
      const { onSelect } = renderAutocomplete();

      await user.click(screen.getByPlaceholderText(/buscar skill/i));
      await user.click(screen.getByText("React"));

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith("React");
    });

    it("cierra el dropdown al seleccionar una skill", async () => {
      const user = userEvent.setup();
      renderAutocomplete();

      await user.click(screen.getByPlaceholderText(/buscar skill/i));
      await user.click(screen.getByText("Python"));

      // El dropdown desaparece después de la selección
      await waitFor(() => {
        expect(screen.queryByRole("list")).not.toBeInTheDocument();
      });
    });

    it("muestra el nombre de la skill seleccionada en el input", async () => {
      const user = userEvent.setup();
      renderAutocomplete();

      await user.click(screen.getByPlaceholderText(/buscar skill/i));
      await user.click(screen.getByText("AWS"));

      expect(screen.getByPlaceholderText(/buscar skill/i)).toHaveValue("AWS");
    });
  });

  describe("skill seleccionada activa (prop selectedSkill)", () => {
    it("muestra el indicador con el nombre de la skill seleccionada", () => {
      renderAutocomplete({ selectedSkill: "Python" });

      expect(screen.getByText("Python")).toBeInTheDocument();
      expect(screen.getByText(/ver todas las skills/i)).toBeInTheDocument();
    });

    it("el enlace 'Ver todas las skills' llama a onClear", async () => {
      const user = userEvent.setup();
      const { onClear } = renderAutocomplete({ selectedSkill: "React" });

      await user.click(screen.getByText(/ver todas las skills/i));

      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe("limpiar la búsqueda", () => {
    it("el botón × llama a onClear y vacía el input", async () => {
      const user = userEvent.setup();
      const { onClear } = renderAutocomplete();

      await user.type(screen.getByPlaceholderText(/buscar skill/i), "py");
      await user.click(screen.getByLabelText(/limpiar/i));

      expect(onClear).toHaveBeenCalledTimes(1);
      expect(screen.getByPlaceholderText(/buscar skill/i)).toHaveValue("");
    });

    it("después de limpiar el botón × desaparece", async () => {
      const user = userEvent.setup();
      renderAutocomplete();

      await user.type(screen.getByPlaceholderText(/buscar skill/i), "py");
      await user.click(screen.getByLabelText(/limpiar/i));

      expect(screen.queryByLabelText(/limpiar/i)).not.toBeInTheDocument();
    });
  });

  describe("lista vacía de skills", () => {
    it("no muestra nada en el dropdown si skills es array vacío", async () => {
      const user = userEvent.setup();
      renderAutocomplete({ skills: [] });

      await user.click(screen.getByPlaceholderText(/buscar skill/i));

      // Con array vacío no hay items, pero tampoco el mensaje de "no hay coincidencias"
      // porque no hay texto de búsqueda todavía
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
  });
});
