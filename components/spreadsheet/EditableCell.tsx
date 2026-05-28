'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { fmtRupiah, parseNumber } from '@/lib/utils/formatters';

interface EditableCellProps {
  value: number;
  onSave: (newValue: number) => void;
  formatter?: (val: number) => string;
  editable?: boolean;
}

export default function EditableCell({ 
  value, 
  onSave, 
  formatter = fmtRupiah,
  editable = true 
}: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    if (!editable) return;
    setEditValue(String(value));
    setEditing(true);
  };

  const commitEdit = () => {
    const parsed = parseNumber(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onSave(parsed);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  if (editing) {
    return (
      <div className="sheet-cell sheet-cell-editing">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent outline-none text-text-primary font-mono text-sm"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        />
      </div>
    );
  }

  return (
    <div
      className={`sheet-cell ${editable ? 'sheet-cell-editable' : ''} text-right`}
      onClick={startEdit}
      title={editable ? 'Klik untuk edit' : undefined}
    >
      {formatter(value)}
    </div>
  );
}
