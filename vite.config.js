/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { ideTraceVue } from 'chrome-ide-trace/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { versionInfoUtil } from '../../common/utils/versionInfoUtil'
import { commonEnvPlugin } from '../../common/vite/commonEnvPlugin'
import { localApiServerDiscoveryPlugin } from '../../common/vite/localApiServerDiscoveryPlugin'
import pkg from './package.json'
import manifest from './manifest.json'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appBuild = JSON.parse(env.VITE_APP_VERSION_CONFIG).buildVersion
  return {
  // A version build (buildVersion vX.Y.Z in VITE_APP_VERSION_CONFIG) is self-contained under /vX.Y.Z/; an empty buildVersion is the root bootstrap.
  base: appBuild ? `/${appBuild}/` : '/',
  build: {
    outDir: appBuild ? `dist/${appBuild}` : 'dist'
  },
  plugins: [
    commonEnvPlugin(),
    ideTraceVue(),
    vue(),
    legacy(),
    localApiServerDiscoveryPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      selfDestroying: true,
      manifest: manifest,
      devOptions: {
        enabled: true
      }
    })
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION_INFO': JSON.stringify(JSON.stringify(versionInfoUtil.getVersionInfo(pkg.version)))
  },
  resolve: {
    dedupe: ['vue', 'vue-router', '@ionic/vue', '@ionic/vue-router', 'pinia', 'vue-i18n'],
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.mts', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@common': path.resolve(__dirname, '../../common')
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // The shared code this app depends on has no suite of its own, so its specs run here:
    // the footer component this app's menu renders, and common/core (the logger's redaction
    // hook). A change to common/ that breaks this app is caught by this app's suite.
    include: [
      'tests/**/*.spec.ts',
      'tests/**/*.test.ts',
      '../../common/components/**/*.spec.ts',
      '../../common/core/**/*.spec.ts'
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', '.claude'],
    setupFiles: ['tests/setup/i18n.ts']
  }
  }
})
