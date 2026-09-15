import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const VOICE_LANGUAGES = [
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ur", label: "اردو (Urdu)" },
  { code: "en", label: "English" },
  { code: "hinglish", label: "Hinglish" },
] as const;

export type VoiceInputButtonProps = {
  language?: string;
  onTranscript: (text: string, detectedLanguage?: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
};

function getSupportedMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"]
    .find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function VoiceInputButton({ language = "hi", onTranscript, onError, disabled, className }: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcribeMutation = trpc.voice.transcribe.useMutation();

  useEffect(() => () => {
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const reportError = (message: string) => onError?.(message);

  const startRecording = async () => {
    if (disabled || isRecording || isTranscribing) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      reportError("Voice input is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => reportError("The microphone stopped unexpectedly. Please try again.");
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const audioBlob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType || "audio/webm" });
        if (!audioBlob.size) {
          setIsTranscribing(false);
          reportError("No speech was captured. Tap the microphone and try again.");
          return;
        }
        if (audioBlob.size > 16 * 1024 * 1024) {
          setIsTranscribing(false);
          reportError("That recording is longer than 16 MB. Please try a shorter question.");
          return;
        }
        setIsTranscribing(true);
        try {
          const whisperBlob = await normalizeAudioBlob(audioBlob);
          if (whisperBlob.size > 16 * 1024 * 1024) {
            throw new Error("The converted recording is longer than 16 MB. Please try a shorter question.");
          }
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("Could not read recording"));
            reader.readAsDataURL(whisperBlob);
          });
          const result = await transcribeMutation.mutateAsync({ audioBase64: dataUrl, language, prompt: language === "hinglish" ? "Transcribe Hinglish in the same Roman Hindi and English mix used by the farmer." : undefined });
          onTranscript(result.text, result.language);
        } catch (error) {
          reportError(error instanceof Error ? error.message : "Voice transcription failed. Please try again.");
        } finally {
          setIsTranscribing(false);
        }
      };
      recorder.start(250);
      setIsRecording(true);
    } catch (error) {
      reportError(error instanceof DOMException && error.name === "NotAllowedError" ? "Microphone permission is needed for voice questions." : "Could not open the microphone.");
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    setIsRecording(false);
    setIsTranscribing(true);
    recorderRef.current.stop();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled || isTranscribing}
      aria-label={isRecording ? "Stop recording" : "Start voice question"}
      title={isRecording ? "Stop recording" : "Tap to speak"}
      data-recording={isRecording ? "true" : "false"}
    >
      {isTranscribing ? <Loader2 className="size-4 animate-spin" /> : isRecording ? <Square className="size-4 fill-current" /> : <Mic className="size-4" />}
    </Button>
  );
}

export default VoiceInputButton;

async function normalizeAudioBlob(blob: Blob): Promise<Blob> {
  if (blob.type.startsWith("audio/wav") || blob.type.startsWith("audio/wave")) return blob;
  const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return blob;
  const context = new AudioContextCtor();
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    return encodeWav(buffer);
  } catch {
    // Some Chromium/Safari combinations cannot decode their own MediaRecorder
    // container. Whisper accepts webm/ogg/mp4 directly, so preserve the
    // original recording instead of failing the farmer's question.
    return blob;
  } finally {
    await context.close().catch(() => undefined);
  }
}

function encodeWav(audio: AudioBuffer): Blob {
  const channelCount = Math.min(audio.numberOfChannels, 2);
  const frameCount = audio.length;
  const bytesPerSample = 2;
  const output = new ArrayBuffer(44 + frameCount * channelCount * bytesPerSample);
  const view = new DataView(output);
  const writeString = (offset: number, value: string) => { for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index)); };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + frameCount * channelCount * bytesPerSample, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * channelCount * bytesPerSample, true);
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, frameCount * channelCount * bytesPerSample, true);
  const channels = Array.from({ length: channelCount }, (_, index) => audio.getChannelData(index));
  let offset = 44;
  for (let frame = 0; frame < frameCount; frame += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel]?.[frame] ?? 0));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([output], { type: "audio/wav" });
}
