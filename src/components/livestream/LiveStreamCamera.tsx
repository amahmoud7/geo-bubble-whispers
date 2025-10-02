import React, { useEffect, useRef, useState } from "react";
import {
  Camera as CameraIcon,
  Eye,
  Loader2,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Square,
  Users,
  Video,
  VideoOff,
  X,
  Zap,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface LiveStreamCameraProps {
  onStreamStart?: (streamData: MediaStream, options: { title: string }) => void | Promise<unknown>;
  onStreamEnd?: () => void | Promise<unknown>;
  onClose?: () => void;
  isStreaming: boolean;
  viewerCount?: number;
  streamTitle?: string;
  onTitleChange?: (title: string) => void;
}

type CameraStatus = "initializing" | "ready" | "error";

const LiveStreamCamera: React.FC<LiveStreamCameraProps> = ({
  onStreamStart,
  onStreamEnd,
  onClose,
  isStreaming,
  viewerCount = 0,
  streamTitle = "",
  onTitleChange,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("initializing");
  const [errorMessage, setErrorMessage] = useState("");
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(undefined);
  const [streamDuration, setStreamDuration] = useState(0);
  const [title, setTitle] = useState(streamTitle);
  const [isStartPending, setIsStartPending] = useState(false);
  const [isStopPending, setIsStopPending] = useState(false);

  useEffect(() => {
    setTitle(streamTitle);
  }, [streamTitle]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isStreaming) {
      interval = setInterval(() => setStreamDuration((prev) => prev + 1), 1000);
    } else {
      setStreamDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStreaming]);

  useEffect(() => {
    const initialise = async () => {
      try {
        await startCamera(activeDeviceId);
        await loadVideoDevices();
        setStatus("ready");
      } catch (error: unknown) {
        console.error('❌ Camera initialization failed:', error);
        setStatus("error");

        // Enhanced error messages
        let errorMsg = "We couldn't access your camera or microphone.";

        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMsg = "Camera permission denied. Go to Settings > Safari > Camera and enable access for this site.";
          } else if (error.name === 'NotFoundError') {
            errorMsg = "No camera found. Make sure your device has a working camera.";
          } else if (error.name === 'NotReadableError') {
            errorMsg = "Camera is already in use. Close other apps using the camera and try again.";
          } else if (error.name === 'OverconstrainedError') {
            errorMsg = "Camera settings not supported. Your camera doesn't support the requested quality.";
          } else if (error.name === 'SecurityError') {
            errorMsg = "Security error. Camera access requires HTTPS connection.";
          } else {
            errorMsg = error.message;
          }
        }

        setErrorMessage(errorMsg);
      }
    };

    initialise();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDeviceId]);

  const loadVideoDevices = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableDevices(devices.filter((device) => device.kind === "videoinput"));
    } catch (error) {
      console.error("Error loading devices", error);
    }
  };

  const startCamera = async (deviceId?: string) => {
    stopCamera();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera access is not supported in this environment.");
    }

    if (typeof window !== "undefined" && window.isSecureContext === false) {
      throw new Error("Camera access requires a secure (HTTPS) context.");
    }

    // Detect iOS for platform-specific handling
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    console.log('📱 Platform - iOS:', isIOS);

    // iOS-optimized constraints
    const constraints: MediaStreamConstraints = {
      video: {
        ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" }),
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        aspectRatio: 16/9
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
    };

    console.log('🎥 Requesting camera with constraints:', constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('✅ Camera stream obtained:', stream.getTracks().length, 'tracks');

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;

      // iOS-specific attributes for reliable playback
      if (isIOS) {
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
      }

      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;

      videoRef.current.onloadedmetadata = async () => {
        try {
          await videoRef.current?.play();
          console.log('✅ Video playback started successfully');
        } catch (playError) {
          console.error('⚠️ Autoplay failed, trying iOS fallback:', playError);
          // iOS autoplay fallback
          if (isIOS && videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.load();
            try {
              await videoRef.current.play();
              console.log('✅ Video playback started with iOS fallback');
            } catch (retryError) {
              setStatus("error");
              setErrorMessage("Unable to start the preview automatically. Tap retry.");
            }
          } else {
            setStatus("error");
            setErrorMessage("Unable to start the preview automatically. Tap retry.");
          }
        }
      };
    }

    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const retryCamera = () => {
    setStatus("initializing");
    setErrorMessage("");
    startCamera(activeDeviceId)
      .then(() => setStatus("ready"))
      .catch((error) => {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to access camera"
        );
      });
  };

  const toggleVideo = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  };

  const toggleAudio = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
    }
  };

  const cycleCamera = () => {
    if (!availableDevices.length) return;
    const currentIndex = availableDevices.findIndex((device) => device.deviceId === activeDeviceId);
    const nextDevice = availableDevices[(currentIndex + 1) % availableDevices.length];
    setActiveDeviceId(nextDevice.deviceId);
  };

  const startStream = async () => {
    if (isStartPending || isStopPending) {
      return;
    }

    if (!streamRef.current) {
      toast({ title: "Camera not ready", description: "Retry camera access.", variant: "destructive" });
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast({ title: "Title required", description: "Add a title before going live." });
      return;
    }

    try {
      setIsStartPending(true);
      const result = onStreamStart?.(streamRef.current, { title: trimmedTitle });
      if (result && typeof (result as Promise<unknown>).then === "function") {
        await result;
      }

      toast({ title: "You're live!", description: "Broadcasting to everyone nearby." });
      onTitleChange?.(trimmedTitle);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Retry once permissions are granted.";
      toast({ title: "Stream failed", description: message, variant: "destructive" });
    } finally {
      setIsStartPending(false);
    }
  };

  const stopStream = async () => {
    if (isStartPending || isStopPending) {
      return;
    }

    try {
      setIsStopPending(true);
      const result = onStreamEnd?.();
      if (result && typeof (result as Promise<unknown>).then === "function") {
        await result;
      }

      toast({ title: "Stream ended", description: "Your broadcast has concluded." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try ending the stream again.";
      toast({ title: "Unable to end stream", description: message, variant: "destructive" });
    } finally {
      setIsStopPending(false);
    }
  };

  const isActionPending = isStartPending || isStopPending;

  const renderStatusOverlay = () => {
    if (status === "initializing") {
      return (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl bg-slate-100 text-sm text-slate-500">
          <div className="animate-spin rounded-full border-b-2 border-slate-400 p-6" />
          Preparing camera…
        </div>
      );
    }

    if (status === "error") {
      return (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center text-sm text-slate-500">
          <CameraIcon className="h-8 w-8 text-slate-400" />
          <p>{errorMessage}</p>
          <Button size="sm" onClick={retryCamera}>
            Try again
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      <div className="relative aspect-video">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline autoPlay />
        {renderStatusOverlay()}

        {isStreaming && (
          <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                <span className="mr-1 inline-flex h-2 w-2 animate-pulse rounded-full bg-white" />
                LIVE
              </div>
              <span className="rounded bg-black/50 px-2 py-1 text-xs text-white">
                {new Date(streamDuration * 1000).toISOString().substring(14, 19)}
              </span>
            </div>
            <div className="flex items-center rounded bg-black/50 px-2 py-1 text-xs text-white">
              <Eye className="mr-1 h-3 w-3" />
              {viewerCount}
            </div>
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="border-b border-slate-200 px-4 py-3">
        <input
          type="text"
          value={title}
          onChange={(event) => {
            const value = event.target.value;
            setTitle(value);
            onTitleChange?.(value);
          }}
          placeholder="Give your stream a title"
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          maxLength={100}
          disabled={isStreaming || isActionPending}
        />
        <p className="mt-1 text-right text-[11px] text-slate-400">{title.length}/100</p>
      </div>

      <div className="space-y-4 bg-slate-50 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={!isVideoEnabled ? "bg-red-500 text-white hover:bg-red-600" : ""}
              onClick={toggleVideo}
              disabled={status !== "ready" || isStreaming || isActionPending}
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className={!isAudioEnabled ? "bg-red-500 text-white hover:bg-red-600" : ""}
              onClick={toggleAudio}
              disabled={status !== "ready" || isStreaming || isActionPending}
            >
              {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            {availableDevices.length > 1 ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                onClick={cycleCamera}
                disabled={status !== "ready" || isStreaming || isActionPending}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Users className="h-4 w-4" />
            Followers notified automatically
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={isStreaming ? stopStream : startStream}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-white transition ${
                isStreaming ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
              } ${(status !== "ready" && !isStreaming) || isActionPending ? "opacity-60" : ""}`}
              disabled={(status !== "ready" && !isStreaming) || isActionPending}
            >
              {isActionPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isStreaming ? (
                <Square className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {isStreaming ? 'Streaming live' : 'Ready to stream'}
              </p>
              <p className="text-xs text-slate-400">
                {isStreaming ? 'Tap stop when you are done' : 'Preview will stay private until you go live'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-slate-500">Optimized for low-latency</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamCamera;
