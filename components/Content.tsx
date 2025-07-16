'use client'

import { useState, useEffect} from 'react'
import { ChevronRight, Mic, Circle} from 'lucide-react'
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
import { doc, getDoc, setDoc } from 'firebase/firestore'


interface Interviewee {
  id: number
  name: string
  question: string
  response: string
}

export default function Content() {
  const { user } = useUser();
  const fireStore = firestore;
  const data = doc(fireStore, `users/${user?.uid}`);

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not defined");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  async function generateSummary(style: number) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});
    let result;

    if (style == 0){
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
    } else if (style == 1){
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
    } else if (style == 2){
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
  const [questionID, setQuestionID] = useState<number>(0)
  const [intervieweeID, setIntervieweeID] = useState<number>(1)
  const [question, setQuestion] = useState<string>('')
  const [interviewees, setInterviewee] = useState<Interviewee[]>([])

  const [recognizer, setRecognizer] = useState<SpeechSDK.SpeechRecognizer | null>(null);

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

    const readDocument = async () => {
      const mySnapshot = await getDoc(data);
      if (mySnapshot.exists()) {
        const info = mySnapshot.data();
        const val = info.questionID == 0 ? 0 : info.questionID+1
        console.log(val)
        console.log(info.questionID)
        if (info) {
          setIntervieweeID(info.intervieweeID);
          setQuestionID(val);
          setQuestion(info.question);
          setInterviewee(info.interviewees);
        }
      }
    }

    readDocument();

    return () => {
      newRecognizer.close();
    };
  }, []);

  const deleteAll = () => {
    interviewees.splice(0, interviewees.length)
    setQuestionID(0)
    setIntervieweeID(1)
    setQuestionRecorded(false)

    const saveDocument = async () => {
      const docData = {
        interviewees: [],
        questionID: 0,
        intervieweeID: 1,
        question: '',
      };
      try {
        await setDoc(data, docData, { merge: true });
        console.log("Document written with ID: ", data.id);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    };
    saveDocument();
  }

  const startRecognition = () => {
    if (!recognizer) {
      console.error("Speech recognizer is not initialized");
      return;
    }

    setIsRecording(true);

    recognizer.recognizeOnceAsync(
      result => {
        if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          if (activeButton === 'question') {
            console.log("Entre a pregunta")
            setIntervieweeID(1)
            setQuestion(result.text)
            interviewees.push({ id: questionID, name: `interviewee ${1}`, question: `${result.text}`, response: ""})
            setQuestionRecorded(true)
            const saveDocument = async () => {
              const docData = {
                interviewees: interviewees,
                questionID: questionID,
                intervieweeID: intervieweeID,
                question: question,
              };
              try {
                await setDoc(data, docData, { merge: true });
                console.log("Document written with ID: ", data.id);
              } catch (e) {
                console.error("Error adding document: ", e);
              }
            };
            saveDocument();
          }
        if (activeButton === 'answer') {
          console.log(interviewees)
          console.log(questionID)
          if (!questionRecorded){
            console.log("Entre a falso respuesta")
            interviewees.push({ id: questionID, name: `interviewee ${intervieweeID}`, question: `${question}`, response: ""})
          }
          interviewees[questionID].response = result.text
          setQuestionID(questionID + 1)
          setIntervieweeID(intervieweeID + 1)
          setQuestionRecorded(false)

          const saveDocument = async () => {
            const docData = {
              interviewees: interviewees,
              questionID: questionID,
              intervieweeID: intervieweeID,
              question: question,
            };
            try {
              await setDoc(data, docData, { merge: true });
              console.log("Document written with ID: ", data.id);
            } catch (e) {
              console.error("Error adding document: ", e);
            }
          };
          saveDocument();

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
  const intervieweesText = interviewees.map(interviewee =>
    `Interview ${interviewee.name}\n
    Question: ${interviewee.question}\n
    ${interviewee.response}\n`
  ).join('\n');


  const toggleActiveButton = (button: 'question' | 'answer') => {
    setActiveButton(button)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <h2 className="text-3xl font-bold text-center my-8">¡Tu asistente de IA para entrevistas!</h2>
        <div className="flex items-center space-x-2 mb-4">
          <button
            className={`bg-red-600 text-white p-3 rounded-full flex-shrink-0 transition-all duration-300 ease-in-out ${questionRecorded && activeButton === 'question' ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={isRecording ? stopRecognition : startRecognition}
            disabled={questionRecorded && activeButton === 'question' }
          >
            {isRecording ? <Circle size={24} /> : <Mic size={24} />}
          </button>

          <div className="flex-grow flex space-x-2">
            <button
              disabled={questionRecorded}
              className={`px-6 py-3 rounded-full flex-grow text-center transition-colors duration-300 ease-in-out ${
              activeButton === 'question' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'
              } ${questionRecorded ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => toggleActiveButton('question')}
            >
              Pregunta
            </button>
            <button
              disabled={!questionRecorded}
              className={`px-6 py-3 rounded-full flex-grow text-center transition-colors duration-300 ease-in-out ${
              activeButton === 'answer' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'
              } ${!questionRecorded ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => toggleActiveButton('answer')}
            >
              Respuesta
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {interviewees.map((interviewee) => (
            <div key={interviewee.id} className="bg-gray-100 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {interviewee.question}
                </h3>
                <ChevronRight className="text-gray-400" />
              </div>
              <p className="text-gray-600 mt-1">{interviewee.name}</p>
              <p className="mt-2">{interviewee.response}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-8">
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
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300" onClick={() => generateSummary(1)}>
                Genera un resumen por cada entrevistado
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resumen de cada entrevistado:</DialogTitle>
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
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-300" onClick={() => generateSummary(2)}>
                ¿Quién es el mejor?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>El mejor candidato:</DialogTitle>
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