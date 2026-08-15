'use client'

import { useAppStore } from '@/stores/app-store'
import { useEffect } from 'react'

var DEFAULT_FAVICON = 'https://z-cdn.chatglm.cn/z-ai/static/logo.svg'

export function DynamicFavicon() {
  var { siteConfig, configLoaded } = useAppStore()

  useEffect(function() {
    if (!configLoaded) {
      fetch('/api/config')
        .then(function(r) { return r.json() })
        .then(function(data) {
          useAppStore.getState().setSiteConfig(data)
          useAppStore.getState().setConfigLoaded(true)
        })
        .catch(function() {})
    }
  }, [configLoaded])

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
