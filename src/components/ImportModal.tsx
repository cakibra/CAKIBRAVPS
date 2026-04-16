import { useRef, useState } from 'react';
import type { ImportPayload } from '../types';
import { Modal } from './ui/Modal';

interface ImportModalProps { open: boolean; onClose: () => void; onSubmit: (payload: ImportPayload) => void; }

const modeLabels: Record<ImportPayload['mode'], string> = {
  clipboard: 'Конфигурация',
  link: 'URL',
  file: 'Файл',
  manual: 'JSON'
};

export function ImportModal({ open, onClose, onSubmit }: ImportModalProps): JSX.Element {
  const [mode, setMode] = useState<ImportPayload['mode']>('clipboard');
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Modal open={open} onClose={onClose} title="Добавить конфигурацию" wide>
      <div className="form-grid">
        <label className="field field--full">
          <span>Тип</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as ImportPayload['mode'])}>
            {Object.entries(modeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>

        {(mode === 'clipboard' || mode === 'link' || mode === 'manual') && (
          <label className="field field--full">
            <span>{modeLabels[mode]}</span>
            <textarea rows={14} value={text} onChange={(event) => setText(event.target.value)} placeholder="Вставьте vless://, vmess://, base64 payload, sing-box JSON или список конфигураций по одной на строку" />
          </label>
        )}

        {mode === 'file' && (
          <div className="field field--full">
            <span>Выберите файл</span>
            <input ref={inputRef} type="file" accept=".txt,.json,.conf,.log" onChange={async (event) => {
              const file = event.target.files?.[0]; if (!file) return;
              const content = await file.text();
              onSubmit({ mode: 'file', content, fileName: file.name }); onClose();
              if (inputRef.current) inputRef.current.value = '';
            }} />
          </div>
        )}
      </div>
      {mode !== 'file' && (
        <div className="modal__footer">
          <button type="button" className="secondary-button" onClick={onClose}>Отмена</button>
          <button type="button" className="primary-button" onClick={() => { onSubmit({ mode, content: text }); setText(''); onClose(); }} disabled={!text.trim()}>Добавить</button>
        </div>
      )}
    </Modal>
  );
}
