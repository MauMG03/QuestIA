// components/DashboardVacantes.jsx

'use client'; // Directiva para componentes de cliente en Next.js App Router

import React, { useState } from 'react';
import { Plus, Briefcase, Users, FileText, Edit, Trash2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';

// Datos de ejemplo. Eventualmente, esto vendrá de tu API.
const initialVacantes = [
  {
    id: 1,
    puesto: 'Desarrollador Frontend (React)',
    estado: 'Abierta',
    candidatos: 25,
  },
  {
    id: 2,
    puesto: 'Diseñador UI/UX Senior',
    estado: 'Abierta',
    candidatos: 12,
  },
  {
    id: 3,
    puesto: 'Ingeniero de Datos (Python & SQL)',
    estado: 'Cerrada',
    candidatos: 38,
  },
];

export default function Dashboard() {

  const { user } = useUser();
  const [vacantes, setVacantes] = useState(initialVacantes);
  
  // Funciones para manejar las acciones (por ahora solo muestran un log)
  const handleCrearVacante = () => {
    console.log('Abriendo modal o página para crear nueva vacante...');
    // Aquí iría la lógica para navegar a otra página o mostrar un modal.
  };

  const handleVerDetalles = (id: number) => {
    console.log(`Viendo detalles de la vacante ${id}`);
  };

  const handleEditar = (id: number) => {
    console.log(`Editando la vacante ${id}`);
  };

  const handleEliminar = (id: number) => {
    console.log(`Eliminando la vacante ${id}`);
    // Lógica de ejemplo para eliminar del estado
    setVacantes(vacantes.filter(v => v.id !== id));
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Encabezado del Dashboard */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard de Vacantes</h1>
          <p className="text-md text-gray-500 mt-1">Gestiona tus puestos y procesos de selección.</p>
        </div>
        <button
          onClick={handleCrearVacante}
          className="mt-4 md:mt-0 flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Crear Nueva Vacante
        </button>
      </header>

      {/* Lista de Vacantes */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vacantes.map((vacante) => (
          <div key={vacante.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                 <div className="bg-blue-100 p-3 rounded-lg">
                    <Briefcase className="text-blue-600" size={24} />
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-gray-900">{vacante.puesto}</h2>
                    <span 
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        vacante.estado === 'Abierta' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {vacante.estado}
                    </span>
                 </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-gray-600">
                <div className="flex items-center gap-2">
                    <Users size={18} />
                    <span className="text-sm">{vacante.candidatos} Candidatos</span>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button onClick={() => handleVerDetalles(vacante.id)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="Ver Detalles">
                    <FileText size={18} />
                </button>
                 <button onClick={() => handleEditar(vacante.id)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors" title="Editar">
                    <Edit size={18} />
                </button>
                 <button onClick={() => handleEliminar(vacante.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Eliminar">
                    <Trash2 size={18} />
                </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}