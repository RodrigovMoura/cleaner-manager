"use client";

import { useState, useEffect, useRef } from "react";

interface AddressAutocompleteProps {
  defaultValue?: string;
  name?: string;
  required?: boolean;
}

interface Prediction {
  placeId: string;
  description: string;
}

export default function AddressAutocomplete({
  defaultValue = "",
  name = "address",
  required = true,
}: AddressAutocompleteProps) {
  const [address, setAddress] = useState(defaultValue);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  const sessionTokenRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializa Session Token para otimizar custos da API
  useEffect(() => {
    sessionTokenRef.current = crypto.randomUUID();
  }, []);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce para consulta à API
  useEffect(() => {
    if (isManualMode || address.trim().length < 3) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const token = sessionTokenRef.current || "";
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(address)}&sessionToken=${token}`);
        const data = await res.json();
        setPredictions(data.predictions || []);
        setIsOpen((data.predictions || []).length > 0);
      } catch (err) {
        console.error("Address search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [address, isManualMode]);

  const handleSelect = (selectedDescription: string) => {
    setAddress(selectedDescription);
    setPredictions([]);
    setIsOpen(false);
    // Renova o token de sessão após seleção
    sessionTokenRef.current = crypto.randomUUID();
  };

  return (
    <div className='space-y-1.5' ref={containerRef}>
      <div className='flex items-center justify-between'>
        <label htmlFor={name} className='block text-xs font-medium text-gray-700'>
          Property Address {required && <span className='text-red-500'>*</span>}
        </label>
        <button
          type='button'
          onClick={() => {
            setIsManualMode(!isManualMode);
            setPredictions([]);
            setIsOpen(false);
          }}
          className='text-xs text-blue-600 hover:text-blue-700 font-medium'>
          {isManualMode ? "Use auto-search" : "Enter manually"}
        </button>
      </div>

      <div className='relative'>
        <input
          id={name}
          name={name}
          type='text'
          required={required}
          value={address}
          onChange={(e) => {
            const value = e.target.value;
            setAddress(value);
            if (value.trim().length < 3) {
              setPredictions([]);
              setIsOpen(false);
            }
          }}
          placeholder={isManualMode ? "e.g., 14 Example Way, Girrawheen WA 6064" : "Start typing street address..."}
          autoComplete='off'
          className='w-full text-sm border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors'
        />

        {isLoading && !isManualMode && (
          <div className='absolute right-3 top-2.5'>
            <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
          </div>
        )}

        {/* Dropdown de Sugestões */}
        {isOpen && !isManualMode && address.trim().length >= 3 && predictions.length > 0 && (
          <div className='absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-100'>
            {predictions.map((p) => (
              <button
                key={p.placeId}
                type='button'
                onClick={() => handleSelect(p.description)}
                className='w-full text-left px-3.5 py-2.5 text-xs text-gray-800 hover:bg-blue-50 hover:text-blue-900 transition-colors flex items-start gap-2'>
                <span className='text-gray-400 mt-0.5'>📍</span>
                <span className='font-medium leading-relaxed'>{p.description}</span>
              </button>
            ))}

            {/* Opção de Fallback no rodapé do Dropdown */}
            <div className='p-2 bg-gray-50 border-t border-gray-100 text-center'>
              <button
                type='button'
                onClick={() => {
                  setIsManualMode(true);
                  setIsOpen(false);
                }}
                className='text-xs text-gray-500 hover:text-blue-600 font-medium'>
                Can&apos;t find your address? Switch to manual entry
              </button>
            </div>
          </div>
        )}
      </div>

      {isManualMode && (
        <p className='text-[11px] text-gray-500'>
          Manual mode active. You can type any new building, lot number or custom address.
        </p>
      )}
    </div>
  );
}
