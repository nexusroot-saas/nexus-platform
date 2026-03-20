import React, { useState } from 'react';
import MonacoEditor from './MonacoEditor';
import PdfPreview from './PdfPreview';
import { documentTemplatesApi } from '../../services/api';

const TemplateEditor = ({ template, onSave }) => {
  const [contentHtml, setContentHtml] = useState(template.contentHtml);
  const [previewBase64, setPreviewBase64] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const { data } = await documentTemplatesApi.preview(
        template.doctype,
        contentHtml
      );
      setPreviewBase64(data.pdfbase64);
    } catch (error) {
      alert('Erro na pré-visualização');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await documentTemplatesApi.save(template.doctype, contentHtml);
      onSave();
      alert('Template salvo com sucesso!');
    } catch (error) {
      alert('Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="template-editor">
      <div className="editor-header">
        <h3>{template.doctype.replace('_', ' ').toUpperCase()}</h3>
        <div className="actions">
          <button onClick={handlePreview} disabled={previewing}>
            {previewing ? 'Gerando...' : 'Preview PDF'}
          </button>
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Template'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <MonacoEditor
          value={contentHtml}
          onChange={setContentHtml}
          doctype={template.doctype}
        />

        {previewBase64 && <PdfPreview base64={previewBase64} />}
      </div>
    </div>
  );
};

export default TemplateEditor;
