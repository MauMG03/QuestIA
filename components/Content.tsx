'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Mic, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { GoogleGenerativeAI } from "@google/generative-ai"
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { useUser } from '@/context/UserContext'
import { firestore } from "../firebase/firebaseConfig"
import { doc, getDoc, setDoc, collection } from 'firebase/firestore'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast';


interface Interview {
  id: number;
  question: string;
  response: string;
}

export default function Content() {

  const { user } = useUser();
  const searchParams = useSearchParams();
  const vacanteId = searchParams?.get('vacanteId') ?? null;
  const candidatoId = searchParams?.get('candidatoId') ?? null;
  const fireStore = firestore;
  // Referencia a la colección de entrevistas del candidato en la vacante
  const entrevistasRef = vacanteId && candidatoId ? collection(fireStore, `vacantes/${vacanteId}/candidatos/${candidatoId}/entrevistas`) : null;

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  async function generateSummary(style: number) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let result;

    if (style == 0) {
      result = await model.generateContent([`
        A partir de ahora te comportarás como un asistente para entrevistas que habla en español.
        Tu responsabilidad será ayudar al entrevistador con las tareas que se te encomendarán.
        Tu recibes las preguntas y respuestas de los entrevistados. No debes de usar
        markdown.

        Genera un resumén sobre la siguientes respuestas de los entrevistados en español.
        El resumen debe de ser general sobre todos los entrevistados y no ir sobre
        cada una de las respuestas. No debes de sobrepasar más de 75 palabras. \n

        Aquí te brindo las preguntas y respuestas de cada entrevistado: \n
        `, intervieweesText]);
    } else if (style == 1) {
      result = await model.generateContent([`
        A partir de ahora te comportarás como un asistente para entrevistas que habla en español.
        Tu responsabilidad será ayudar al entrevistador con las tareas que se te encomendarán.
        Tu recibes las preguntas y respuestas de los entrevistados. No debes de usar
        markdown.

        Genera un resumén general sobre cada entrevistado en español. El resumen debe de
        ser general sobre cada uno de los entrevistados y cada resumen de entrevistado no
        debe de sobrepasar más de 50 palabras. \n

        El formato de entrega debe de ser el siguiente: \n

        Entrevistado 1:
        [Resumen de 50 palabras]

        Entrevistado 2:
        [Resumen de 50 palabras]

        Aquí te brindo las preguntas y respuestas de cada entrevistado: \n
        `, intervieweesText]);
    } else if (style == 2) {
      result = await model.generateContent([`
        A partir de ahora te comportarás como un asistente para entrevistas que habla en español.
        Tu responsabilidad será ayudar al entrevistador con las tareas que se te encomendarán.
        Tu recibes las preguntas y respuestas de los entrevistados. No debes de usar
        markdown.

        Deberás de escoger quien es el candidato ideal para el puesto de trabajo en base a las
        preguntas realizadas. ¿Por qué se acomoda mejor para el puesto?, ¿Por qué es mejor que
        los demás candidatos?, ¿Qué habilidades lo hacen destacar? \n

        Ten en cuenta que el formato en que se te en

        El formato de entrega debe de ser el siguiente:
        "El candidato ideal para el puesto es el entrevistado [Número de entrevistado]
        porque..." \n

        Aquí te brindo las preguntas y respuestas de cada entrevistado: \n
        `, intervieweesText]);
    } else {
      result = await model.generateContent([`
        Just answer this: '~(˘▾˘~)' Don't answer anything different, just this: '~(˘▾˘~)'`])
    }

    console.log(result.response.text());

    const formattedResult = result.response.text().split('\n');
    setSummaryResult(formattedResult);
  }

  const [isRecording, setIsRecording] = useState(false)
  const [questionRecorded, setQuestionRecorded] = useState<boolean>(false)
  const [activeButton, setActiveButton] = useState<'question' | 'answer'>('question')
  const [summaryResult, setSummaryResult] = useState<string[]>([])
  const [questionID, setQuestionID] = useState<number>(0);
  const [question, setQuestion] = useState<string>('');
  const [interviews, setInterviews] = useState<Interview[]>([]);

  const [recognizer, setRecognizer] = useState<SpeechSDK.SpeechRecognizer | null>(null);
  // Estado para ver Q&A guardadas
  const [qaModalOpen, setQaModalOpen] = useState(false);
  const [qaLoading, setQaLoading] = useState(false);
  const [qaData, setQaData] = useState<Interview[] | null>(null);
  // Handler para ver Q&A guardadas
  const handleVerQA = async () => {
    if (!vacanteId || !candidatoId) return;
    setQaLoading(true);
    setQaModalOpen(true);
    setQaData(null);
    try {
      const candidatoRef = doc(fireStore, `vacantes/${vacanteId}/candidatos/${candidatoId}`);
      const candidatoSnap = await getDoc(candidatoRef);
      if (candidatoSnap.exists()) {
        const data = candidatoSnap.data();
        if (Array.isArray(data.entrevista)) {
          setQaData(data.entrevista);
        } else {
          setQaData([]);
        }
      } else {
        setQaData([]);
      }
    } catch (err) {
      setQaData([]);
    }
    setQaLoading(false);
  };

  useEffect(() => {
    const subscriptionKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
    const region = process.env.NEXT_PUBLIC_AZURE_REGION;

    if (!subscriptionKey || !region) {
      console.error("Azure Speech Service key or region is not defined");
      return;
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey, region);
    speechConfig.speechRecognitionLanguage = "es-ES";
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    const newRecognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    setRecognizer(newRecognizer);
    // No leer documento de usuario, las entrevistas se guardan por vacante/candidato
    return () => {
      newRecognizer.close();
    };
  }, []);

  const deleteAll = () => {
    setInterviews([]);
    setQuestionID(0);
    setQuestionRecorded(false);
    // Borrar todas las entrevistas del candidato en la vacante
    // (Opcional: implementar borrado en Firestore si lo deseas)
  }

  const startRecognition = async () => {
    if (!recognizer) {
      console.error("Speech recognizer is not initialized");
      return;
    }
    if (!vacanteId || !candidatoId) {
      alert("Faltan parámetros de vacante o candidato");
      return;
    }
    setIsRecording(true);
    recognizer.recognizeOnceAsync(
      async result => {
        if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          if (activeButton === 'question') {
            setQuestion(result.text);
            const newInterview: Interview = { id: questionID, question: result.text, response: "" };
            setInterviews(prev => [...prev, newInterview]);
            setQuestionRecorded(true);
            // Guardar pregunta en Firestore
            if (entrevistasRef) {
              await setDoc(doc(entrevistasRef, `${questionID}`), newInterview);
            }
          }
          if (activeButton === 'answer' && interviews.length > 0) {
            const updatedInterviews = interviews.map((item, idx) =>
              idx === interviews.length - 1 ? { ...item, response: result.text } : item
            );
            setInterviews(updatedInterviews);
            setQuestionID(questionID + 1);
            setQuestionRecorded(false);
            // Guardar respuesta en Firestore
            if (entrevistasRef) {
              await setDoc(doc(entrevistasRef, `${questionID}`), updatedInterviews[updatedInterviews.length - 1]);
            }
          }
        } else {
          console.error("Speech recognition error:", result.errorDetails);
        }
        setIsRecording(false);
      },
      error => {
        console.error("Speech recognition error:", error);
        setIsRecording(false);
      }
    );
  };

  const stopRecognition = () => {
    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync();
      setIsRecording(false);
    }
  };
  const intervieweesText = interviews.length > 0
    ? interviews.map(i => `Pregunta: ${i.question}\nRespuesta: ${i.response}\n`).join('\n')
    : '';


  const toggleActiveButton = (button: 'question' | 'answer') => {
    setActiveButton(button)
  }

  const handleGuardarEntrevista = async () => {
    if (!vacanteId || !candidatoId || interviews.length === 0) {
      toast.error('No hay información para guardar.');
      return;
    }
    try {
      // Guardar todas las preguntas y respuestas en un solo documento
      await setDoc(doc(fireStore, `vacantes/${vacanteId}/candidatos/${candidatoId}`), {
        entrevista: interviews
      }, { merge: true });
      toast.success('Entrevista guardada correctamente.');
    } catch (error) {
      toast.error('Error al guardar la entrevista.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal para ver Q&A guardadas */}
      {qaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Preguntas y respuestas guardadas</h2>
            {qaLoading ? (
              <p className="text-blue-600">Cargando Q&amp;A...</p>
            ) : qaData && qaData.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {qaData.map((qa, idx) => (
                  <div key={idx} className="border rounded p-3 bg-gray-50">
                    <p className="font-semibold text-indigo-700">Pregunta {idx + 1}: <span className="font-normal text-gray-800">{qa.question}</span></p>
                    <p className="mt-1 text-gray-900"><span className="font-semibold text-green-700">Respuesta:</span> {qa.response}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No hay preguntas y respuestas guardadas para este candidato.</p>
            )}
            <div className="mt-6 flex justify-end">
              <button onClick={() => setQaModalOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Cerrar</button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-3xl font-bold text-center my-8">¡Tu asistente de IA para entrevistas!</h2>
        {(!vacanteId || !candidatoId) && (
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded mb-4 text-center">
            Faltan parámetros de vacante o candidato. Por favor, accede desde la vacante y selecciona un candidato.
          </div>
        )}
        <div className="flex items-center space-x-2 mb-4">
          <button
            className={`bg-red-600 text-white p-3 rounded-full flex-shrink-0 transition-all duration-300 ease-in-out ${questionRecorded && activeButton === 'question' ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={isRecording ? stopRecognition : startRecognition}
            disabled={questionRecorded && activeButton === 'question' || !vacanteId || !candidatoId}
          >
            {isRecording ? <Circle size={24} /> : <Mic size={24} />}
          </button>
          <div className="flex-grow flex space-x-2">
            <button
              disabled={questionRecorded || !vacanteId || !candidatoId}
              className={`px-6 py-3 rounded-full flex-grow text-center transition-colors duration-300 ease-in-out ${activeButton === 'question' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'
                } ${questionRecorded ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => toggleActiveButton('question')}
            >
              Pregunta
            </button>
            <button
              disabled={!questionRecorded || !vacanteId || !candidatoId}
              className={`px-6 py-3 rounded-full flex-grow text-center transition-colors duration-300 ease-in-out ${activeButton === 'answer' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'
                } ${!questionRecorded ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => toggleActiveButton('answer')}
            >
              Respuesta
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {interviews.map(interview => (
            <div key={interview.id} className="bg-gray-100 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {interview.question}
                </h3>
                <ChevronRight className="text-gray-400" />
              </div>
              <p className="mt-2">{interview.response}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-8">
          <Button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700" onClick={handleGuardarEntrevista}>
            Guardar entrevista
          </Button>
          <Button className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700" onClick={handleVerQA}>
            Ver Q&A guardadas
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700" onClick={() => generateSummary(0)}>
                Genera un resumen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resumen de los candidatos:</DialogTitle>
                <DialogDescription>
                  {summaryResult.map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <Button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300" onClick={deleteAll}>
            Borrar todo
          </Button>
        </div>
      </div>
    </div>
  )
}