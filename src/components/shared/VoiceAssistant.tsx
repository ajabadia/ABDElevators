"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Search, X, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface VoiceAssistantProps {
  onQuery: (query: string) => void;
  className?: string;
}

export function VoiceAssistant({ onQuery, className }: VoiceAssistantProps) {
  const t = useTranslations("technician.voice");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "speechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "es-ES"; // Default to Spanish, could be dynamic

      rec.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast.error(t("error_recognition"));
      };

      setRecognition(rec);
    }
  }, [t]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognition?.stop();
      if (transcript.trim()) {
        handleSubmit();
      }
    } else {
      setTranscript("");
      recognition?.start();
      setIsListening(true);
      toast.info(t("listening"), { icon: <Volume2 className="w-4 h-4" /> });
    }
  }, [isListening, recognition, transcript, t]);

  const handleSubmit = () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    onQuery(transcript);
    
    // Simulate RAG delay
    setTimeout(() => {
      setIsProcessing(false);
      setTranscript("");
    }, 1500);
  };

  if (!recognition) return null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="relative group">
        <div className={cn(
          "absolute inset-0 bg-indigo-500 rounded-full blur-xl transition-opacity duration-500",
          isListening ? "opacity-20 animate-pulse" : "opacity-0"
        )} />
        
        <button
          onClick={toggleListening}
          className={cn(
            "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
            isListening 
              ? "bg-red-500 text-white scale-110 shadow-red-500/20" 
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
          )}
        >
          {isListening ? (
            <MicOff className="w-10 h-10 animate-bounce" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </button>
      </div>

      {transcript && (
        <div className="max-w-xs mx-auto text-center transform transition-all animate-in fade-in slide-in-from-bottom-2">
          <p className="text-slate-600 dark:text-slate-300 font-medium italic">
            "{transcript}"
          </p>
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 mt-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("analyzing")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
