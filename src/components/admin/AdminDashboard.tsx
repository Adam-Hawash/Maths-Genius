/* ========== GALLERY MANAGER ========== */
function GalleryManager() {
  var [images, setImages] = useState<GalleryImage[]>([])
  var [loading, setLoading] = useState(true)
  var [uploading, setUploading] = useState(false)
  var [showAddMenu, setShowAddMenu] = useState(false)
  var [imageUrl, setImageUrl] = useState('')
  var [videoUrl, setVideoUrl] = useState('')
  var [linkLoading, setLinkLoading] = useState(false)
  var fileRef = useRef<HTMLInputElement>(null)

  var loadGallery = async function() {
    setLoading(true)
    try {
      var res = await fetch('/api/gallery')
      var data = await res.json()
      setImages(data.images || [])
    } catch { toast.error('خطأ في تحميل المعرض') }
    setLoading(false)
  }

  useEffect(function() { loadGallery() }, [])

  var handleUpload = async function(file: File) {
    setUploading(true)
    try {
      var upData = await chunkedUpload(file, 'gallery')
      await fetch('/api/gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: file.name, filePath: upData.filePath, type: 'image' }) })
      toast.success('تم رفع الصورة'); loadGallery()
    } catch (err: any) { toast.error(err.message || 'خطأ في رفع الصورة') }
    setUploading(false)
  }

  var handleAddByLink = async function(type: string) {
    var url = type === 'video' ? videoUrl : imageUrl
    if (!url || !url.trim()) { toast.error('الرجاء إدخال الرابط'); return }
    setLinkLoading(true)
    try {
      var body: any = { type: type }
      if (type === 'video') {
        body.videoUrl = url.trim()
        body.title = 'فيديو'
      } else {
        body.filePath = url.trim()
        body.title = 'صورة'
      }
      var res = await fetch('/api/gallery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(type === 'video' ? 'تم إضافة الفيديو' : 'تم إضافة الصورة')
        setImageUrl(''); setVideoUrl(''); setShowAddMenu(false); loadGallery()
      } else {
        toast.error('خطأ في الإضافة')
      }
    } catch { toast.error('خطأ في الاتصال') }
    setLinkLoading(false)
  }

  var handleDelete = async function(id: string) {
    try { await fetch(`/api/gallery/${id}`, { method: 'DELETE' }); toast.success('تم الحذف'); loadGallery() } catch { toast.error('خطأ') }
  }

  var getVideoEmbedUrl = function(url: string) {
    var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/)
    if (yt) return 'https://www.youtube.com/embed/' + yt[1]
    var fb = url.match(/facebook\.com\/.*\/videos\/(\d+)/)
    if (fb) return 'https://www.facebook.com/plugins/video.php?href=' + encodeURIComponent(url)
    return url
  }

  var getVideoThumb = function(url: string) {
    var yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/)
    if (yt) return 'https://img.youtube.com/vi/' + yt[1] + '/mqdefault.jpg'
    return ''
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-primary" />المعرض | Gallery</CardTitle>
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={function(e) {
              var files = e.target.files
              if (files) { Array.from(files).forEach(function(f) { handleUpload(f) }) }
              e.target.value = ''
            }} />
            <Button size="sm" onClick={function() { fileRef.current?.click() }} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 ml-1" />}
              رفع صور
            </Button>
            <Button size="sm" variant="outline" onClick={function() { setShowAddMenu(!showAddMenu) }}>
              <Plus className="h-4 w-4 ml-1" />
              إضافة
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Add Menu */}
      {showAddMenu && (
        <div className="px-6 pb-4 space-y-3">
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <p className="text-sm font-medium flex items-center gap-2"><Link2 className="h-4 w-4" />إضافة بالرابط | Add by URL</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">صورة بالرابط</Label>
                <div className="flex gap-2">
                  <Input placeholder="https://example.com/image.jpg" value={imageUrl} onChange={function(e) { setImageUrl(e.target.value) }} dir="ltr" className="h-9 text-sm" />
                  <Button size="sm" onClick={function() { handleAddByLink('image') }} disabled={linkLoading}>
                    {linkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">فيديو بالرابط (YouTube, etc.)</Label>
                <div className="flex gap-2">
                  <Input placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={function(e) { setVideoUrl(e.target.value) }} dir="ltr" className="h-9 text-sm" />
                  <Button size="sm" onClick={function() { handleAddByLink('video') }} disabled={linkLoading}>
                    {linkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CardContent>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Camera className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">لا توجد صور أو فيديوهات. أضف محتوى للمعرض!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar">
            {images.map(function(img) {
              var isVideo = img.type === 'video'
              var thumb = isVideo ? (getVideoThumb(img.videoUrl) || '') : img.filePath
              var src = thumb || img.filePath || img.videoUrl
              return (
                <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-card aspect-square">
                  {src ? (
                    <img src={src} alt={img.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted"><PlayCircle className="h-8 w-8 text-muted-foreground/30" /></div>
                  )}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center"><PlayCircle className="h-5 w-5 text-white" /></div>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="bg-black/50 text-white border-0 text-[10px] backdrop-blur-sm">
                      {isVideo ? <Film className="h-3 w-3 ml-1" /> : <ImageIcon className="h-3 w-3 ml-1" />}
                      {isVideo ? 'فيديو' : 'صورة'}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={function() { handleDelete(img.id) }}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ========== MY STUDENTS PANEL (طلابي) ========== */
