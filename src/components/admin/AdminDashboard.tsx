/* === REPLACE THIS ENTIRE SETTINGS DIALOG BLOCK IN AdminDashboard.tsx === */
/* Find: {showSettings && ( */
/* And replace everything from {showSettings && ( to the closing )} before </div></div> */
/* === START REPLACEMENT === */

        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)}>
            <div className="bg-card border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />الإعدادات</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(false)}><X className="h-4 w-4" /></Button>
              </div>
              {settingsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-4">
                  {/* ===== PLATFORM SETTINGS (no password needed) ===== */}
                  <div className="rounded-lg border p-4 space-y-4">
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">إعدادات المنصة</p>

                    {/* Payment Numbers */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">أرقام الدفع (تظهر للطالب عند الدفع)</p>
                      <div className="space-y-1.5">
                        <Label className="text-xs">فودافون كاش</Label>
                        <Input value={vodafoneCash} onChange={(e) => setVodafoneCash(e.target.value)} placeholder="01012345678" dir="ltr" className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">إنستا باي</Label>
                        <Input value={instapay} onChange={(e) => setInstapay(e.target.value)} placeholder="@username" dir="ltr" className="font-mono text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">فوري</Label>
                        <Input value={fawry} onChange={(e) => setFawry(e.target.value)} placeholder="01098765432" dir="ltr" className="font-mono text-xs" />
                      </div>
                      <Button className="w-full" size="sm" onClick={async () => {
                        setPaymentSaving(true)
                        try {
                          const res = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment_vodafone_cash: vodafoneCash, payment_instapay: instapay, payment_fawry: fawry }) })
                          if (res.ok) {
                            const cfg = useAppStore.getState().siteConfig
                            useAppStore.getState().setSiteConfig({ ...cfg, payment_vodafone_cash: vodafoneCash, payment_instapay: instapay, payment_fawry: fawry })
                            toast.success('تم حفظ أرقام الدفع')
                          } else { toast.error('خطأ في الحفظ') }
                        } catch { toast.error('خطأ في الحفظ') }
                        setPaymentSaving(false)
                      }} disabled={paymentSaving}>
                        {paymentSaving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                        حفظ أرقام الدفع
                      </Button>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-semibold">رابط Hero Developer Portfolio</p>
                      <Input value={heroDevUrl} onChange={(e) => setHeroDevUrl(e.target.value)} placeholder="https://hero-developer-portfolio-11.vercel.app" dir="ltr" type="url" className="font-mono text-xs" />
                      <p className="text-[10px] text-muted-foreground">الرابط يظهر في الهيدر والفوتر. غيّره في أي وقت وبيتنعكس فوراً.</p>
                      <Button className="w-full" size="sm" variant="outline" onClick={async () => {
                        setHeroDevSaving(true)
                        try {
                          const res = await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ hero_developer_url: heroDevUrl }) })
                          if (res.ok) {
                            const cfg = useAppStore.getState().siteConfig
                            useAppStore.getState().setSiteConfig({ ...cfg, hero_developer_url: heroDevUrl })
                            toast.success('تم حفظ الرابط')
                          } else { toast.error('خطأ في الحفظ') }
                        } catch { toast.error('خطأ في الحفظ') }
                        setHeroDevSaving(false)
                      }} disabled={heroDevSaving}>
                        {heroDevSaving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                        حفظ الرابط
                      </Button>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-semibold">مفتاح Resend API للإيميلات</p>
                      <Input value={resendApiKey} onChange={(e) => setResendApiKey(e.target.value)} placeholder="re_xxxxxxxxxxxx" dir="ltr" type="password" className="font-mono text-xs" />
                      <p className="text-[10px] text-muted-foreground">يُستخدم لإرسال إشعارات بالبريد للطلاب. احصل عليه من resend.com</p>
                      <Button className="w-full" size="sm" variant="outline" onClick={async () => {
                        setResendSaving(true)
                        try {
                          await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resend_api_key: resendApiKey }) })
                          toast.success('تم حفظ مفتاح Resend')
                        } catch { toast.error('خطأ في الحفظ') }
                        setResendSaving(false)
                      }} disabled={resendSaving}>
                        {resendSaving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                        حفظ المفتاح
                      </Button>
                    </div>
                  </div>

                  {/* ===== ACCOUNT SETTINGS (password required) ===== */}
                  <div className="rounded-lg border p-4 space-y-3">
                    <p className="text-xs font-bold text-destructive uppercase tracking-wider">إعدادات الحساب</p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">البريد الإلكتروني الجديد</Label>
                      <Input value={settingsEmail} onChange={(e) => setSettingsEmail(e.target.value)} placeholder="admin@example.com" dir="ltr" type="email" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">كلمة المرور الجديدة (اختياري)</Label>
                      <Input value={settingsNewPass} onChange={(e) => setSettingsNewPass(e.target.value)} placeholder="6 حروف على الأقل" type="password" />
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-[10px] text-destructive mb-2">تحذير: لتغيير الإيميل أو كلمة المرور، أدخل كلمة المرور الحالية:</p>
                      <div className="space-y-1.5">
                        <Label className="text-xs">كلمة المرور الحالية *</Label>
                        <Input value={settingsOldPass} onChange={(e) => setSettingsOldPass(e.target.value)} placeholder="أدخل كلمة المرور الحالية" type="password" className="border-destructive/30" />
                      </div>
                    </div>
                    <Button onClick={saveSettings} disabled={settingsSaving || !settingsOldPass} className="w-full">
                      {settingsSaving ? <Loader2 className="h-4 w-4 ml-1 animate-spin" /> : <Save className="h-4 w-4 ml-1" />}
                      {settingsSaving ? 'جاري الحفظ...' : 'حفظ تغييرات الحساب'}
                    </Button>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => { setShowSettings(false); setSettingsOldPass(''); setSettingsNewPass('') }}>إغلاق</Button>
                </div>
              )}
            </div>
          </div>
        )}

/* === END REPLACEMENT === */
