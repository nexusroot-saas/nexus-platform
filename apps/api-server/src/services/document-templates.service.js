// apps/api-server/src/services/document-templates.service.js
import { pool } from '../config/db.js'
import { log } from './audit.service.js'
import { renderPdf, resolveTags } from '../../../../packages/legal-core/src/index.js'

export async function listTemplates(companyId) {
  const result = await pool.query(`
    SELECT doctype, isactive, issystem, version, 
           LEFT(contenthtml, 200) as preview,
           createdat, updatedat
    FROM documenttemplates 
    WHERE companyid = $1 OR companyid IS NULL
    ORDER BY doctype
  `, [companyId])
  return result.rows
}

export async function getActiveTemplate(companyId, docType) {
  const result = await pool.query(`
    SELECT * FROM documenttemplates 
    WHERE (companyid = $1 OR companyid IS NULL) 
    AND doctype = $2 AND isactive = true
    ORDER BY companyid NULLS LAST, version DESC 
    LIMIT 1
  `, [companyId, docType])
  return result.rows[0]
}
