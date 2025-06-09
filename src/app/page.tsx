'use client'
import { useState, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';

/**
 * Homepage component with ElevenLabs conversational AI integration.
 * Features dual-sphere interface where main sphere reacts to user audio
 * and background sphere reacts to AI audio from the conversation.
 */
export default function Home() {
  const [clickedHalf, setClickedHalf] = useState<'maya' | 'miles' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userAudioLevel, setUserAudioLevel] = useState(0);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationStartTime, setConversationStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  // Audio monitoring for user microphone
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * ElevenLabs conversation hook with handlers for connection events
   * and audio monitoring for AI speech detection
   */
  const conversation = useConversation({
    onConnect: () => {
      console.log('🤖 Connected to ElevenLabs conversation');
      setConversationStarted(true);
      setConversationStartTime(Date.now());
      setElapsedTime(0);
      setIsLoading(false);
      startUserMicrophoneMonitoring();
    },
    onDisconnect: () => {
      console.log('🤖 Disconnected from ElevenLabs conversation');
      setConversationStarted(false);
      setConversationStartTime(null);
      setElapsedTime(0);
      stopUserMicrophoneMonitoring();
    },
    onError: (error) => {
      console.error('🤖 Conversation error:', error);
      setIsLoading(false);
    },
    onMessage: (message) => {
      console.log('🤖 Conversation message:', message);
    }
  });

  // Log isSpeaking state changes
  useEffect(() => {
    console.log(`🤖 isSpeaking changed: ${conversation.isSpeaking}`);
  }, [conversation.isSpeaking]);

  /**
   * Formats elapsed time in MM:SS format
   */
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  /**
   * Handles clicking on Maya or Miles half.
   * Fetches signed URL and starts conversation.
   */
  const handleHalfClick = async (half: 'maya' | 'miles') => {
    if (conversationStarted) {
      // If conversation is already started, just return to main view
      setClickedHalf(null);
      await conversation.endSession();
      return;
    }

    setIsTransitioning(true);
    setIsLoading(true);
    
    // Set the clicked half after transition
    setTimeout(() => {
      setClickedHalf(half);
      setIsTransitioning(false);
    }, 600);

    try {
      console.log(`🚀 Starting conversation for ${half}...`);
      
      // Fetch signed URL from your API
      // const response = await fetch('https://try.zudu.ai/api/get-signed-url', {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error(`Failed to get signed URL: ${response.statusText}`);
      // }

      // const data = await response.json();
      // console.log('🔗 Received signed URL:', data);

      // Request microphone access before starting conversation
      await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Start conversation with signed URL
      const conversationId = await conversation.startSession({ 
        // signedUrl: data.signedUrl 
        signedUrl: 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=qx9sWoq9YQs7ZyHZm1uO&conversation_signature=cvtkn_01jxb7d97re7dvdtmbddxp9aws' 
      });
      
      console.log('🎯 Conversation started with ID:', conversationId);
      
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      setIsLoading(false);
      setClickedHalf(null);
      // You might want to show an error message to the user here
    }
  };

  /**
   * Starts monitoring user microphone audio levels for main sphere animation
   */
  const startUserMicrophoneMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      // Create audio context and analyser for user audio
      const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioContextConstructor();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Configure analyser
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      console.log('🎤 Started user microphone monitoring');
      monitorUserAudioLevel();
      
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
    }
  };

  /**
   * Monitors user audio levels for main sphere reactions
   */
  const monitorUserAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let frameCount = 0;
    
    const updateLevel = () => {
      if (!analyserRef.current) {
        console.log('🎤 Stopping user audio monitoring - no analyser');
        return;
      }
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Normalize to 0-1 range and apply sensitivity
      const normalizedLevel = Math.min(average / 128, 1);
      const sensitiveLevel = Math.pow(normalizedLevel, 0.7);
      
      // Log for debugging (throttled)
      frameCount++;
      if (frameCount % 60 === 0) {
        console.log(`🎤 User Audio Level: ${(sensitiveLevel * 100).toFixed(1)}%`);
      }
      
      setUserAudioLevel(sensitiveLevel);
      
      // Continue monitoring
      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };
    
    updateLevel();
  };



  /**
   * Stops user microphone monitoring and cleans up resources
   */
  const stopUserMicrophoneMonitoring = () => {
    console.log('🎤 Stopping user microphone monitoring...');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setUserAudioLevel(0);
    console.log('🎤 User microphone resources cleaned up');
  };



  // AI speaking state is handled directly through conversation.isSpeaking
  // No need for separate audio level state since we use isSpeaking for animations

  // Timer effect to update elapsed time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (conversationStarted && conversationStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - conversationStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [conversationStarted, conversationStartTime]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      stopUserMicrophoneMonitoring();
      if (conversationStarted) {
        conversation.endSession();
      }
    };
  }, [conversationStarted, conversation]);

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor: '#F5F5F5'}}>
      {/* Header with leaf icon, timer, and login link */}
      <header className="flex justify-between items-center p-6">
        {/* Green leaf icon */}
        <div className="flex items-center">
          <div className="w-8 h-8 text-green-600">
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-full h-full"
            >
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22.45C8.33,16.5 11,14.28 17,8M17.8,21.66L16.11,22.81C13.76,19.16 11.89,16.5 9,14.5L10.29,13.22C14.77,16.75 16.67,19.85 17.8,21.66Z"/>
            </svg>
          </div>
        </div>
        
        {/* Conversation Timer - only visible during conversation */}
        {conversationStarted && (
          <div className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-gray-700 font-mono text-sm font-medium">
              {formatTime(elapsedTime)}
            </span>
          </div>
        )}
        
        {/* Login link */}
        <a 
          href="/login" 
          className="text-gray-700 hover:text-gray-900 font-medium"
        >
          Log in
        </a>
      </header>

      {/* Main content area with centered interface */}
      <main className="flex-1 flex items-center justify-center px-12">
        <div className="relative w-96 h-96 flex items-center justify-center">
          {clickedHalf ? (
            // Sphere mode with dual sphere animation
            <div className="sphere-container">
              {/* AI speaking ring animation - only visible when AI is speaking */}
              {conversation.isSpeaking && (
                <div 
                  className="ai-speaking-ring"
                  style={{
                    borderColor: clickedHalf === 'maya' ? '#B8C9A0' : '#A8B898',
                  }}
                />
              )}
              
              {/* Background sphere - grows larger when AI speaking and performs heartbeat */}
              <div 
                className={`background-sphere ${conversation.isSpeaking ? 'ai-heartbeat' : ''}`}
                style={{
                  backgroundColor: clickedHalf === 'maya' ? '#8B9C73' : '#7A8A6A',
                  // backgroundColor: 'red',
                  opacity: conversation.isSpeaking ? 0.2: 0.1,
                  transform: conversation.isSpeaking ? 'scale(1.3)' : 'scale(1)',
                  transition: 'opacity 0.2s ease-out, transform 0.3s ease-out'
                }}
              />
              
              {/* Main sphere - reacts to user audio */}
              <div 
                className={`main-sphere cursor-pointer ${userAudioLevel > 0.1 ? 'reacting-to-user-audio' : ''}`}
                style={{
                  backgroundColor: clickedHalf === 'maya' ? '#B8C9A0' : '#A8B898',
                  transform: `scale(${1 + userAudioLevel * 0.3})`,
                  transition: 'transform 0.05s ease-out'
                }}
                onClick={() => handleHalfClick(clickedHalf)}
              />

              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
                    Connecting...
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Square mode - original interface
            <div className={`rounded-lg w-96 h-96 flex flex-col shadow-sm overflow-hidden contact-container ${isTransitioning ? 'transitioning-to-sphere' : ''}`}>
              {/* Maya half - top */}
              <div 
                className="maya-half flex items-center justify-center cursor-pointer" 
                style={{backgroundColor: '#B8C9A0'}}
                onClick={() => handleHalfClick('maya')}
              >
                <div className="w-8 h-8 mr-6" style={{color: '#5A6B4A'}}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-full h-full"
                  >
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </div>
                <span className="font-medium text-2xl" style={{color: '#5A6B4A'}}>Maya</span>
              </div>

              {/* Miles half - bottom */}
              <div 
                className="miles-half flex items-center justify-center cursor-pointer" 
                style={{backgroundColor: '#A8B898'}}
                onClick={() => handleHalfClick('miles')}
              >
                <div className="w-8 h-8 mr-6" style={{color: '#5A6B4A'}}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-full h-full"
                  >
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </div>
                <span className="font-medium text-2xl" style={{color: '#5A6B4A'}}>Miles</span>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          /* Square hover effects */
          .contact-container .maya-half,
          .contact-container .miles-half {
            height: 50%;
            transition: height 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .contact-container:hover .maya-half:hover {
            height: 65%;
          }
          
          .contact-container:hover .maya-half:hover + .miles-half {
            height: 35%;
          }
          
          .contact-container:hover .miles-half:hover {
            height: 65%;
          }
          
          .contact-container .maya-half:hover + .miles-half {
            height: 35%;
          }

          /* Sphere container and animations */
          .sphere-container {
            position: relative;
            width: 384px;
            height: 384px;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: morphToSphere 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }

          @keyframes morphToSphere {
            0% {
              border-radius: 8px;
              transform: scale(1) rotate(0deg);
            }
            50% {
              border-radius: 50%;
              transform: scale(0.8) rotate(180deg);
            }
            100% {
              border-radius: 50%;
              transform: scale(1) rotate(360deg);
            }
          }

          /* Main sphere - reacts to user audio */
          .main-sphere {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            position: absolute;
            z-index: 4;
            animation: sphereEntry 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          }

          @keyframes sphereEntry {
            0% {
              width: 384px;
              height: 384px;
              border-radius: 8px;
              opacity: 1;
            }
            100% {
              width: 200px;
              height: 200px;
              border-radius: 50%;
              opacity: 1;
            }
          }

          /* Background sphere - starts same size as main sphere */
          .background-sphere {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            position: absolute;
            z-index: 3;
            animation: backgroundSphereEntry 1.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s both;
          }

          @keyframes backgroundSphereEntry {
            0% {
              width: 0px;
              height: 0px;
            }
            100% {
              width: 200px;
              height: 200px;
            }
          }

          /* AI heartbeat animation - scales on top of the base 1.3 scale */
          .background-sphere.ai-heartbeat {
            animation: backgroundSphereEntry 1.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s both,
                       aiHeartbeat 1.2s ease-out infinite;
          }

          @keyframes aiHeartbeat {
            0%, 100% {
              transform: scale(1.3);
            }
            15% {
              transform: scale(1.43);
            }
            30% {
              transform: scale(1.3);
            }
            45% {
              transform: scale(1.48);
            }
            60% {
              transform: scale(1.3);
            }
          }

          /* AI speaking ring animation */
          .ai-speaking-ring {
            position: absolute;
            border: 1px solid;
            border-radius: 50%;
            width: 200px;
            height: 200px;
            z-index: 2;
            animation: aiSpeakingRing 2s ease-out infinite;
          }

          @keyframes aiSpeakingRing {
            0% {
              width: 200px;
              height: 200px;
              opacity: 0.8;
              transform: scale(1);
            }
            100% {
              width: 400px;
              height: 400px;
              opacity: 0;
              transform: scale(2);
            }
          }

          /* Text fade out animation - only when transitioning to sphere */
          .contact-container.transitioning-to-sphere span,
          .contact-container.transitioning-to-sphere svg {
            animation: fadeOut 0.6s ease-out forwards;
          }

          @keyframes fadeOut {
            0% {
              opacity: 1;
              transform: scale(1);
            }
            100% {
              opacity: 0;
              transform: scale(0.8);
            }
          }


        `}</style>
      </main>

      {/* Footer with terms and privacy policy */}
      <footer className="text-center py-6 px-6">
        <p className="text-gray-500 text-sm">
          By using our services, you agree to Sesame&apos;s{' '}
          <a 
            href="/terms" 
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Terms of Use
          </a>
          {' '}and{' '}
          <a 
            href="/privacy" 
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Privacy Policy
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
