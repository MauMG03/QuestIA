// components/VacanteCard.jsx
import Link from 'next/link';
import { Briefcase, Users, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface Vacante {
  id: string | number;
  puesto: string;
  estado: string;
  candidatos?: number;
}

interface VacanteCardProps {
  vacante: Vacante;
  onDelete: (id: string | number) => void;
  onUpdateStatus: (id:string | number, newStatus: string) => void;
}

export default function VacanteCard({ vacante, onDelete, onUpdateStatus }: VacanteCardProps) {
  const { id, puesto, estado, candidatos } = vacante;
  const isAbierta = estado === 'Abierta';

  return (
    <Link 
      href={`/vacantes/${id}`} 
      className="block bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        {/* ... (Contenido superior de la tarjeta) ... */}
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${isAbierta ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Briefcase className={isAbierta ? 'text-green-600' : 'text-red-600'} size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-900">{puesto}</h2>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isAbierta ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {estado}
                    </span>
                </div>
            </div>
        </div>
        <div className="mt-6 flex items-center justify-between text-gray-600">
            <div className="flex items-center gap-2">
                <Users size={18} />
                {/* <span className="text-sm">{candidatos || 0} Candidatos</span> */}
            </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-end gap-2">
        <button
          onClick={(e) => {
            // Hacemos todo directamente aquí
            e.preventDefault();
            e.stopPropagation();
            console.log('Botón de estado presionado. No debería redirigir.'); // Mensaje de depuración
            onUpdateStatus(id, isAbierta ? 'Cerrada' : 'Abierta');
          }}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
          title={isAbierta ? 'Marcar como Cerrada' : 'Marcar como Abierta'}
        >
          {isAbierta ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
        </button>
        
        <button
          onClick={(e) => {
            // Y aquí también
            e.preventDefault();
            e.stopPropagation();
            console.log('Botón de eliminar presionado. No debería redirigir.'); // Mensaje de depuración
            onDelete(id);
          }}
          className="p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </Link>
  );
}