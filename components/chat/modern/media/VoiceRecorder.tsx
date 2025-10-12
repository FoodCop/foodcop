'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Send,
  Volume2,
  VolumeX
} from 'lucide-react';
import { VoiceRecording, VoiceMessageControls } from '../utils/ChatTypes';

interface VoiceRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onSendRecording: (recording: VoiceRecording) => void;
  maxDuration?: number; // in seconds
  minDuration?: number; // in seconds
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  isOpen,
  onClose,
  onSendRecording,
  maxDuration = 300, // 5 minutes
  minDuration = 1 // 1 second
}) => {
  const [recording, setRecording] = useState<VoiceRecording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackControls, setPlaybackControls] = useState<VoiceMessageControls>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    volume: 1
  });
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize audio context and get permission
  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      streamRef.current = stream;
      setHasPermission(true);

      // Create audio context for waveform visualization
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;
      
      const source = audioContext.createMediaStreamSource(stream);
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      // Setup MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        
        // Get duration from audio element
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          const newRecording: VoiceRecording = {
            id: `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            blob,
            url,
            duration: audio.duration,
            waveformData: [...waveformData],
            isRecording: false,
            isPaused: false,
            timestamp: new Date().toISOString()
          };
          
          setRecording(newRecording);
          setPlaybackControls(prev => ({
            ...prev,
            duration: audio.duration
          }));
        };
        
        chunksRef.current = [];
      };

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setHasPermission(false);
    }
  }, [waveformData]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!hasPermission) {
      await initializeAudio();
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);
      setCurrentTime(0);
      setWaveformData([]);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= maxDuration) {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
              setIsRecording(false);
              setIsPaused(false);
              
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              
              if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = null;
              }
            }
            return maxDuration;
          }
          return newTime;
        });
      }, 100);

      // Start waveform animation
      if (analyserRef.current) {
        const updateWaveformLocal = () => {
          if (!analyserRef.current || !isRecording) return;

          const analyser = analyserRef.current;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          analyser.getByteFrequencyData(dataArray);
          
          // Calculate average volume level
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          const normalizedLevel = average / 255;
          
          setAudioLevel(normalizedLevel);
          
          // Add to waveform data (sample every few frames to avoid too much data)
          setWaveformData(prev => [...prev, normalizedLevel].slice(-200)); // Keep last 200 samples

          animationRef.current = requestAnimationFrame(updateWaveformLocal);
        };
        updateWaveformLocal();
      }
    }
  }, [hasPermission, initializeAudio, maxDuration, isRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, []);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, []);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Restart timer
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return newTime;
        });
      }, 100);
    }
  }, [maxDuration, stopRecording]);

  // Play recorded audio
  const playRecording = useCallback(() => {
    if (!recording || !recording.url) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(recording.url);
      
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setPlaybackControls(prev => ({
            ...prev,
            currentTime: audioRef.current!.currentTime
          }));
        }
      };
      
      audioRef.current.onended = () => {
        setPlaybackControls(prev => ({
          ...prev,
          isPlaying: false,
          currentTime: 0
        }));
      };
    }

    if (playbackControls.isPlaying) {
      audioRef.current.pause();
      setPlaybackControls(prev => ({ ...prev, isPlaying: false }));
    } else {
      audioRef.current.play();
      setPlaybackControls(prev => ({ ...prev, isPlaying: true }));
    }
  }, [recording, playbackControls.isPlaying]);

  // Delete recording
  const deleteRecording = useCallback(() => {
    if (recording?.url) {
      URL.revokeObjectURL(recording.url);
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    setRecording(null);
    setPlaybackControls({
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      volume: 1
    });
  }, [recording]);

  // Send recording
  const sendRecording = useCallback(() => {
    if (recording && recording.duration >= minDuration) {
      onSendRecording(recording);
      onClose();
      // Reset state but don't cleanup URL - let parent handle that
      setRecording(null);
      setCurrentTime(0);
      setWaveformData([]);
    }
  }, [recording, minDuration, onSendRecording, onClose]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Reset when dialog closes
  useEffect(() => {
    if (!isOpen) {
      if (isRecording) {
        stopRecording();
      }
      deleteRecording();
      setCurrentTime(0);
      setWaveformData([]);
      setAudioLevel(0);
    }
  }, [isOpen, isRecording, stopRecording, deleteRecording]);

  // Initialize audio when dialog opens
  useEffect(() => {
    if (isOpen && hasPermission === null) {
      initializeAudio();
    }
  }, [isOpen, hasPermission, initializeAudio]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {hasPermission === false && (
            <div className="text-center py-8">
              <MicOff className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Microphone Access Required</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please allow microphone access to record voice messages.
              </p>
              <Button onClick={initializeAudio}>
                Grant Permission
              </Button>
            </div>
          )}

          {hasPermission === true && (
            <>
              {/* Waveform Visualization */}
              <div className="relative h-24 bg-gray-50 rounded-lg p-4 overflow-hidden">
                <div className="flex items-center justify-center h-full">
                  {isRecording || recording ? (
                    <div className="flex items-end gap-1 h-full">
                      {waveformData.map((level, index) => (
                        <div
                          key={index}
                          className="bg-orange-500 rounded-full min-w-[2px] transition-all duration-75"
                          style={{
                            height: `${Math.max(2, level * 100)}%`,
                            opacity: isRecording && index === waveformData.length - 1 ? 1 : 0.7
                          }}
                        />
                      ))}
                      {isRecording && (
                        <div
                          className="bg-red-500 rounded-full w-1 animate-pulse"
                          style={{ height: `${Math.max(10, audioLevel * 100)}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm">Ready to record</div>
                  )}
                </div>
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <Badge variant="destructive" className="text-xs">REC</Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Display */}
              <div className="text-center">
                <div className="text-2xl font-mono font-bold">
                  {formatTime(recording ? playbackControls.currentTime : currentTime)}
                </div>
                {recording && (
                  <div className="text-sm text-gray-500">
                    / {formatTime(recording.duration)}
                  </div>
                )}
                {isRecording && (
                  <Progress 
                    value={(currentTime / maxDuration) * 100} 
                    className="mt-2"
                  />
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-center gap-4">
                {!recording ? (
                  // Recording controls
                  <>
                    {!isRecording ? (
                      <Button
                        size="lg"
                        onClick={startRecording}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
                      >
                        <Mic className="w-6 h-6" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={isPaused ? resumeRecording : pauseRecording}
                          className="w-12 h-12 rounded-full"
                        >
                          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                        </Button>
                        
                        <Button
                          size="lg"
                          onClick={stopRecording}
                          className="w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-600"
                        >
                          <Square className="w-6 h-6" />
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  // Playback controls
                  <>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={deleteRecording}
                      className="w-12 h-12 rounded-full"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={playRecording}
                      className="w-16 h-16 rounded-full"
                    >
                      {playbackControls.isPlaying ? 
                        <Pause className="w-6 h-6" /> : 
                        <Play className="w-6 h-6" />
                      }
                    </Button>
                    
                    <Button
                      size="lg"
                      onClick={sendRecording}
                      disabled={!recording || recording.duration < minDuration}
                      className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-gray-600">
                {!recording ? (
                  !isRecording ? (
                    <p>Tap to start recording</p>
                  ) : (
                    <p>{isPaused ? 'Recording paused' : 'Recording in progress...'}</p>
                  )
                ) : (
                  <p>
                    {recording.duration < minDuration ? 
                      `Recording too short (min ${minDuration}s)` : 
                      'Tap play to review or send your message'
                    }
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceRecorder;