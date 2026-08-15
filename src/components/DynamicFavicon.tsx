'use client'

import { useAppStore } from '@/stores/app-store'
import { useEffect } from 'react'

var DEFAULT_FAVICON = 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg'

export function DynamicFavicon() {
  var { siteConfig, configLoaded, setSiteConfig } = useAppStore()

  // On first mount, read injected config (instant — no API call)
  useEffect(function() {
    if (!configLoaded) {
      var injected = (window as any).__INITIAL_CONFIG__
      if (injected && Object.keys(injected).length > 0) {
        setSiteConfig(injected)
        useAppStore.getState().setConfigLoaded(true)
      }
    }
  }, [])

  // Update favicon when config changes (for live admin updates)
  useEffect(function() {
    var url = siteConfig.favicon_url || DEFAULT_FAVICON
    var link = document.querySelector("link[rel='icon']") as HTMLLinkElement
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = url
  }, [siteConfig.favicon_url, configLoaded])

  return null
}
