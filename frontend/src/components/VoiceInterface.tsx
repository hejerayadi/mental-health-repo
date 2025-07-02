import React, { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface VoiceInterfaceProps {
  onSendMessage?: (messageContent?: string) => void;
}

const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'ar-SA', label: 'العربية' },
];

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onSendMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
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
      if (transcript.trim() && onSendMessage) {
        onSendMessage(transcript.trim());
      }
      setIsOpen(false);
    };

    recognition.start();
  };

  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      // Send the transcript to chat and close the dialog
      if (transcript.trim() && onSendMessage) {
        onSendMessage(transcript.trim());
      }
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          <Mic />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Voice Input</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Button
            onClick={isRecording ? stopRecognition : startRecognition}
            className={isRecording ? 'bg-red-500 text-white' : ''}
          >
            {isRecording ? <Square /> : <Mic />}
            {isRecording ? ' Stop' : ' Start'}
          </Button>
        </div>
        <div className="min-h-[80px] border rounded p-2 bg-background">
          <span className="text-muted-foreground">{transcript || 'Speak and stop to see transcription...'}</span>
        </div>
        <div className="mt-4">
          <label htmlFor="lang" className="block text-sm font-medium text-white">
            Select Language:
          </label>
          <select
            id="lang"
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="border rounded px-2 py-1 bg-black text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 mt-2"
          >
            {LANGUAGES.map(lang => (
              <option
                key={lang.code}
                value={lang.code}
                style={{
                  backgroundColor: language === lang.code ? '#8b5cf6' : '#000',
                  color: '#fff'
                }}
              >
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceInterface;
