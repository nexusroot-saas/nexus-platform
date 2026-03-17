// apps/api-server/src/routes/document-templates.routes.js
import Router from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { authorize } from '../middlewares/rbac.middleware.js'
import { listTemplates, getActiveTemplate } from '../services/document-templates.service.js'

const router = Router()

// TENANTADMIN + MEDICO podem listar templates
router.get('/', authenticate, authorize('documenttemplates', 'read'), async (req, res) => {
  try {
    const data = await listTemplates(req.user.companyid)
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao listar templates' })
  }
})

// MEDICO pode buscar template específico (ex: receita)
router.get('/:doctype', authenticate, authorize('documenttemplates', 'read'), async (req, res) => {
  try {
    const tmpl = await getActiveTemplate(req.user.companyid, req.params.doctype)
    if (!tmpl) return res.status(404).json({ error: 'Template não encontrado' })
    return res.status(200).json(tmpl)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar template' })
  }
})

export default router
