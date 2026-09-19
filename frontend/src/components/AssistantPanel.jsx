import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, Languages, Mic, MicOff, MessageCircle, Send, ShieldCheck, X } from 'lucide-react';
import inventoryApi from '../api/apiClient';

const LANGUAGE_OPTIONS = [
  { value: 'en-IN', label: 'English' },
  { value: 'te-IN', label: 'తెలుగు' },
  { value: 'mixed', label: 'English + తెలుగు' },
];

export default function AssistantPanel({ language, onLanguageChange, onConfirmCommand, disabled }) {
  const [commandText, setCommandText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [pendingCommand, setPendingCommand] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [lastProductName, setLastProductName] = useState('');
  const [busy, setBusy] = useState(false);
  const [listeningMode, setListeningMode] = useState(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const getRecognition = (mode) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Speech recognition is not available in this browser. You can still type commands and questions.');
      return null;
    }

    const recognition = new Recognition();
    recognition.lang = language === 'mixed' ? 'te-IN' : language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setListeningMode(mode);
      setError('');
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (mode === 'command') {
        setCommandText(transcript);
        interpretCommand(transcript);
      } else {
        setQuestionText(transcript);
        askQuestion(transcript);
      }
    };
    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone permission was denied. Allow microphone access or type your request.',
        'audio-capture': 'No microphone was found. Check your microphone or type your request.',
        'no-speech': 'No speech was detected. Please try again.',
        network: 'Speech recognition network access failed. You can type the request instead.',
      };
      setError(messages[event.error] || 'Speech recognition failed. Please try again or type your request.');
      setListeningMode(null);
    };
    recognition.onend = () => setListeningMode(null);
    return recognition;
  };

  const startListening = (mode) => {
    if (listeningMode) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = getRecognition(mode);
    if (!recognition) return;
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError('Microphone could not start. Please try again or type your request.');
    }
  };

  const interpretCommand = async (transcript = commandText) => {
    if (!transcript.trim()) {
      setError('Enter or say a command such as “Add 15 packets of salt.”');
      return;
    }
    try {
      setBusy(true);
      setError('');
      setPendingCommand(null);
      const result = await inventoryApi.interpretVoiceCommand({ transcript, language });
      if (!result.valid) {
        setError(result.message || 'That stock command could not be understood.');
      } else {
        setPendingCommand(result);
      }
    } catch (err) {
      setError(err.message || 'Could not interpret the stock command.');
    } finally {
      setBusy(false);
    }
  };

  const askQuestion = async (question = questionText) => {
    if (!question.trim()) {
      setError('Enter or say a question about your inventory.');
      return;
    }
    try {
      setBusy(true);
      setError('');
      const result = await inventoryApi.askAssistant({
        question,
        language,
        contextProductName: lastProductName || undefined,
      });
      setAnswer(result);
      if (result.products?.length === 1) {
        setLastProductName(result.products[0].name);
      }
    } catch (err) {
      setError(err.message || 'Could not answer from the inventory database.');
    } finally {
      setBusy(false);
    }
  };

  const confirmCommand = async () => {
    if (!pendingCommand) return;
    try {
      setBusy(true);
      await onConfirmCommand(pendingCommand);
      setPendingCommand(null);
      setCommandText('');
    } catch {
      // The parent displays the API error and keeps the command available to retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="assistant-panel card" aria-label="Inventory assistant">
      <div className="assistant-panel-header">
        <div>
          <div className="assistant-title"><MessageCircle size={19} /> Inventory Assistant</div>
          <p className="assistant-subtitle">Ask about real stock or prepare a stock change for confirmation.</p>
        </div>
        <label className="language-picker">
          <Languages size={16} />
          <span className="sr-only">Assistant language</span>
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div className="assistant-grid">
        <div className="assistant-section">
          <div className="assistant-section-label"><ShieldCheck size={15} /> Confirmed stock commands</div>
          <div className="assistant-input-row">
            <input
              className="form-control"
              value={commandText}
              onChange={(event) => setCommandText(event.target.value)}
              placeholder="Add 15 packets of salt"
              disabled={disabled || busy}
            />
            <button className={`btn-icon ${listeningMode === 'command' ? 'listening' : ''}`} onClick={() => startListening('command')} title="Speak stock command" disabled={disabled || busy}>
              {listeningMode === 'command' ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => interpretCommand()} disabled={disabled || busy}>
              <Send size={14} /> Interpret
            </button>
          </div>
          {pendingCommand && (
            <div className="assistant-confirmation">
              <div>
                <strong>Ready to confirm</strong>
                <span>{pendingCommand.message}</span>
                <small>Nothing has changed in stock yet.</small>
              </div>
              <div className="assistant-confirm-actions">
                <button className="btn btn-success btn-sm" onClick={confirmCommand} disabled={busy}>Confirm change</button>
                <button className="btn btn-outline btn-sm" onClick={() => setPendingCommand(null)} disabled={busy}><X size={14} /> Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="assistant-section">
          <div className="assistant-section-label"><HelpCircle size={15} /> Ask your inventory</div>
          <div className="assistant-input-row">
            <input
              className="form-control"
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
              placeholder="How much rice is available?"
              disabled={busy}
            />
            <button className={`btn-icon ${listeningMode === 'question' ? 'listening' : ''}`} onClick={() => startListening('question')} title="Speak inventory question" disabled={busy}>
              {listeningMode === 'question' ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => askQuestion()} disabled={busy}>
              <Send size={14} /> Ask
            </button>
          </div>
          {answer && (
            <div className="assistant-answer">
              <strong>{answer.answer}</strong>
              {answer.reorderRecommendations?.length > 0 && (
                <span className="assistant-answer-note">Recommendation based on each product’s configured low-stock threshold.</span>
              )}
            </div>
          )}
        </div>
      </div>

      {error && <div className="assistant-error">{error}</div>}
    </section>
  );
}
