import React, { useEffect, useRef, useState } from 'react';
import { Languages, Mic, MicOff, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import inventoryApi from '../api/apiClient';

const LANGUAGE_OPTIONS = [
  { value: 'en-IN', label: 'English' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'mixed', label: 'Mixed' },
];

const EXAMPLES = ['Add 10 rice bags', 'How much rice is left?', 'Which items are low?', 'What should I reorder?'];

function looksLikeQuestion(text) {
  return /\?|\b(how|what|which|where|show|tell|is|are|do|can|give|list|stock activity|inventory|left|low|reorder|report)\b/i.test(text);
}

export default function AssistantPanel({ language, onLanguageChange, onConfirmCommand, disabled }) {
  const [text, setText] = useState('');
  const [response, setResponse] = useState(null);
  const [lastProductName, setLastProductName] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const askBackend = async (requestText = text) => {
    const trimmed = requestText.trim();
    if (!trimmed) {
      setError('Say or type something for VyapaarAI to handle.');
      return;
    }
    try {
      setBusy(true);
      setError('');
      setResponse(null);
      const interpreted = await inventoryApi.interpretVoiceCommand({ transcript: trimmed, language });
      if (interpreted.valid) {
        setResponse({ type: 'mutation', data: interpreted });
        return;
      }
      const isClarification = !looksLikeQuestion(trimmed) && (
        interpreted.intent?.startsWith('STOCK_')
        || interpreted.intent?.startsWith('PRODUCT_')
        || Boolean(interpreted.clarification)
      );
      if (isClarification) {
        setResponse({ type: 'clarification', message: interpreted.message || interpreted.clarification });
        return;
      }
      const answer = await inventoryApi.askAssistant({
        question: trimmed,
        language,
        contextProductName: lastProductName || undefined,
      });
      setResponse({ type: 'answer', data: answer });
      if (answer.products?.length === 1) setLastProductName(answer.products[0].name);
    } catch (requestError) {
      setError(requestError.message || 'VyapaarAI could not complete that request. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const startListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Speech recognition is not available in this browser. Type your request instead.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = language === 'mixed' ? 'te-IN' : language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { setListening(true); setError(''); };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      setText(transcript);
      askBackend(transcript);
    };
    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Microphone permission was denied. Allow access or type your request.',
        'audio-capture': 'No microphone was found. Check your microphone or type your request.',
        'no-speech': 'No speech was detected. Please try again.',
        network: 'Speech recognition network access failed. You can type the request instead.',
      };
      setError(messages[event.error] || 'Speech recognition failed. Please try again.');
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError('Microphone could not start. Please try again or type your request.');
    }
  };

  const confirmMutation = async () => {
    if (!response?.data) return;
    try {
      setBusy(true);
      await onConfirmCommand(response.data);
      setResponse(null);
      setText('');
    } catch {
      // Parent-owned API feedback keeps the proposal available to retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="assistant-panel card" aria-label="VyapaarAI voice assistant">
      <div className="assistant-panel-header">
        <div className="assistant-title"><Sparkles size={18} /> VyapaarAI Voice Assistant</div>
        <label className="language-picker">
          <Languages size={15} />
          <span className="sr-only">Assistant language</span>
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)}>
            {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      <div className="voice-stage">
        <div className="voice-stage-copy">
          <span className="voice-eyebrow"><MessageCircle size={14} /> One assistant for everything</span>
          <h2>Speak to VyapaarAI</h2>
          <p>{listening ? 'Listening...' : 'Click to speak or say something...'}</p>
        </div>
        <div className="voice-orbit" aria-hidden="true"><span /><span /><span /></div>
        <button className={`voice-mic ${listening ? 'is-listening' : ''}`} onClick={startListening} title={listening ? 'Stop listening' : 'Speak to VyapaarAI'} disabled={disabled || busy}>
          {listening ? <MicOff size={36} /> : <Mic size={36} />}
        </button>
        <div className="voice-waveform" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        <div className="voice-stage-meta"><span>Natural</span><b>•</b><span>Fast</span><b>•</b><span>Accurate</span></div>
        <div className="voice-examples">
          {EXAMPLES.map((example) => <button key={example} onClick={() => { setText(example); askBackend(example); }} disabled={disabled || busy}>{example}</button>)}
        </div>
      </div>

      <div className="unified-request-row">
        <input className="form-control" value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && askBackend()} placeholder="Type anything: add stock, ask a question, or request a report..." disabled={disabled || busy} />
        <button className="btn btn-primary unified-send" onClick={() => askBackend()} disabled={disabled || busy}><Send size={15} /> Send</button>
      </div>

      {response && (
        <div className={`unified-response-card ${response.type}`}>
          {response.type === 'mutation' && (
            <>
              <div className="response-heading"><strong>Ready for your confirmation</strong><span>Nothing has changed yet.</span></div>
              <div className="mutation-summary"><b>{response.data.action === 'ADD' ? 'Stock in' : response.data.action === 'REMOVE' ? 'Stock out' : response.data.action}</b><span>{response.data.productName}</span><span>{response.data.quantity} {response.data.unit}</span></div>
              <div className="response-actions"><button className="btn btn-primary btn-sm" onClick={confirmMutation} disabled={busy}>Confirm</button><button className="btn btn-outline btn-sm" onClick={() => setResponse(null)} disabled={busy}><X size={14} /> Cancel</button></div>
            </>
          )}
          {response.type === 'answer' && <><div className="response-heading"><strong>VyapaarAI says</strong><span>Live from your inventory</span></div><p className="response-answer">{response.data.answer}</p></>}
          {response.type === 'clarification' && <><div className="response-heading"><strong>One more detail</strong></div><p className="response-answer">{response.message}</p></>}
        </div>
      )}
      {error && <div className="assistant-error">{error}</div>}
    </section>
  );
}
