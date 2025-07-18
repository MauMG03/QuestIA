// app/vacantes/[id]/page.jsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase/firebaseConfig';
import { ArrowLeft, Edit, Save, X, Plus, User, Download } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Link from 'next/link';
import CrearCandidatoModal from '../../../components/CrearCandidatoModal';
import { deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import Header from '@/components/Header';

// --- Interfaces (sin cambios) ---
interface Vacante {
  puesto: string;
  descripcion: string;
  estado: string;
  candidatos: number;
  fechaCreacion?: Date;
}

interface Candidato {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  cvUrl: string;
}

interface NuevoCandidatoData {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  cvUrl: string;
}

interface EditarCandidatoModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidato: Candidato | null;
  onEditar: (data: NuevoCandidatoData) => void;
}

function EditarCandidatoModal({ isOpen, onClose, candidato, onEditar }: EditarCandidatoModalProps) {
  const [formData, setFormData] = React.useState<NuevoCandidatoData>({
    nombre: candidato?.nombre || '',
    apellido: candidato?.apellido || '',
    correo: candidato?.correo || '',
    telefono: candidato?.telefono || '',
    cvUrl: candidato?.cvUrl || '',
  });
  const [file, setFile] = React.useState<File | null>(null);
  const [subiendo, setSubiendo] = React.useState(false);

  React.useEffect(() => {
    if (candidato) {
      setFormData({
        nombre: candidato.nombre,
        apellido: candidato.apellido,
        correo: candidato.correo,
        telefono: candidato.telefono,
        cvUrl: candidato.cvUrl,
      });
      setFile(null);
    }
  }, [candidato]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === 'cvFile' && files && files[0]) {
      setFile(files[0]);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let newCvUrl = formData.cvUrl;
    if (file) {
      setSubiendo(true);
      try {
        const storage = getStorage();
        const fileRef = storageRef(storage, `cvs/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        newCvUrl = await getDownloadURL(fileRef);
      } catch (err) {
        alert('Error al subir el archivo');
        setSubiendo(false);
        return;
      }
      setSubiendo(false);
    }
    onEditar({ ...formData, cvUrl: newCvUrl });
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Editar Candidato</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Nombre" className="w-full border p-2 rounded" />
          <input name="apellido" value={formData.apellido} onChange={handleChange} placeholder="Apellido" className="w-full border p-2 rounded" />
          <input name="correo" value={formData.correo} onChange={handleChange} placeholder="Correo" className="w-full border p-2 rounded" />
          <input name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Teléfono" className="w-full border p-2 rounded" />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cambiar documento (CV)</label>
            <input type="file" name="cvFile" accept="application/pdf" onChange={handleChange} className="w-full" />
          </div>
          {subiendo && <p className="text-blue-600">Subiendo archivo...</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-400 text-white rounded">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={subiendo}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaginaGestionVacante() {
  // Gemini API Key
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  // Estado para los resúmenes de CV
  // Estado para los resúmenes individuales de CV
  const [cvSummaries, setCvSummaries] = useState<{ [id: string]: string }>({});
  const [cvSummarySource, setCvSummarySource] = useState<{ [id: string]: 'db' | 'generated' }>({});
  const [loadingCVSummary, setLoadingCVSummary] = useState<{ [id: string]: boolean }>({});

  // Función para generar resumen individual del CV de un candidato
  async function generateCVSummaryForCandidate(candidato: Candidato) {
    if (!genAI) {
      alert("Gemini API Key no configurada");
      return;
    }
    setLoadingCVSummary(prev => ({ ...prev, [candidato.id]: true }));
    // Si ya existe el resumen en la DB, usarlo directamente
    try {
      const candidatoRef = doc(firestore, 'vacantes', id, 'candidatos', candidato.id);
      const candidatoSnap = await getDoc(candidatoRef);
      const candidatoData = candidatoSnap.exists() ? candidatoSnap.data() : null;
      if (candidatoData && candidatoData.cvSummary) {
        setCvSummaries(prev => ({ ...prev, [candidato.id]: candidatoData.cvSummary }));
        setCvSummarySource(prev => ({ ...prev, [candidato.id]: 'db' }));
        setLoadingCVSummary(prev => ({ ...prev, [candidato.id]: false }));
        return;
      }
    } catch (err) {
      // Si hay error, continuar con el proceso normal
    }

    let cvText = "No hay información de CV disponible.";
    if (candidato.cvUrl) {
      try {
        const res = await fetch(`/api/extract-pdf-text?url=${encodeURIComponent(candidato.cvUrl)}`);
        const data = await res.json();
        if (!data.text || data.text.trim().length < 20) {
          setCvSummaries(prev => ({ ...prev, [candidato.id]: "El CV está vacío o no se pudo leer. No hay información suficiente para generar un resumen." }));
          setCvSummarySource(prev => ({ ...prev, [candidato.id]: 'generated' }));
          setLoadingCVSummary(prev => ({ ...prev, [candidato.id]: false }));
          // Guardar en la DB el resultado vacío
          try {
            const candidatoRef = doc(firestore, 'vacantes', id, 'candidatos', candidato.id);
            await updateDoc(candidatoRef, { cvSummary: "El CV está vacío o no se pudo leer. No hay información suficiente para generar un resumen." });
          } catch { }
          return;
        }
        cvText = data.text;
      } catch (err) {
        setCvSummaries(prev => ({ ...prev, [candidato.id]: "No se pudo extraer el texto del CV. No hay información suficiente para generar un resumen." }));
        setCvSummarySource(prev => ({ ...prev, [candidato.id]: 'generated' }));
        setLoadingCVSummary(prev => ({ ...prev, [candidato.id]: false }));
        // Guardar en la DB el resultado vacío
        try {
          const candidatoRef = doc(firestore, 'vacantes', id, 'candidatos', candidato.id);
          await updateDoc(candidatoRef, { cvSummary: "No se pudo extraer el texto del CV. No hay información suficiente para generar un resumen." });
        } catch { }
        return;
      }
    }
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Eres un asistente experto en selección de personal. Resume únicamente la información que aparece en el siguiente CV en español, sin inventar ni asumir datos que no estén presentes. El resumen debe tener máximo 40 palabras, resaltando habilidades, experiencia y puntos clave para un reclutador. Si no hay información suficiente, responde: 'No hay información suficiente para generar un resumen.' No uses markdown.\nCV:\n${cvText}`;
    try {
      const result = await model.generateContent([prompt]);
      setCvSummaries(prev => ({ ...prev, [candidato.id]: result.response.text() }));
      setCvSummarySource(prev => ({ ...prev, [candidato.id]: 'generated' }));
      // Guardar el resumen en la DB
      try {
        const candidatoRef = doc(firestore, 'vacantes', id, 'candidatos', candidato.id);
        await updateDoc(candidatoRef, { cvSummary: result.response.text() });
      } catch { }
    } catch (error) {
      setCvSummaries(prev => ({ ...prev, [candidato.id]: "Error al generar resumen." }));
      setCvSummarySource(prev => ({ ...prev, [candidato.id]: 'generated' }));
      // Guardar el error en la DB
      try {
        const candidatoRef = doc(firestore, 'vacantes', id, 'candidatos', candidato.id);
        await updateDoc(candidatoRef, { cvSummary: "Error al generar resumen." });
      } catch { }
    }
    setLoadingCVSummary(prev => ({ ...prev, [candidato.id]: false }));
  }
  const params = useParams();
  const id = params?.id as string;

  // --- Estados y Lógica (sin cambios) ---
  const [vacante, setVacante] = useState<Vacante | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Omit<Vacante, 'candidatos' | 'fechaCreacion'>>({
    puesto: '',
    descripcion: '',
    estado: 'Abierta',
  });
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [candidatoEditando, setCandidatoEditando] = useState<Candidato | null>(null);
  // Editar candidato
  const handleEditarCandidato = async (data: NuevoCandidatoData) => {
    if (!id || !candidatoEditando) return;
    try {
      const candidatoRef = doc(firestore, 'vacantes', id, 'candidatos', candidatoEditando.id);
      await updateDoc(candidatoRef, data as { [key: string]: any });
      setCandidatos(prev => prev.map(c => c.id === candidatoEditando.id ? { id: c.id, ...data } : c));
      setIsEditModalOpen(false);
      setCandidatoEditando(null);
    } catch (error) {
      console.error("Error al editar candidato:", error);
    }
  };

  // Eliminar candidato
  const handleEliminarCandidato = async (candidatoId: string) => {
    if (!id) return;
    try {
      const candidatoRef = doc(firestore, 'vacantes', id, 'candidatos', candidatoId);
      await deleteDoc(candidatoRef);
      setCandidatos(prev => prev.filter(c => c.id !== candidatoId));
    } catch (error) {
      console.error("Error al eliminar candidato:", error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!id) return;
      setLoading(true);
      // Fetch de la vacante
      const docRef = doc(firestore, 'vacantes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Vacante;
        setVacante(data);
        setFormData({
          puesto: data.puesto,
          descripcion: data.descripcion,
          estado: data.estado,
        });
      }
      // Fetch de los candidatos
      const candidatosRef = collection(firestore, 'vacantes', id, 'candidatos');
      const snapshot = await getDocs(candidatosRef);
      const listaCandidatos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidato));
      setCandidatos(listaCandidatos);
      setLoading(false);
    };
    fetchAllData();
  }, [id]);

  const handleCrearCandidato = async (candidatoData: NuevoCandidatoData) => {
    if (!id) return;
    try {
      const candidatosRef = collection(firestore, 'vacantes', id, 'candidatos');
      const docRef = await addDoc(candidatosRef, candidatoData);
      setCandidatos(prev => [...prev, { id: docRef.id, ...candidatoData }]);
    } catch (error) {
      console.error("Error al crear candidato:", error);
      throw error;
    }
  };

  const handleSaveChanges = async () => {
    if (!id) return;
    const vacanteDocRef = doc(firestore, 'vacantes', id);
    try {
      await updateDoc(vacanteDocRef, { ...formData });
      setVacante(prev => prev ? { ...prev, ...formData } : null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar la vacante: ", error);
    }
  };

  const handleCancelEdit = () => {
    if (vacante) {
      setFormData({
        puesto: vacante.puesto,
        descripcion: vacante.descripcion,
        estado: vacante.estado,
      });
    }
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <p className="text-center p-10">Cargando datos de la vacante...</p>;
  }

  return (
    <>
      <Header />

      <CrearCandidatoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCrear={handleCrearCandidato}
        vacanteId={id}
      />
      <EditarCandidatoModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setCandidatoEditando(null); }}
        candidato={candidatoEditando}
        onEditar={handleEditarCandidato}
      />

      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <header className="mb-8">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:underline mb-4">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition mb-4 shadow"
            >
              <ArrowLeft size={20} />
              Volver al Dashboard
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Vacante</h1>
          <p className="text-md text-gray-500">{vacante?.puesto}</p>
        </header>

        {/* ================================================================== */}
        {/* SECCIÓN 1: DETALLES DE LA VACANTE                    */}
        {/* ================================================================== */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Información de la Vacante</h2>
            {isEditing ? (
              <div className="flex gap-2">
                <button onClick={handleSaveChanges} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                  <Save size={18} /> Guardar
                </button>
                <button onClick={handleCancelEdit} className="flex items-center gap-2 bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors">
                  <X size={18} /> Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                <Edit size={18} /> Editar
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              {/* Formulario de edición */}
              <div>
                <label htmlFor="puesto" className="block text-sm font-medium text-gray-700">Puesto</label>
                <input type="text" name="puesto" id="puesto" value={formData.puesto} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea name="descripcion" id="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                <select name="estado" id="estado" value={formData.estado} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option value="Abierta">Abierta</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Vista de detalles */}
              <p className="text-gray-600 whitespace-pre-wrap">{vacante?.descripcion}</p>
              <span className={`mt-2 inline-block px-3 py-1 text-sm font-semibold rounded-full ${vacante?.estado === 'Abierta' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                {vacante?.estado}
              </span>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* SECCIÓN 2: GESTIÓN DE CANDIDATOS                    */}
        {/* ================================================================== */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Candidatos</h2>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors">
              <Plus size={18} /> Añadir Candidato
            </button>
          </div>
          <div className="space-y-4">
            {candidatos.length > 0 ? (
              candidatos.map(candidato => (
                <div key={candidato.id} className="flex flex-col gap-2 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-full"><User className="text-blue-600" /></div>
                      <div>
                        <p className="font-bold">{candidato.nombre} {candidato.apellido}</p>
                        <p className="text-sm text-gray-600">{candidato.correo}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <a href={candidato.cvUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
                        <Download size={16} /> Ver CV
                      </a>
                      <button
                        onClick={() => { setCandidatoEditando(candidato); setIsEditModalOpen(true); }}
                        className="px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleEliminarCandidato(candidato.id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        title="Eliminar"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={() => generateCVSummaryForCandidate(candidato)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        disabled={loadingCVSummary[candidato.id]}
                        title="Generar resumen de CV"
                      >
                        {loadingCVSummary[candidato.id] ? 'Resumiendo...' : 'Resumen CV'}
                      </button>
                    </div>
                  </div>
                  {/* Mostrar el resumen individual debajo de cada candidato */}
                  {cvSummaries[candidato.id] && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-200 flex items-center justify-between">
                      <span className="text-green-900 text-sm font-medium">Resumen de CV: {cvSummaries[candidato.id]}</span>
                      <span className={`ml-4 px-2 py-1 text-xs rounded ${cvSummarySource[candidato.id] === 'db' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                        {cvSummarySource[candidato.id] === 'db' ? 'Guardado' : 'Generado'}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Aún no hay candidatos para esta vacante.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}