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

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onSendMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Start recording audio
  const startAudioRecording = async () => {
    setTranscript('');
    setIsRecording(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      handleUploadAndTranscribe(audioBlob);
      setIsRecording(false);
    };
    mediaRecorder.start();
  };

  // Stop recording audio
  const stopAudioRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // Upload audio and get transcription from backend
  const handleUploadAndTranscribe = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    const res = await fetch('http://localhost:5000/transcribe', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    // data.text: transcription, data.language: detected language, data.emotion: detected emotion

    // Example: show all in chat
    if (onSendMessage) {
      onSendMessage(`${data.text} (Emotion: ${data.emotion || 'N/A'})`);
    }
    setTranscript(data.text || '');
    // Optionally, show emotion elsewhere in your UI
    // setEmotion(data.emotion || '');
    setIsOpen(false); // Close dialog after transcription
  };

  // Upload audio and detect emotion
  const handleUploadAndDetectEmotion = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav'); // Use .wav if possible
    const res = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    // Optionally show emotion in UI
    alert('Detected emotion: ' + data.emotion);
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
            onClick={isRecording ? stopAudioRecording : startAudioRecording}
            className={isRecording ? 'bg-red-500 text-white' : ''}
          >
            {isRecording ? <Square /> : <Mic />}
            {isRecording ? ' Stop' : ' Start'}
          </Button>
        </div>
        <div className="min-h-[80px] border rounded p-2 bg-background">
          <span className="text-muted-foreground">
            {transcript || 'Speak and stop to see transcription...'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceInterface;
