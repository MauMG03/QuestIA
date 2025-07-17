// components/CrearVacanteModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CrearVacanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCrear: (data: { puesto: string; descripcion: string }) => void;
}

export default function CrearVacanteModal({ isOpen, onClose, onCrear }: CrearVacanteModalProps) {
  const [puesto, setPuesto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!puesto.trim()) {
      setError('El nombre del puesto es obligatorio.');
      return;
    }
    // Llama a la función del padre para crear la vacante
    onCrear({ puesto, descripcion });
    // Limpia el formulario y cierra el modal
    setPuesto('');
    setDescripcion('');
    setError('');
    onClose();
  };

  // Si el modal no está abierto, no renderiza nada
  if (!isOpen) {
    return null;
  }

  return (
    // Fondo oscuro semi-transparente
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      {/* Contenedor del modal */}
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 relative">
        {/* Botón para cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Crear Nueva Vacante</h2>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="mb-4">
            <label htmlFor="puesto" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Puesto
            </label>
            <input
              type="text"
              id="puesto"
              value={puesto}
              onChange={(e) => setPuesto(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Desarrollador Frontend"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Responsabilidades, requisitos, etc."
            ></textarea>
          </div>

          {/* Acciones del formulario */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
            >
              Crear Vacante
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}