import React, { useRef, useState } from 'react';

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'fr-FR', label: 'French' },
  { code: 'ar-SA', label: 'Arabic' },
];

const SpeechToText: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [language, setLanguage] = useState('en-US');
  const recognitionRef = useRef<any>(null);

  const getRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition API not supported in this browser.');
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    return recognition;
  };

  const startRecognition = () => {
    const recognition = getRecognition();
    if (!recognition) return;
    recognitionRef.current = recognition;
    setTranscript('');
    setIsRecording(true);

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(final + interim);
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      alert('Speech recognition error: ' + event.error);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-card shadow max-w-xl mx-auto">
      <div className="mb-2 flex gap-2 items-center">
        <label htmlFor="lang" className="text-sm font-medium">Language:</label>
        <select
          id="lang"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="border rounded px-2 py-1"
          disabled={isRecording}
        >
          {LANGUAGES.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.label}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={isRecording ? stopRecognition : startRecognition}
          className={`px-4 py-2 rounded ${isRecording ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'}`}
        >
          {isRecording ? 'Stop' : 'Start'} Recording
        </button>
      </div>
      <div className="min-h-[80px] border rounded p-2 bg-background">
        <span className="text-muted-foreground">{transcript || 'Speak to see transcription...'}</span>
      </div>
    </div>
  );
};

export default SpeechToText;