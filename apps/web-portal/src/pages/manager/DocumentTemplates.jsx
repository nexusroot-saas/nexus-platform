import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { documentTemplatesApi } from '../../services/api'
import TemplateList from '../../components/DocumentTemplates/TemplateList'
import TemplateEditor from '../../components/Editor/TemplateEditor'

const DocumentTemplates = () => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const { data } = await documentTemplatesApi.list()
      setTemplates(data)
      // Abre primeiro template por default
      if (data.length > 0) setActiveTemplate(data[0])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Carregando templates...</div>

  return (
    <div className="manager-document-templates">
      <header>
        <h1>Gestão de Templates</h1>
        <p>Empresa: {user.companyid}</p>
      </header>
      
      <div className="templates-grid">
        <TemplateList 
          templates={templates} 
          activeTemplate={activeTemplate}
          onSelect={setActiveTemplate}
        />
        
        {activeTemplate && (
          <TemplateEditor 
            template={activeTemplate}
            onSave={loadTemplates}
          />
        )}
      </div>
    </div>
  )
}

export default DocumentTemplates
