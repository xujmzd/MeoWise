import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Capacitor imports
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

// 环境变量配置（Vite 会自动替换）
const API_BASE_URL = import.meta.env.VITE_API_BACKEND_URL || '';
console.log('[MeoWise] API_BASE_URL:', API_BASE_URL);

// 运行时注入：如果在 Android 打包为 WebView 时，需要将后端 API 基础地址注入到全局变量
(function initApiBaseOverride() {
  const g = window as any;
  
  // 检测是否在 Capacitor/Android 环境中
  const isCapacitor = !!(g.Capacitor?.isNativePlatform?.() || g.Capacitor?.platform !== 'web');
  const isAndroidWebView = isCapacitor || (typeof g.android !== 'undefined');
  
  // 优先级别：
  // 1. window.__MEOWISE_API_BASE_URL（运行时注入，最优先）
  // 2. 环境变量 VITE_API_BACKEND_URL（构建时配置）
  // 3. 空（浏览器开发环境使用相对路径）
  let baseUrl: string | undefined = g.__MEOWISE_API_BASE_URL;
  
  // 如果未手动设置，使用环境变量
  if (!baseUrl && API_BASE_URL) {
    baseUrl = API_BASE_URL;
    console.log('[MeoWise] Using VITE_API_BACKEND_URL:', baseUrl);
  }
  
  // 如果仍未设置，则根据环境自动设置默认地址
  if (!baseUrl) {
    if (isCapacitor || isAndroidWebView) {
      // Android 模拟器：使用 10.0.2.2 访问主机 localhost
      baseUrl = g.__ANDROID_API_BASE_URL || 'http://10.0.2.2:8000';
      console.log('[MeoWise] Running in Capacitor/Android, using default API base URL:', baseUrl);
    }
    // 浏览器开发环境下保持相对路径（通过 Vite 代理）
  }
  
  // 如果没有配置 baseUrl，则不改变原有行为
  if (!baseUrl) return;
  
  console.log('[MeoWise] Final API base URL:', baseUrl);
  
  // 覆盖全局 fetch，以便在 Android 容器中统一前缀
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo, init?: RequestInit) => {
    // 处理字符串形式的路径
    if (typeof input === 'string' && input.startsWith('/api/')) {
      const url = baseUrl!.replace(/\/$/, '') + input;
      console.log('[MeoWise] Fetching:', url);
      return originalFetch(url, init);
    }
    // 处理 Request 对象
    if (typeof input !== 'string' && (input as any).url?.startsWith('/api/')) {
      const req = input as any;
      req.url = baseUrl!.replace(/\/$/, '') + '/' + req.url.replace(/^\/+/, '');
      console.log('[MeoWise] Fetching (Request):', req.url);
      return originalFetch(req, init);
    }
    return originalFetch(input, init);
  };
})();

// Initialize Capacitor plugins
async function initializeCapacitor() {
  if (Capacitor.isNativePlatform()) {
    try {
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Default });
      await StatusBar.setBackgroundColor({ color: '#fdf9f6' });
      
      // Hide splash screen after app is ready
      await SplashScreen.hide({
        fadeOutDuration: 300
      });
      
      console.log('[MeoWise] Capacitor initialized successfully');
    } catch (error) {
      console.error('[MeoWise] Error initializing Capacitor:', error);
    }
  }
}

// Render the app
const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Initialize Capacitor after render
initializeCapacitor();
