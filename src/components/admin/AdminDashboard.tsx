/* ========== EXAM TRACKING PANEL (with Most Missed Questions) ========== */
interface MCQQuestion {
  q: string
  options: string[]
  correct: number
  points: number
}

function ExamTrackingPanel() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [results, setResults] = useState<ExamResult[]>([])
  const [notTaken, setNotTaken] = useState<any[]>([])
  const [mostMissed, setMostMissed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formGrade, setFormGrade] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formFilePath, setFormFilePath] = useState('')
  const [formFileType, setFormFileType] = useState('')
  const [formFileUrl, setFormFileUrl] = useState('')
  const [formPassScore, setFormPassScore] = useState(50)
  const [formQuestions, setFormQuestions] = useState<MCQQuestion[]>([])
  const [showQBuilder, setShowQBuilder] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadStatusMsg, setUploadStatusMsg] = useState('')
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null)
  const [answerKeyPath, setAnswerKeyPath] = useState('')
  const [answerKeyType, setAnswerKeyType] = useState('')
  const [answerKeyUrl, setAnswerKeyUrl] = useState('')
  const [uploadingAnswerKey, setUploadingAnswerKey] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPath, setThumbnailPath] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const answerKeyRef = useRef<HTMLInputElement>(null)
  const thumbnailRef = useRef<HTMLInputElement>(null)

  const loadExams = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/exams?pageSize=100')
      if (!res.ok) {
        try { const errData = await res.json(); toast.error('خطأ في تحميل الامتحانات: ' + (errData.error || ''), { duration: 8000 }) } catch { toast.error('خطأ في السيرفر', { duration: 8000 }) }
      } else {
        const data = await res.json()
        setExams(data.exams || [])
      }
    } catch (err: any) { toast.error('خطأ: ' + (err.message || ''), { duration: 8000 }) }
    setLoading(false)
  }

  useEffect(() => { loadExams() }, [])

  const loadExamResults = async (examId: string) => {
    if (!examId) { setResults([]); setNotTaken([]); setMostMissed([]); return }
    try {
      const res = await fetch(`/api/exam-results?examId=${examId}`)
      const data = await res.json()
      setResults(data.results || [])
      setNotTaken(data.notTaken || [])
      setMostMissed(data.mostMissed || [])
    } catch { toast.error('خطأ في تحميل النتائج') }
  }

  const handleExamSelect = (examId: string) => {
    setSelectedExam(examId)
    loadExamResults(examId)
  }

  const handleAddExam = async () => {
    if (!formTitle.trim() || !formGrade) { toast.error('أدخل العنوان واختر الصف'); return }
    setSubmitting(true)
    try {
      let localFilePath = formFilePath || ''
      let localFileType = formFileType || ''
      let localAnswerKeyPath = answerKeyPath || ''
      let localAnswerKeyType = answerKeyType || ''
      let localThumbnailPath = thumbnailPath || ''

      if (!localFilePath && (formFile || formFileUrl.trim())) {
        if (formFileUrl.trim()) {
          localFilePath = formFileUrl.trim(); localFileType = ''; setFormFilePath(localFilePath); setFormFileType('')
        } else if (formFile) {
          setUploading(true); setUploadStatusMsg('جاري رفع نموذج الأسئلة...')
          try {
            const upData = await chunkedUpload(formFile, 'exams', undefined, (msg) => setUploadStatusMsg(msg))
            localFilePath = upData.filePath; localFileType = upData.fileType; setFormFilePath(upData.filePath); setFormFileType(upData.fileType)
          } catch (err: any) { toast.error(err.message || 'فشل رفع نموذج الأسئلة'); setUploading(false); setUploadStatusMsg(''); setSubmitting(false); return }
          setUploading(false)
        }
      }
      if (!localAnswerKeyPath && (answerKeyFile || answerKeyUrl.trim())) {
        if (answerKeyUrl.trim()) {
          localAnswerKeyPath = answerKeyUrl.trim(); localAnswerKeyType = ''; setAnswerKeyPath(localAnswerKeyPath); setAnswerKeyType('')
        } else if (answerKeyFile) {
          setUploadingAnswerKey(true); setUploadStatusMsg('جاري رفع نموذج الإجابة...')
          try {
            const upData = await chunkedUpload(answerKeyFile, 'exams', undefined, (msg) => setUploadStatusMsg(msg))
            localAnswerKeyPath = upData.filePath; localAnswerKeyType = upData.fileType; setAnswerKeyPath(upData.filePath); setAnswerKeyType(upData.fileType)
          } catch (err: any) { toast.error(err.message || 'فشل رفع نموذج الإجابة'); setUploadingAnswerKey(false); setUploadStatusMsg(''); setSubmitting(false); return }
          setUploadingAnswerKey(false)
        }
      }
      if (!localThumbnailPath && (thumbnailFile || thumbnailUrl.trim())) {
        if (thumbnailUrl.trim()) {
          localThumbnailPath = thumbnailUrl.trim(); setThumbnailPath(localThumbnailPath)
        } else if (thumbnailFile) {
          setUploading(true); setUploadStatusMsg('جاري رفع الصورة المصغرة...')
          try {
            const upData = await chunkedUpload(thumbnailFile, 'exams', undefined, (msg) => setUploadStatusMsg(msg))
            localThumbnailPath = upData.filePath; setThumbnailPath(upData.filePath)
          } catch (err: any) { toast.error(err.message || 'فشل رفع الصورة المصغرة'); setUploading(false); setUploadStatusMsg(''); setSubmitting(false); return }
          setUploading(false)
        }
      }
      setUploadStatusMsg('')
      const body: Record<string, string> = { title: formTitle, grade: formGrade, content: formContent }
      if (localFilePath) { body.filePath = localFilePath; body.fileType = localFileType }
      if (localAnswerKeyPath) { body.answerKeyPath = localAnswerKeyPath; body.answerKeyType = localAnswerKeyType }
      if (localThumbnailPath) { body.thumbnail = localThumbnailPath }
      if (formQuestions.length > 0) { body.questions = JSON.stringify(formQuestions); body.passScore = String(formPassScore) }
      const res = await fetch('/api/exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success('تم إضافة الامتحان'); setShowForm(false); setFormTitle(''); setFormContent(''); setFormGrade(''); setFormFile(null); setFormFilePath(''); setFormFileType(''); setFormFileUrl(''); setFormQuestions([]); setFormPassScore(50); setAnswerKeyFile(null); setAnswerKeyPath(''); setAnswerKeyType(''); setAnswerKeyUrl(''); setThumbnailFile(null); setThumbnailPath(''); setThumbnailUrl(''); loadExams()
      } else { try { const d = await res.json(); toast.error(d.error || 'خطأ', { duration: 8000 }) } catch { toast.error('خطأ في السيرفر - حاول تاني', { duration: 8000 }) } }
    } catch (err: any) { toast.error('خطأ في الاتصال: ' + (err.message || ''), { duration: 8000 }) }
    setSubmitting(false)
  }

  const handleDeleteExam = async (id: string) => {
    try { await fetch(`/api/exams/${id}`, { method: 'DELETE' }); toast.success('تم حذف الامتحان'); loadExams(); if (selectedExam === id) { setSelectedExam(''); setResults([]); setNotTaken([]); setMostMissed([]) } } catch { toast.error('خطأ') }
  }

  const avgScore = results.length > 0 ? (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1) : '—'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />تتبع الامتحانات</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 ml-1" />إضافة امتحان</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <h4 className="font-semibold text-sm">إضافة امتحان جديد</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label className="text-xs">الصف</Label>
                <select value={formGrade} onChange={(e) => setFormGrade(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="">اختر الصف</option>{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">العنوان</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="عنوان الامتحان" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">المحتوى</Label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} rows={3} /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">نموذج الأسئلة (رفع ملف أو رابط) - يعرض للطلاب</Label>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => { setFormFile(e.target.files?.[0] || null); setFormFilePath(''); setFormFileUrl('') }} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 ml-1" />{formFile ? formFile.name : 'رفع ملف'}</Button>
                {formFile && <span className="text-xs text-muted-foreground">{(formFile.size / 1024 / 1024).toFixed(1)} MB</span>}
                {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground shrink-0">أو رابط:</span>
                <Input placeholder="https://..." value={formFileUrl} onChange={(e) => { setFormFileUrl(e.target.value); if (e.target.value.trim()) { setFormFile(null); setFormFilePath('') } }} dir="ltr" className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">نموذج الإجابة (رفع ملف أو رابط) - للتصحيح</Label>
              <div className="flex items-center gap-2">
                <input ref={answerKeyRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => { setAnswerKeyFile(e.target.files?.[0] || null); setAnswerKeyPath(''); setAnswerKeyUrl('') }} />
                <Button type="button" variant="outline" size="sm" onClick={() => answerKeyRef.current?.click()}><FileDown className="h-4 w-4 ml-1" />{answerKeyFile ? answerKeyFile.name : 'رفع ملف'}</Button>
                {answerKeyFile && <span className="text-xs text-muted-foreground">{(answerKeyFile.size / 1024 / 1024).toFixed(1)} MB</span>}
                {uploadingAnswerKey && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground shrink-0">أو رابط:</span>
                <Input placeholder="https://..." value={answerKeyUrl} onChange={(e) => { setAnswerKeyUrl(e.target.value); if (e.target.value.trim()) { setAnswerKeyFile(null); setAnswerKeyPath('') } }} dir="ltr" className="h-8 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">صورة مصغرة (اختياري - رفع أو رابط)</Label>
              <div className="flex items-center gap-3">
                <input ref={thumbnailRef} type="file" accept="image/*" className="hidden" onChange={(e) => { setThumbnailFile(e.target.files?.[0] || null); setThumbnailPath(''); setThumbnailUrl('') }} />
                <Button type="button" variant="outline" size="sm" onClick={() => thumbnailRef.current?.click()}><PictureInPicture2 className="h-4 w-4 ml-1" />{thumbnailFile ? thumbnailFile.name : 'رفع صورة'}</Button>
                {thumbnailPath && <div className="w-12 h-8 rounded border overflow-hidden relative"><Image src={thumbnailPath} alt="thumb" fill className="object-cover" sizes="48px" unoptimized /></div>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground shrink-0">أو رابط:</span>
                <Input placeholder="https://..." value={thumbnailUrl} onChange={(e) => { setThumbnailUrl(e.target.value); if (e.target.value.trim()) { setThumbnailFile(null); setThumbnailPath('') } }} dir="ltr" className="h-8 text-xs" />
              </div>
            </div>
            {uploadStatusMsg && <p className="text-xs text-primary animate-pulse">{uploadStatusMsg}</p>}

            {/* MCQ Question Builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">أسئلة اختيار من متعدد (اختياري - تصحيح أوتوماتيك)</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowQBuilder(!showQBuilder)}>
                  {showQBuilder ? 'إخفاء' : '+ إضافة أسئلة MCQ'}
                </Button>
              </div>
              {showQBuilder && (
                <div className="space-y-3 p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs shrink-0">درجة النجاح</Label>
                    <Input type="number" value={formPassScore} onChange={(e) => setFormPassScore(Number(e.target.value))} className="w-20 h-8 text-sm" min={0} max={100} />
                    <span className="text-xs text-muted-foreground">/ 100</span>
                    <span className="text-xs text-muted-foreground mr-auto">{formQuestions.length} سؤال | {formQuestions.reduce((s, q) => s + q.points, 0)} درجة</span>
                  </div>
                  {formQuestions.map((q, qi) => (
                    <div key={qi} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-primary mt-1.5">{qi + 1}</span>
                        <Input value={q.q} onChange={(e) => { const n = [...formQuestions]; n[qi] = { ...n[qi], q: e.target.value }; setFormQuestions(n) }} placeholder="نص السؤال" className="text-sm" />
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => setFormQuestions(formQuestions.filter((_, i) => i !== qi))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2 mr-6">
                          <button type="button" className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] transition-colors ${q.correct === oi ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}`}
                            onClick={() => { const n = [...formQuestions]; n[qi] = { ...n[qi], correct: oi }; setFormQuestions(n) }}>{String.fromCharCode(65 + oi)}</button>
                          <Input value={opt} onChange={(e) => { const n = [...formQuestions]; const newOpts = [...n[qi].options]; newOpts[oi] = e.target.value; n[qi] = { ...n[qi], options: newOpts }; setFormQuestions(n) }} placeholder={`الخيار ${String.fromCharCode(65 + oi)}`} className="h-8 text-sm" />
                        </div>
                      ))}
                      <div className="flex gap-2 mr-6">
                        {q.options.length < 6 && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { const n = [...formQuestions]; n[qi] = { ...n[qi], options: [...n[qi].options, ''] }; setFormQuestions(n) }}>+ خيار</Button>}
                        <Label className="text-xs mr-auto flex items-center gap-1">الدرجة: <Input type="number" value={q.points} onChange={(e) => { const n = [...formQuestions]; n[qi] = { ...n[qi], points: Number(e.target.value) || 0 }; setFormQuestions(n) }} className="w-14 h-7 text-xs" min={1} /></Label>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setFormQuestions([...formQuestions, { q: '', options: ['', '', '', ''], correct: 0, points: Math.max(1, Math.floor(100 / (formQuestions.length + 1))) }])}><Plus className="h-4 w-4 ml-1" />إضافة سؤال</Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddExam} disabled={submitting || uploading || uploadingAnswerKey}>{submitting || uploading || uploadingAnswerKey ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}</Button>
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </div>
        )}

        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar lg:col-span-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">اختر امتحان لعرض النتائج</p>
              {exams.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">لا توجد امتحانات</p> : exams.map((exam) => (
                <div key={exam.id} className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${selectedExam === exam.id ? 'border-primary bg-primary/5' : 'bg-card'}`}
                  onClick={() => handleExamSelect(exam.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{exam.title}</p>
                      <p className="text-[10px] text-muted-foreground">{exam.grade}</p>
                      <div className="flex gap-1 mt-1">
                        {(exam as any).thumbnail && <Badge variant="outline" className="text-[9px] border-purple-500/40 text-purple-600">صورة</Badge>}
                        {(exam as any).filePath && <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">أسئلة</Badge>}
                        {(exam as any).answerKeyPath && <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-600">إجابة</Badge>}
                        {(exam as any).questions && (exam as any).questions !== '' && <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-600">MCQ</Badge>}
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleDeleteExam(exam.id) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 space-y-4">
              {!selectedExam ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">اختر امتحان من القائمة لعرض النتائج</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="text-center px-4 py-2 rounded-lg bg-primary/10"><p className="text-lg font-bold text-primary">{results.length}</p><p className="text-[10px] text-muted-foreground">قدموا</p></div>
                    <div className="text-center px-4 py-2 rounded-lg bg-emerald-500/10"><p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{avgScore}</p><p className="text-[10px] text-muted-foreground">متوسط الدرجات</p></div>
                    <div className="text-center px-4 py-2 rounded-lg bg-red-500/10"><p className="text-lg font-bold text-red-600 dark:text-red-400">{notTaken.length}</p><p className="text-[10px] text-muted-foreground">لم يقدموا بعد</p></div>
                  </div>
                  {results.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">الطلاب الذين قدموا الامتحان</p>
                      <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                        {results.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border bg-card text-sm">
                            <div><span className="font-medium">{r.student?.name || '—'}</span> <span className="text-[10px] text-muted-foreground" dir="ltr">{r.student?.phone || ''}</span></div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${r.score >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{r.score}/{r.maxScore}</span>
                              <span className="text-[10px] text-muted-foreground">{new Date(r.submittedAt).toLocaleDateString('ar-EG')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {notTaken.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-red-500">لم يقدموا الامتحان بعد</p>
                      <div className="max-h-[200px] overflow-y-auto custom-scrollbar space-y-1">
                        {notTaken.map((s) => (
                          <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 text-sm">
                            <div><span className="font-medium">{s.name}</span> <span className="text-[10px] text-muted-foreground" dir="ltr">{s.phone}</span></div>
                            <UserX className="h-4 w-4 text-red-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Most Missed Questions - NEW */}
                  {mostMissed.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />أكتر الأسئلة اللي غلط فيها</p>
                      <div className="space-y-1.5">
                        {mostMissed.map((q: any, i: number) => (
                          <div key={i} className="p-2.5 rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10">
                            <p className="text-xs font-medium truncate">{q.question}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">{q.wrong} غلط من {q.total}</span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${(q.wrong / q.total) * 100}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground">{Math.round((q.wrong / q.total) * 100)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ========== MY STUDENTS PANEL ========== */
function MyStudentsPanel() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [detail, setDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [filterGrade, setFilterGrade] = useState('')

  useEffect(() => {
    const params = new URLSearchParams({ status: 'approved', pageSize: '200' })
    if (filterGrade) params.set('grade', filterGrade)
    fetch(`/api/students?${params}`).then(r => r.json()).then(data => { setStudents(data.students || []); setLoading(false) }).catch(() => setLoading(false))
  }, [filterGrade])

  const loadDetail = async (studentId: string) => {
    setSelectedStudent(studentId)
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/students/${studentId}/progress`)
      const data = await res.json()
      setDetail(data)
    } catch { toast.error('خطأ في تحميل التفاصيل') }
    setLoadingDetail(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">طلابي</CardTitle>
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="h-8 rounded-md border border-input bg-transparent px-2 text-xs">
              <option value="">كل الصفوف</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : students.length === 0 ? (
            <p className="text-center text-muted-foreground py-10 text-sm">لا يوجد طلاب مفعلين</p>
          ) : (
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar">
              {students.map((s) => (
                <div key={s.id} className={`p-2.5 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${selectedStudent === s.id ? 'border-primary bg-primary/5' : 'bg-card'}`}
                  onClick={() => loadDetail(s.id)}>
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.grade}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="p-4">
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">اختر طالب لعرض تفاصيله</p>
            </div>
          ) : loadingDetail ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : detail ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{detail.student.name}</h3>
                  <p className="text-xs text-muted-foreground">{detail.student.grade} | {detail.student.phone}</p>
                </div>
                <Badge variant={detail.student.status === 'approved' ? 'default' : 'secondary'} className="text-xs">{detail.student.status === 'approved' ? 'مقبول' : detail.student.status}</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-purple-500/10"><p className="text-xl font-bold text-purple-600 dark:text-purple-400">{detail.summary.totalVideosWatched}</p><p className="text-[10px] text-muted-foreground">فيديو شاهده</p></div>
                <div className="text-center p-3 rounded-lg bg-blue-500/10"><p className="text-xl font-bold text-blue-600 dark:text-blue-400">{detail.summary.avgWatchPercent}%</p><p className="text-[10px] text-muted-foreground">متوسط المشاهدة</p></div>
                <div className="text-center p-3 rounded-lg bg-emerald-500/10"><p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{detail.summary.avgExamScore}</p><p className="text-[10px] text-muted-foreground">متوسط الامتحانات</p></div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10"><p className="text-xl font-bold text-amber-600 dark:text-amber-400">{detail.summary.examsPassed}/{detail.summary.totalExamsTaken}</p><p className="text-[10px] text-muted-foreground">ناجح/إجمالي</p></div>
              </div>

              {detail.videoProgress && detail.videoProgress.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5 text-purple-500" />تقدم الفيديوهات</h4>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {detail.videoProgress.map((vp: any) => (
                      <div key={vp.id} className="flex items-center justify-between p-1.5 rounded border bg-card">
                        <p className="text-[11px] font-medium truncate max-w-[200px]">{vp.videoTitle}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${vp.percent >= 90 ? 'text-emerald-600' : vp.percent >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{vp.percent}%</span>
                          <div className="h-1.5 w-12 bg-muted rounded-full"><div className={`h-full rounded-full ${vp.percent >= 90 ? 'bg-emerald-500' : vp.percent >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${vp.percent}%` }} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.examResults && detail.examResults.length > 0 && (
                <div className="sm:col-span-2">
                  <h4 className="text-xs font-semibold mb-2 flex items-center gap-1"><Trophy className="h-3.5 w-3.5 text-amber-500" />نتائج الامتحانات</h4>
                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {detail.examResults.map((er: any) => (
                      <div key={er.id} className="flex items-center justify-between p-1.5 rounded border bg-card">
                        <p className="text-[11px] font-medium truncate max-w-[200px]">{er.examTitle}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${er.passed ? 'text-emerald-600' : 'text-red-500'}`}>{er.score}/{er.maxScore}</span>
                          <Badge variant={er.passed ? 'default' : 'destructive'} className="text-[9px] h-5">{er.passed ? 'ناجح' : 'راسب'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6 text-sm">لم يتم تحميل البيانات</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ========== GALLERY MANAGER ========== */
function GalleryManager() {
  const [items, setItems] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState<'image' | 'video'>('image')
  const [formImage, setFormImage] = useState<File | null>(null)
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formVideoUrl, setFormVideoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const imageRef = useRef<HTMLInputElement>(null)

  const loadItems = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gallery?pageSize=100')
      const data = await res.json()
      setItems(data.images || [])
    } catch { toast.error('خطأ في تحميل المعرض') }
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [])

  const handleAdd = async () => {
    if (formType === 'image' && !formImage && !formImageUrl.trim()) { toast.error('اختر صورة أو أدخل رابط'); return }
    if (formType === 'video' && !formVideoUrl.trim()) { toast.error('أدخل رابط الفيديو'); return }
    setSubmitting(true); setUploading(true)
    try {
      let filePath = formImageUrl.trim()
      if (formType === 'image' && formImage && !filePath) {
        setUploadMsg('جاري رفع الصورة...')
        const data = await chunkedUpload(formImage, 'gallery', undefined, (msg) => setUploadMsg(msg))
        filePath = data.filePath
      }
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle, type: formType, filePath, videoUrl: formVideoUrl.trim(), sortOrder: items.length }),
      })
      if (res.ok) { toast.success('تم الإضافة'); setShowForm(false); setFormTitle(''); setFormImage(null); setFormImageUrl(''); setFormVideoUrl(''); loadItems() }
      else { try { const d = await res.json(); toast.error(d.error || 'خطأ') } catch { toast.error('خطأ') } }
    } catch (err: any) { toast.error('خطأ: ' + (err.message || '')) }
    setSubmitting(false); setUploading(false); setUploadMsg('')
  }

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/gallery/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); loadItems() } catch { toast.error('خطأ') }
  }

  const handleSort = async (id: string, newOrder: number) => {
    try { await fetch(`/api/gallery/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: newOrder }) }) } catch {}
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-primary" />معرض الصور والفيديوهات</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 ml-1" />إضافة</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <h4 className="font-semibold text-sm">إضافة عنصر جديد</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label className="text-xs">العنوان</Label><Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="عنوان الصورة أو الفيديو" /></div>
              <div className="space-y-1.5"><Label className="text-xs">النوع</Label>
                <select value={formType} onChange={(e) => setFormType(e.target.value as any)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                  <option value="image">صورة</option><option value="video">فيديو</option>
                </select>
              </div>
            </div>
            {formType === 'image' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { setFormImage(e.target.files?.[0] || null); setFormImageUrl('') }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => imageRef.current?.click()}><Upload className="h-4 w-4 ml-1" />{formImage ? formImage.name : 'اختر صورة'}</Button>
                  {formImage && <span className="text-xs text-muted-foreground">{(formImage.size / 1024).toFixed(0)} KB</span>}
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                {uploadMsg && <p className="text-xs text-primary animate-pulse">{uploadMsg}</p>}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">أو رابط صورة:</span>
                  <Input placeholder="https://..." value={formImageUrl} onChange={(e) => { setFormImageUrl(e.target.value); if (e.target.value.trim()) setFormImage(null) }} dir="ltr" className="h-8 text-xs" />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5"><Label className="text-xs">رابط الفيديو</Label><Input placeholder="https://youtube.com/watch?v=..." value={formVideoUrl} onChange={(e) => setFormVideoUrl(e.target.value)} dir="ltr" /></div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={submitting || uploading}>{submitting || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setFormTitle(''); setFormImage(null); setFormImageUrl(''); setFormVideoUrl('') }}>إلغاء</Button>
            </div>
          </div>
        )}
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">المعرض فارغ</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, idx) => (
              <div key={item.id} className="rounded-lg border bg-card overflow-hidden group">
                <div className="relative aspect-video bg-black">
                  {item.type === 'video' && item.videoUrl ? (
                    <iframe src={item.videoUrl.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen />
                  ) : item.filePath ? (
                    <Image src={item.filePath} alt={item.title} fill className="object-cover" sizes="200px" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30"><Camera className="h-8 w-8" /></div>
                  )}
                </div>
                <div className="p-2 flex items-center justify-between">
                  <p className="text-xs font-medium truncate">{item.title || 'بدون عنوان'}</p>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { handleSort(item.id, Math.max(0, item.sortOrder - 1)); loadItems() }} disabled={idx === 0}><ChevronLeft className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { handleSort(item.id, item.sortOrder + 1); loadItems() }} disabled={idx === items.length - 1}><ChevronIcon className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const ChevronIcon = ChevronLeft

/* ========== PAYMENTS PANEL ========== */
function PaymentsPanel() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const loadPayments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      const res = await fetch(`/api/payments?${params}`)
      const data = await res.json()
      setPayments(data.payments || [])
    } catch { toast.error('خطأ في تحميل المدفوعات') }
    setLoading(false)
  }

  useEffect(() => { loadPayments() }, [filter])

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/payments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(status === 'approved' ? 'تم قبول الدفع وفتح المحتوى للطالب' : 'تم رفض الدفع')
        loadPayments()
      } else {
        const data = await res.json()
        toast.error(data.error || 'خطأ')
      }
    } catch { toast.error('خطأ في الاتصال') }
  }

  const methodLabels: Record<string, string> = {
    fawry: 'فوري (Fawry)',
    instapay: 'تحويل بنكي / InstaPay',
    vodafone_cash: 'فودافون كاش (Vodafone Cash)',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const statusLabels: Record<string, string> = {
    pending: 'في الانتظار',
    approved: 'مقبول',
    rejected: 'مرفوض',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />إدارة المدفوعات</CardTitle>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['pending', 'all', 'approved', 'rejected'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'ghost'} size="sm" className="text-xs h-7 px-2" onClick={() => setFilter(f)}>
                {f === 'pending' ? 'في الانتظار' : f === 'approved' ? 'مقبول' : f === 'rejected' ? 'مرفوض' : 'الكل'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : payments.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد مدفوعات</p>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {payments.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row items-start gap-3 p-3 rounded-lg border bg-card">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{p.studentName}</span>
                    <Badge className={`text-[10px] ${statusColors[p.status]}`}>{statusLabels[p.status]}</Badge>
                    <span className="text-[10px] text-muted-foreground" dir="ltr">{p.studentPhone}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">الصف: {p.studentGrade} | {methodLabels[p.method] || p.method}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-primary">{p.amount} جنيه</span>
                    {p.videoTitle && <Badge variant="outline" className="text-[10px]">{p.videoTitle}</Badge>}
                  </div>
                  {p.receiptPath && (
                    <a href={p.receiptPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <EyeIcon className="h-3 w-3" />عرض صورة الوصل
                    </a>
                  )}
                  {p.note && <p className="text-[10px] text-muted-foreground">ملاحظة: {p.note}</p>}
                  <p className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('ar-EG')} {new Date(p.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {p.status === 'pending' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleAction(p.id, 'approved')}>
                      <ShieldCheck className="h-3.5 w-3.5 ml-1" />قبول
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-destructive hover:bg-destructive/10" onClick={() => handleAction(p.id, 'rejected')}>
                      <ShieldX className="h-3.5 w-3.5 ml-1" />رفض
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ========== QUESTION ANALYTICS PANEL ========== */
function QuestionAnalyticsPanel() {
  const [exams, setExams] = useState<Exam[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [selectedType, setSelectedType] = useState<'exam' | 'homework'>('exam')
  const [mostMissed, setMostMissed] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/exams?pageSize=100').then(r => r.json()),
      fetch('/api/homework?pageSize=100').then(r => r.json()),
    ]).then(([examData, hwData]) => {
      setExams(examData.exams || [])
      setHomework(hwData.homework || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const loadAnalytics = async (id: string, type: 'exam' | 'homework') => {
    setSelectedId(id)
    setSelectedType(type)
    try {
      const endpoint = type === 'exam' ? `/api/exam-results?examId=${id}` : `/api/homework/submit?homeworkId=${id}`
      const res = await fetch(endpoint)
      const data = await res.json()
      setMostMissed(data.mostMissed || [])
      setResults(data.results || [])
    } catch { toast.error('خطأ في تحميل التحليل') }
  }

  const items = selectedType === 'exam' ? exams : homework

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />تحليل الأسئلة</CardTitle>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button size="sm" variant={selectedType === 'exam' ? 'default' : 'ghost'} className="text-xs h-7" onClick={() => { setSelectedType('exam'); setSelectedId('') }}>امتحانات</Button>
            <Button size="sm" variant={selectedType === 'homework' ? 'default' : 'ghost'} className="text-xs h-7" onClick={() => { setSelectedType('homework'); setSelectedId('') }}>واجبات</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar lg:col-span-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">اختر {selectedType === 'exam' ? 'امتحان' : 'واجب'} لعرض التحليل</p>
              {items.length === 0 ? <p className="text-xs text-muted-foreground text-center py-6">لا يوجد عناصر</p> : items.map((item: any) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${selectedId === item.id ? 'border-primary bg-primary/5' : 'bg-card'}`}
                  onClick={() => loadAnalytics(item.id, selectedType)}
                >
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.grade}</p>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2">
              {!selectedId ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">اختر {selectedType === 'exam' ? 'امتحان' : 'واجب'} لعرض تحليل الأسئلة</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 flex-wrap mb-4">
                    <div className="text-center px-4 py-2 rounded-lg bg-blue-500/10"><p className="text-lg font-bold text-blue-600">{results.length}</p><p className="text-[10px] text-muted-foreground">قدموا</p></div>
                    <div className="text-center px-4 py-2 rounded-lg bg-red-500/10"><p className="text-lg font-bold text-red-600">{mostMissed.length}</p><p className="text-[10px] text-muted-foreground">أسئلة صعبة</p></div>
                  </div>
                  {mostMissed.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">لا توجد بيانات كافية للتحليل</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />الأسئلة الأكثر غلقاً (مرتبة من الأصعب)</p>
                      {mostMissed.map((q: any, i: number) => (
                        <div key={i} className="p-3 rounded-lg border bg-card space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/30 rounded px-1.5 py-0.5 shrink-0">#{i + 1}</span>
                            <p className="text-sm">{q.question}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-red-600 dark:text-red-400 font-bold">{q.wrong} غلط من {q.total} طالب</span>
                            <div className="flex-1 h-2 bg-muted rounded-full">
                              <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all" style={{ width: `${(q.wrong / q.total) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-red-500">{Math.round((q.wrong / q.total) * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ========== CONTENT MANAGER (for Homework & Announcements) ========== */
interface CMProps<T extends { id: string; grade: string; createdAt: string }> {
  title: string; apiPath: string; itemName: string
  fields: Record<string, { label: string; type: 'text' | 'textarea'; placeholder?: string }>
  renderTitle: (item: T) => string; renderSubtitle: (item: T) => string
  supportFileUpload?: boolean; fileCategory?: string; acceptedTypes?: string
  supportAnswerKey?: boolean; supportThumbnail?: boolean; supportMCQ?: boolean
  onRefresh: () => void
}

function ContentManager<T extends { id: string; grade: string; createdAt: string }>({ title, apiPath, itemName, fields, renderTitle, renderSubtitle, supportFileUpload, fileCategory, acceptedTypes, supportAnswerKey, supportThumbnail, supportMCQ, onRefresh }: CMProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formGrade, setFormGrade] = useState('')
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [mcqQuestions, setMcqQuestions] = useState<Array<{ question: string; options: string[]; correct: number }>>([])
  const [formFile, setFormFile] = useState<File | null>(null)
  const [formFilePath, setFormFilePath] = useState('')
  const [formFileUrl, setFormFileUrl] = useState('')
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null)
  const [answerKeyPath, setAnswerKeyPath] = useState('')
  const [answerKeyUrl, setAnswerKeyUrl] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPath, setThumbnailPath] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const answerKeyRef = useRef<HTMLInputElement>(null)
  const thumbnailRef = useRef<HTMLInputElement>(null)

  const loadItems = async (showLoader = true) => {
    if (showLoader) setLoading(true)
    try {
      const params = new URLSearchParams({ pageSize: '100' })
      if (filterGrade) params.set('grade', filterGrade)
      const res = await fetch(`${apiPath}?${params}`)
      if (!res.ok) {
        try { const errData = await res.json(); toast.error('خطأ في تحميل: ' + (errData.error || ''), { description: apiPath, duration: 8000 }) } catch { toast.error('خطأ في السيرفر', { description: apiPath, duration: 8000 }) }
      } else {
        const data = await res.json()
        setItems(data[itemName] || [])
      }
    } catch (err: any) { toast.error('خطأ في تحميل البيانات: ' + (err.message || ''), { description: apiPath, duration: 6000 }) }
    setLoading(false)
  }

  useEffect(() => { loadItems() }, [apiPath, itemName, filterGrade])

  const handleFileUpload = async (localPath: { val: string }, localType: { val: string }): Promise<boolean> => {
    if (formFileUrl.trim()) { localPath.val = formFileUrl.trim(); localType.val = ''; setFormFilePath(localPath.val); return true }
    if (!formFile || !fileCategory) return true
    setUploading(true); setUploadMsg('جاري رفع نموذج الأسئلة...')
    try {
      const data = await chunkedUpload(formFile, fileCategory, undefined, (msg) => setUploadMsg(msg))
      localPath.val = data.filePath; localType.val = data.fileType; setFormFilePath(data.filePath); return true
    } catch (err: any) { toast.error(err.message || 'خطأ في رفع الملف'); return false }
    finally { setUploading(false); setUploadMsg('') }
  }

  const handleAnswerKeyUpload = async (localPath: { val: string }, localType: { val: string }): Promise<boolean> => {
    if (answerKeyUrl.trim()) { localPath.val = answerKeyUrl.trim(); localType.val = ''; setAnswerKeyPath(localPath.val); return true }
    if (!answerKeyFile || !fileCategory) return true
    setUploading(true); setUploadMsg('جاري رفع نموذج الإجابة...')
    try {
      const data = await chunkedUpload(answerKeyFile, fileCategory, undefined, (msg) => setUploadMsg(msg))
      localPath.val = data.filePath; localType.val = data.fileType; setAnswerKeyPath(data.filePath); return true
    } catch (err: any) { toast.error(err.message || 'خطأ في رفع نموذج الإجابة'); return false }
    finally { setUploading(false); setUploadMsg('') }
  }

  const handleThumbnailUpload = async (localPath: { val: string }): Promise<boolean> => {
    if (thumbnailUrl.trim()) { localPath.val = thumbnailUrl.trim(); setThumbnailPath(localPath.val); return true }
    if (!thumbnailFile || !fileCategory) return true
    setUploading(true); setUploadMsg('جاري رفع الصورة المصغرة...')
    try {
      const data = await chunkedUpload(thumbnailFile, fileCategory, undefined, (msg) => setUploadMsg(msg))
      localPath.val = data.filePath; setThumbnailPath(data.filePath); return true
    } catch (err: any) { toast.error(err.message || 'خطأ في رفع الصورة المصغرة'); return false }
    finally { setUploading(false); setUploadMsg('') }
  }

  const handleSubmit = async () => {
    const titleVal = formValues['title']
    if (!titleVal?.trim()) { toast.error('أدخل العنوان'); return }
    if (!formGrade) { toast.error('اختر الصف'); return }
    setSubmitting(true)
    try {
      const filePathRef = { val: formFilePath || '' }
      const fileTypeRef = { val: formFile?.type || '' }
      const answerKeyPathRef = { val: answerKeyPath || '' }
      const answerKeyTypeRef = { val: '' }
      const thumbnailPathRef = { val: thumbnailPath || '' }

      if (supportFileUpload && !filePathRef.val && (formFile || formFileUrl.trim())) {
        const ok = await handleFileUpload(filePathRef, fileTypeRef)
        if (!ok) { setSubmitting(false); return }
      }
      if (supportAnswerKey && !answerKeyPathRef.val && (answerKeyFile || answerKeyUrl.trim())) {
        const ok = await handleAnswerKeyUpload(answerKeyPathRef, answerKeyTypeRef)
        if (!ok) { setSubmitting(false); return }
      }
      if (supportThumbnail && !thumbnailPathRef.val && (thumbnailFile || thumbnailUrl.trim())) {
        const ok = await handleThumbnailUpload(thumbnailPathRef)
        if (!ok) { setSubmitting(false); return }
      }
      const body: Record<string, string> = { ...formValues, grade: formGrade }
      if (filePathRef.val) { body.filePath = filePathRef.val; body.fileType = fileTypeRef.val }
      if (answerKeyPathRef.val) { body.answerKeyPath = answerKeyPathRef.val; body.answerKeyType = answerKeyTypeRef.val }
      if (thumbnailPathRef.val) { body.thumbnail = thumbnailPathRef.val }
      if (supportMCQ && mcqQuestions.length > 0) { body.questions = JSON.stringify(mcqQuestions) }
      const res = await fetch(apiPath, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success('تم الإضافة بنجاح'); setShowForm(false); setFormValues({}); setFormGrade(''); setFormFile(null); setFormFilePath(''); setFormFileUrl(''); setAnswerKeyFile(null); setAnswerKeyPath(''); setAnswerKeyUrl(''); setThumbnailFile(null); setThumbnailPath(''); setThumbnailUrl(''); setMcqQuestions([]); loadItems(false); onRefresh()
      } else { try { const d = await res.json(); toast.error(d.error || 'خطأ', { duration: 8000 }) } catch { toast.error('خطأ في السيرفر - حاول تاني', { duration: 8000 }) } }
    } catch (err: any) { toast.error('خطأ في الاتصال: ' + (err.message || ''), { duration: 8000 }) }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    try { await fetch(`${apiPath}/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); loadItems(false); onRefresh() } catch { toast.error('خطأ') }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex gap-2 items-center flex-wrap">
            <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
              <option value="">كل الصفوف</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4 ml-1" />إضافة</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <h4 className="font-semibold text-sm">إضافة جديد</h4>
            <div className="space-y-1.5">
              <Label className="text-xs">الصف الدراسي</Label>
              <select value={formGrade} onChange={(e) => setFormGrade(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
                <option value="">اختر الصف</option>{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            {Object.entries(fields).map(([key, field]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea placeholder={field.placeholder} value={formValues[key] || ''} onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })} rows={4} />
                ) : (
                  <Input placeholder={field.placeholder} value={formValues[key] || ''} onChange={(e) => setFormValues({ ...formValues, [key]: e.target.value })} dir={key === 'url' ? 'ltr' : 'rtl'} />
                )}
              </div>
            ))}
            {supportFileUpload && (
              <div className="space-y-1.5">
                <Label className="text-xs">نموذج الأسئلة (رفع ملف أو رابط)</Label>
                <div className="flex items-center gap-2">
                  <input ref={fileRef} type="file" accept={acceptedTypes} className="hidden" onChange={(e) => { setFormFile(e.target.files?.[0] || null); setFormFilePath(''); setFormFileUrl('') }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4 ml-1" />{formFile ? formFile.name : 'رفع ملف'}</Button>
                  {formFile && <span className="text-xs text-muted-foreground">{(formFile.size / 1024 / 1024).toFixed(1)} MB</span>}
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">أو رابط:</span>
                  <Input placeholder="https://..." value={formFileUrl} onChange={(e) => { setFormFileUrl(e.target.value); if (e.target.value.trim()) { setFormFile(null); setFormFilePath('') } }} dir="ltr" className="h-8 text-xs" />
                </div>
              </div>
            )}
            {supportAnswerKey && (
              <div className="space-y-1.5">
                <Label className="text-xs">نموذج الإجابة (رفع ملف أو رابط)</Label>
                <div className="flex items-center gap-2">
                  <input ref={answerKeyRef} type="file" accept={acceptedTypes} className="hidden" onChange={(e) => { setAnswerKeyFile(e.target.files?.[0] || null); setAnswerKeyPath(''); setAnswerKeyUrl('') }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => answerKeyRef.current?.click()}><FileDown className="h-4 w-4 ml-1" />{answerKeyFile ? answerKeyFile.name : 'رفع ملف'}</Button>
                  {answerKeyFile && <span className="text-xs text-muted-foreground">{(answerKeyFile.size / 1024 / 1024).toFixed(1)} MB</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">أو رابط:</span>
                  <Input placeholder="https://..." value={answerKeyUrl} onChange={(e) => { setAnswerKeyUrl(e.target.value); if (e.target.value.trim()) { setAnswerKeyFile(null); setAnswerKeyPath('') } }} dir="ltr" className="h-8 text-xs" />
                </div>
              </div>
            )}
            {supportThumbnail && (
              <div className="space-y-1.5">
                <Label className="text-xs">صورة مصغرة (اختياري - رفع أو رابط)</Label>
                <div className="flex items-center gap-3">
                  <input ref={thumbnailRef} type="file" accept="image/*" className="hidden" onChange={(e) => { setThumbnailFile(e.target.files?.[0] || null); setThumbnailPath(''); setThumbnailUrl('') }} />
                  <Button type="button" variant="outline" size="sm" onClick={() => thumbnailRef.current?.click()}><PictureInPicture2 className="h-4 w-4 ml-1" />{thumbnailFile ? thumbnailFile.name : 'رفع صورة'}</Button>
                  {thumbnailFile && <span className="text-xs text-muted-foreground">{(thumbnailFile.size / 1024).toFixed(0)} KB</span>}
                  {thumbnailPath && <div className="w-12 h-8 rounded border overflow-hidden relative"><Image src={thumbnailPath} alt="thumb" fill className="object-cover" sizes="48px" unoptimized /></div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground shrink-0">أو رابط:</span>
                  <Input placeholder="https://..." value={thumbnailUrl} onChange={(e) => { setThumbnailUrl(e.target.value); if (e.target.value.trim()) { setThumbnailFile(null); setThumbnailPath('') } }} dir="ltr" className="h-8 text-xs" />
                </div>
              </div>
            )}
            {supportMCQ && (
              <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-primary">أسئلة اختيار من متعدد (اختياري)</Label>
                  <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={function() {
                    setMcqQuestions([...mcqQuestions, { question: '', options: ['', '', '', ''], correct: 0 }])
                  }}><Plus className="h-3 w-3 ml-1" />إضافة سؤال</Button>
                </div>
                {mcqQuestions.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-2">اضغط "إضافة سؤال" لإضافة أسئلة متعددة</p>}
                {mcqQuestions.map(function(q, qi) {
                  return (
                    <div key={qi} className="space-y-2 p-3 rounded-lg border bg-background">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">سؤال {qi + 1}</span>
                        <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={function() { setMcqQuestions(mcqQuestions.filter(function(_, i) { return i !== qi })) }}><X className="h-3 w-3" /></Button>
                      </div>
                      <Input placeholder="اكتب السؤال هنا..." value={q.question} onChange={function(e) { var updated = [...mcqQuestions]; updated[qi] = { ...updated[qi], question: e.target.value }; setMcqQuestions(updated) }} className="text-sm" />
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map(function(opt, oi) {
                          return (
                            <div key={oi} className="flex items-center gap-1.5">
                              <input type="radio" name={"q" + qi} checked={q.correct === oi} onChange={function() { var updated = [...mcqQuestions]; updated[qi] = { ...updated[qi], correct: oi }; setMcqQuestions(updated) }} className="accent-primary" />
                              <Input placeholder={"اختيار " + (oi + 1)} value={opt} onChange={function(e) { var updated = [...mcqQuestions]; var newOpts = [...updated[qi].options]; newOpts[oi] = e.target.value; updated[qi] = { ...updated[qi], options: newOpts }; setMcqQuestions(updated) }} className="h-8 text-xs" />
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground">اختر الإجابة الصحيحة بجانب الاختيار</p>
                    </div>
                  )
                })}
              </div>
            )}
            {uploadMsg && <p className="text-xs text-primary animate-pulse">{uploadMsg}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitting || uploading}>{submitting || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}</Button>
              <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setFormValues({}); setFormFile(null); setFormFilePath(''); setFormFileUrl(''); setAnswerKeyFile(null); setAnswerKeyPath(''); setAnswerKeyUrl(''); setThumbnailFile(null); setThumbnailPath(''); setThumbnailUrl(''); setMcqQuestions([]); setUploadMsg('') }}>إلغاء</Button>
            </div>
          </div>
        )}
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : items.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 text-sm">لا توجد عناصر</p>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {items.map((item: any) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-lg border bg-card">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="font-semibold text-sm">{renderTitle(item)}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-md">{renderSubtitle(item)}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">{item.grade}</Badge>
                    {(item as any).thumbnail && <Badge variant="outline" className="text-[10px] border-purple-500/40 text-purple-600">صورة</Badge>}
                    {item.filePath && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">أسئلة</Badge>}
                    {item.answerKeyPath && <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600">إجابة</Badge>}
                    {(item as any).questions && <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600">أسئلة</Badge>}
                    <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
