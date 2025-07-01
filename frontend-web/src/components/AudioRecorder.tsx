'use client';

import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, Play, Pause } from 'lucide-react';
import { AudioRecording } from '@/types/emergency';

interface AudioRecorderProps {
  onRecordingComplete: (recording: AudioRecording) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

export function AudioRecorder({ 
  onRecordingComplete, 
  maxDuration = 300, // 5 minutes default
  className = '' 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const recording: AudioRecording = {
          blob,
          duration,
          url,
        };

        onRecordingComplete(recording);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setDuration(0);

      // Start timer
             timerRef.current = setInterval(() => {
         setDuration((prev: number) => {
           const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
            return newDuration;
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  }, [duration, maxDuration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  }, [isRecording, isPaused]);

  const playRecording = useCallback(() => {
    if (audioUrl && audioPlayerRef.current) {
      if (isPlaying) {
        audioPlayerRef.current.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [audioUrl, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    setAudioUrl(null);
    setIsPlaying(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className={`audio-recorder ${className}`}>
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        
        {/* Recording Controls */}
        <div className="flex items-center space-x-2">
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              className="flex items-center justify-center w-12 h-12 bg-emergency-500 text-white rounded-full hover:bg-emergency-600 transition-colors"
              title="Start Recording"
            >
              <Mic size={20} />
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={pauseRecording}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                  isPaused 
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </button>

              <button
                onClick={stopRecording}
                className="flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Stop Recording"
              >
                <Square size={20} />
              </button>
            </>
          )}
        </div>

        {/* Recording Status */}
        <div className="flex-1">
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="text-sm font-medium">
                {isPaused ? 'Paused' : 'Recording'} - {formatTime(duration)}
              </span>
              <span className="text-xs text-gray-500">
                Max: {formatTime(maxDuration)}
              </span>
            </div>
          )}

          {audioUrl && !isRecording && (
            <div className="flex items-center space-x-2">
              <button
                onClick={playRecording}
                className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <span className="text-sm font-medium">
                Recording ready - {formatTime(duration)}
              </span>
              <button
                onClick={resetRecording}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                Record again
              </button>
            </div>
          )}

          {!isRecording && !audioUrl && (
            <span className="text-sm text-gray-500">
              Click the microphone to start recording your emergency report
            </span>
          )}
        </div>
      </div>

      {/* Hidden audio player for playback */}
      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
} 