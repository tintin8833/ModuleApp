import React, { useState, useEffect } from 'react'
import styles from '../styles/ApprovalCommentBox.module.sass'

const ApprovalCommentBox = ({ show = false, onClose, onSubmit, courseOutcomes = [], ilos = [] }) => {
  const storageKey = 'approval_comments_v1'

  const defaultComment = () => ({
    id: Date.now(),
    components: { references: false, topics: false, assessments: false, tlas: false, grading: false },
    text: '',
    comment: '',
    createdAt: new Date().toISOString(),
    reviewer: '',
    role: '',
    coverageType: '',
    courseOutcome: '',
    ilo: ''
  })

  const [comments, setComments] = useState([defaultComment()])

  // Fallback course outcomes and ILOs
  const resolvedCourseOutcomes = (courseOutcomes && courseOutcomes.length)
    ? courseOutcomes
    : [
        { id: 'CO1', description: 'Apply core concepts, theories, and principles of the course.' },
        { id: 'CO2', description: 'Demonstrate user-centered design and evaluation methods.' },
        { id: 'CO3', description: 'Construct prototypes and apply accessibility best practices.' },
        { id: 'CO4', description: 'Justify design decisions using evidence and testing results.' }
      ]

  const coToIlos = {
    CO1: ['ILO1', 'ILO2', 'ILO3'],
    CO2: ['ILO1', 'ILO2', 'ILO3'],
    CO3: ['ILO1', 'ILO2', 'ILO3'],
    CO4: ['ILO1', 'ILO2', 'ILO3', 'ILO4']
  }

  const resolvedIlosAll = Array.from(new Set([].concat(...Object.values(coToIlos))))
  const resolvedIlos = (ilos && ilos.length) ? ilos : resolvedIlosAll

  // Get current approver identity from localStorage
  const getApproverIdentity = () => {
    try {
      const name = localStorage.getItem('approver_name') || 'Unnamed Reviewer'
      const role = localStorage.getItem('approver_role') || 'Role'
      return { name, role }
    } catch (e) {
      return { name: 'Unnamed Reviewer', role: 'Role' }
    }
  }

  // Load persisted comments and normalize reviewer/role
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return

      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.length === 0) return

      const approver = getApproverIdentity()

      const normalized = parsed.map(c => {
        const reviewer = c.reviewer || approver.name || ''
        const role = c.role || approver.role || ''

        return {
          ...defaultComment(),
          ...c,
          comment: c.comment || c.text || '',
          createdAt: c.createdAt || new Date().toISOString(),
          reviewer: reviewer,
          role: role
        }
      })

      setComments(normalized)
    } catch (e) {
      // ignore parse errors
    }
  }, [])

  // Persist comments whenever they change
  useEffect(() => {
    try {
      const normalized = comments.map(c => ({
        ...c,
        comment: c.comment || c.text || '',
        createdAt: c.createdAt || new Date().toISOString(),
        reviewer: c.reviewer || getApproverIdentity().name,
        role: c.role || getApproverIdentity().role
      }))
      localStorage.setItem(storageKey, JSON.stringify(normalized))
    } catch (e) {
      // ignore
    }
  }, [comments])

  const toggleCommentComponent = (commentId, key) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, components: { ...c.components, [key]: !c.components[key] } } : c))
    )
  }

  const updateCommentText = (commentId, text) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, text, comment: text } : c)))
  }

  const updateCommentCourseOutcome = (commentId, courseOutcome) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c
        const allowedIlos = coToIlos[courseOutcome] || resolvedIlos
        const nextIlo = allowedIlos.includes(c.ilo) ? c.ilo : ''
        return { ...c, courseOutcome, ilo: nextIlo }
      })
    )
  }

  const updateCommentCoverageType = (commentId, coverageType) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, coverageType } : c)))
  }

  const updateCommentIlo = (commentId, ilo) => {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, ilo } : c)))
  }

  const addCommentSection = () => {
    const approver = getApproverIdentity()
    setComments((prev) => [
      ...prev,
      {
        ...defaultComment(),
        id: Date.now() + Math.random(),
        reviewer: approver.name,
        role: approver.role
      }
    ])
  }

  const removeCommentSection = (commentId) => {
    setComments((prev) => (prev.length === 1 ? prev : prev.filter((c) => c.id !== commentId)))
  }

  const handleSubmit = () => {
    const filledComments = comments.filter((c) => {
      if (!c.text || !c.text.trim()) return false
      
      const comps = c.components || {}
      const courseCoverageChecked = !!(comps.topics || comps.assessments || comps.tlas)
      
      // If course coverage is checked, must have either (courseOutcome + ilo) OR coverageType
      if (courseCoverageChecked) {
        const hasValidCourseData = c.courseOutcome ? !!c.ilo : !!c.coverageType
        if (!hasValidCourseData) return false
      }
      
      return true
    })
    
    if (filledComments.length === 0) return
    
    const payload = {
      courseOutcome: filledComments.find((c) => c.courseOutcome)?.courseOutcome || null,
      ilo: filledComments.find((c) => c.ilo)?.ilo || null,
      courseCoverage: filledComments.some((c) => c.components.topics || c.components.assessments || c.components.tlas),
      comments: filledComments,
      createdAt: new Date().toISOString()
    }
    onSubmit && onSubmit(payload)
  }

  if (!show) return null

  const filledCommentsForSave = comments.filter((c) => {
    if (!c.text || !c.text.trim()) return false
    
    const comps = c.components || {}
    const courseCoverageChecked = !!(comps.topics || comps.assessments || comps.tlas)
    
    // If course coverage is checked, must have either (courseOutcome + ilo) OR coverageType
    if (courseCoverageChecked) {
      const hasValidCourseData = c.courseOutcome ? !!c.ilo : !!c.coverageType
      if (!hasValidCourseData) return false
    }
    
    return true
  })

  const allFilledValid = filledCommentsForSave.length > 0

  const saveDisabled = !allFilledValid

  return (
    <div role="dialog" aria-modal="true" aria-label="Comments" className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Comments</h3>
          <button onClick={onClose} aria-label="Return Syllabus" className={styles.returnBtn}>
            Return Syllabus
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.commentListWrapper}>
            <div className={styles.commentList}>
              {comments.map((c, idx) => {
                const courseCoverageSelected = !!(c.components && c.components.topics && c.components.assessments && c.components.tlas)
                return (
                  <div key={c.id} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <div>Comment {idx + 1}</div>
                      {c.reviewer && c.role && c.reviewer !== 'Unnamed Reviewer' && c.role !== 'Role' && (
                        <div>{c.reviewer} — {c.role}</div>
                      )}
                      <div className={styles.commentControls}>
                        <button className={styles.removeBtn} onClick={() => removeCommentSection(c.id)} aria-label="Delete comment" title="Delete comment">
                          ✕
                        </button>
                      </div>
                    </div>

                    <div className={styles.commentBody}>
                      <div className={styles.componentsRow} style={{ marginBottom: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={courseCoverageSelected}
                            onChange={() =>
                              setComments((prev) =>
                                prev.map((item) =>
                                  item.id === c.id
                                    ? (() => {
                                        const allOn = !!(item.components && item.components.topics && item.components.assessments && item.components.tlas)
                                        const target = !allOn
                                        return {
                                          ...item,
                                          components: {
                                            ...item.components,
                                            topics: target,
                                            assessments: target,
                                            tlas: target
                                          }
                                        }
                                      })()
                                    : item
                                )
                              )
                            }
                          />
                          <span>Course Coverage (Topics / Assessments / T&LA)</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" checked={c.components.references} onChange={() => toggleCommentComponent(c.id, 'references')} />
                          <span>References</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="checkbox" checked={c.components.grading} onChange={() => toggleCommentComponent(c.id, 'grading')} />
                          <span>Grading Criteria</span>
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 8 }}>
                        <div className={styles.field}>
                          <label className={styles.label}>Coverage Type</label>
                          <select className={styles.select} value={c.coverageType} onChange={(e) => updateCommentCoverageType(c.id, e.target.value)} disabled={!courseCoverageSelected}>
                            <option value="">-- select type --</option>
                            <option value="Topic">Topic</option>
                            <option value="Assessment">Assessment</option>
                            <option value="TLA">TLA</option>
                          </select>
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Course Outcome</label>
                          <select className={styles.select} value={c.courseOutcome} onChange={(e) => updateCommentCourseOutcome(c.id, e.target.value)} disabled={!courseCoverageSelected}>
                            <option value="">-- select course outcome --</option>
                            {resolvedCourseOutcomes.map((co) => (
                              <option key={co.id || co} value={co.id || co}>
                                {co.id ? `${co.id} — ${String(co.description || '').slice(0, 60)}` : co}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className={styles.field}>
                          <label className={styles.label}>Intended Learning Outcome (ILO)</label>
                          <select className={styles.select} value={c.ilo} onChange={(e) => updateCommentIlo(c.id, e.target.value)} disabled={!courseCoverageSelected || !c.courseOutcome}>
                            <option value="">-- select ILO --</option>
                            {((c.courseOutcome && coToIlos[c.courseOutcome]) || resolvedIlos).map((i) => (
                              <option key={i} value={i}>{i}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <textarea className={styles.textarea} value={c.text} onChange={(e) => updateCommentText(c.id, e.target.value)} placeholder={'Enter your comment...'} rows={4} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className={styles.addCommentRow}>
              <button onClick={addCommentSection} className={styles.addButton}>
                + Add another comment
              </button>
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={onClose} className={`${styles.cancel}`}>Cancel</button>
            <button onClick={handleSubmit} disabled={saveDisabled} className={`${styles.submit} ${saveDisabled ? styles.disabled : ''}`}>Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApprovalCommentBox