"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface AddressAutocompleteProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  name?: string;
  required?: boolean;
}

interface Prediction {
  placeId: string;
  description: string;
}

// Fallback seguro de geração de UUID para ambientes sem suporte a crypto.randomUUID (ex: conexões HTTP locais no mobile)
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function AddressAutocomplete({
  value: controlledValue,
  defaultValue = "",
  onChange: onAddressChange,
  onBlur: onAddressBlur,
  hasError = false,
  name = "address",
  required = true,
}: AddressAutocompleteProps) {
  const isControlled = controlledValue !== undefined;
  const initialAddress = isControlled ? controlledValue : defaultValue;

  const [internalAddress, setInternalAddress] = useState(initialAddress);
  const currentAddress = isControlled ? controlledValue : internalAddress;

  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const sessionTokenRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializa Session Token para agrupar consultas da sessão
  useEffect(() => {
    sessionTokenRef.current = generateUUID();
  }, []);

  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  if (prevDefaultValue !== defaultValue && !isControlled) {
    setPrevDefaultValue(defaultValue);
    setInternalAddress(defaultValue);
  }

  // Fecha o dropdown ao clicar fora do componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Limpa o timer de debounce ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Função central de busca na API
  const fetchPredictions = async (query: string) => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || isManualMode) {
      setPredictions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = sessionTokenRef.current || generateUUID();
      const res = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(trimmed)}&sessionToken=${encodeURIComponent(token)}`
      );

      if (!res.ok) {
        setPredictions([]);
        setIsOpen(false);
        return;
      }

      const data = await res.json();
      const results: Prediction[] = data.predictions || [];
      setPredictions(results);
      setHasSearched(true);
      setIsOpen(true);
      setHighlightedIndex(-1);
    } catch (err) {
      console.error("Address autocomplete error:", err);
      setPredictions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Dispara busca com debounce a cada alteração de texto do usuário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isControlled) {
      setInternalAddress(val);
    }
    if (onAddressChange) {
      onAddressChange(val);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 2 || isManualMode) {
      setPredictions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      fetchPredictions(val);
    }, 250);
  };

  // Seleciona um endereço da lista
  const handleSelect = useCallback(
    (selectedDescription: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (!isControlled) {
        setInternalAddress(selectedDescription);
      }
      if (onAddressChange) {
        onAddressChange(selectedDescription);
      }

      setPredictions([]);
      setIsOpen(false);
      setIsLoading(false);
      setHasSearched(false);
      setHighlightedIndex(-1);
      sessionTokenRef.current = generateUUID();
    },
    [isControlled, onAddressChange]
  );

  // Gerencia navegação por teclado e impede submissão acidental do formulário ao pressionar Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Sempre impede o envio acidental do formulário ao teclar Enter no campo de endereço

      if (isOpen && predictions.length > 0) {
        const targetIndex = highlightedIndex >= 0 ? highlightedIndex : 0;
        if (predictions[targetIndex]) {
          handleSelect(predictions[targetIndex].description);
        }
      }
      return;
    }

    if (!isOpen || predictions.length === 0) {
      if (e.key === "ArrowDown" && predictions.length > 0) {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className='space-y-1.5 relative z-30' ref={containerRef}>
      <div className='flex items-center justify-between'>
        <label htmlFor={name} className='block text-xs font-semibold text-gray-700 uppercase tracking-wider'>
          Property Address {required && <span className='text-red-500'>*</span>}
        </label>
        <button
          type='button'
          onClick={() => {
            setIsManualMode(!isManualMode);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            setPredictions([]);
            setIsOpen(false);
            setIsLoading(false);
          }}
          className='text-xs text-blue-600 hover:text-blue-700 font-semibold hover:underline'>
          {isManualMode ? "Use auto-search" : "Enter manually"}
        </button>
      </div>

      <div className='relative'>
        <input
          id={name}
          name={name}
          type='text'
          required={required}
          value={currentAddress}
          onChange={handleInputChange}
          onBlur={onAddressBlur}
          onFocus={() => {
            if (!isManualMode && predictions.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={isManualMode ? "e.g., 14 Example Way, Girrawheen WA 6064" : "Start typing street address..."}
          autoComplete='off'
          role='combobox'
          aria-autocomplete='list'
          aria-expanded={isOpen}
          aria-controls={isOpen ? `${name}-listbox` : undefined}
          aria-invalid={hasError}
          className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
            hasError
              ? "border-red-400 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              : "border-gray-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          }`}
        />

        {/* Loading Spinner */}
        {isLoading && !isManualMode && (
          <div className='absolute right-3.5 top-3 flex items-center pointer-events-none'>
            <div className='w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
          </div>
        )}

        {/* Dropdown de Sugestões */}
        {isOpen && !isManualMode && (
          <div
            id={`${name}-listbox`}
            role='listbox'
            className='absolute z-50 left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto divide-y divide-gray-100 animate-in fade-in duration-150'>
            {predictions.length > 0 ? (
              predictions.map((p, index) => {
                const isHighlighted = highlightedIndex === index;
                return (
                  <button
                    key={p.placeId}
                    type='button'
                    role='option'
                    aria-selected={isHighlighted}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(p.description);
                    }}
                    onClick={() => handleSelect(p.description)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-4 py-3 text-xs transition-colors flex items-start gap-2.5 ${
                      isHighlighted ? "bg-blue-50 text-blue-900 font-semibold" : "text-gray-800 hover:bg-gray-50"
                    }`}>
                    <span className='text-gray-400 mt-0.5 shrink-0'>📍</span>
                    <span className='leading-relaxed'>{p.description}</span>
                  </button>
                );
              })
            ) : hasSearched && !isLoading ? (
              <div className='p-4 text-center text-xs text-gray-500'>
                <p className='font-medium text-gray-700'>No address suggestions found.</p>
                <p className='mt-1 text-[11px] text-gray-400'>
                  You can type your address freely or switch to manual entry.
                </p>
              </div>
            ) : null}

            {/* Opção de Fallback no rodapé do Dropdown */}
            <div className='p-2.5 bg-gray-50/90 border-t border-gray-100 text-center'>
              <button
                type='button'
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsManualMode(true);
                  setIsOpen(false);
                }}
                onClick={() => {
                  setIsManualMode(true);
                  setIsOpen(false);
                }}
                className='text-xs text-gray-500 hover:text-blue-600 font-semibold'>
                Can&apos;t find your address? Switch to manual entry
              </button>
            </div>
          </div>
        )}
      </div>

      {isManualMode && (
        <p className='text-[11px] text-gray-500'>
          Manual mode active. You can type any custom street address, apartment or lot number.
        </p>
      )}
    </div>
  );
}
