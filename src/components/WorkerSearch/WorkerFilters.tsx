// Filtros y barra de búsqueda para trabajadores
// Renderiza los filtros y la barra de búsqueda. Llama a un callback al cambiar filtros.
import React from 'react';
import { WorkerFiltersType } from '../../hooks/useWorkerSearch';
import { mendozaDepartments } from '../../utils/mendozaDepartments';
import { getAllOficios } from '../../hooks/useWorkerSearch';

interface WorkerFiltersProps {
  filters: WorkerFiltersType;
  onChange: (filters: WorkerFiltersType) => void;
}

const availabilityOptions = [
  { value: '', label: 'Cualquiera' },
  { value: 'disponible', label: 'Disponible ahora' },
  { value: 'horario', label: 'Horario específico' },
];

const ratingOptions = [
  { value: 0, label: 'Todas' },
  { value: 3, label: '3 estrellas o más' },
  { value: 4, label: '4 estrellas o más' },
  { value: 4.5, label: '4.5 estrellas o más' },
  { value: 5, label: 'Solo 5 estrellas' },
];

const WorkerFilters: React.FC<WorkerFiltersProps> = ({ filters, onChange }) => {
  const oficioOptions = getAllOficios();

  // Manejar cambios en los filtros
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  return (
    <div className="bg-white rounded shadow p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
      {/* Oficio */}
      <div>
        <label className="block text-sm font-semibold mb-1">Oficio</label>
        <select
          className="border rounded p-2"
          name="job"
          value={filters.job}
          onChange={handleChange}
        >
          <option value="">Todos</option>
          {oficioOptions.map((job) => (
            <option key={job} value={job}>{job}</option>
          ))}
          <option value="Otra">Otra</option>
        </select>
        {/* Input libre si es 'Otra' */}
        {filters.job === 'Otra' && (
          <input
            className="border rounded p-2 mt-2"
            type="text"
            name="customJob"
            placeholder="Especificar oficio"
            value={filters.customJob}
            onChange={handleChange}
          />
        )}
      </div>
      {/* Ubicación */}
      <div>
        <label className="block text-sm font-semibold mb-1">Ubicación</label>
        <select
          className="border rounded p-2"
          name="location"
          value={filters.location}
          onChange={handleChange}
        >
          <option value="">Todos</option>
          {mendozaDepartments.map((dep) => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
      </div>
      {/* Disponibilidad */}
      <div>
        <label className="block text-sm font-semibold mb-1">Disponibilidad</label>
        <select
          className="border rounded p-2"
          name="availability"
          value={filters.availability}
          onChange={handleChange}
        >
          {availabilityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {/* Calificación mínima */}
      <div>
        <label className="block text-sm font-semibold mb-1">Calificación mínima</label>
        <select
          className="border rounded p-2"
          name="minRating"
          value={filters.minRating}
          onChange={handleChange}
        >
          {ratingOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default WorkerFilters; 