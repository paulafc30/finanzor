// vite.config.js
import { defineConfig } from "file:///sessions/wonderful-admiring-ptolemy/mnt/Finanzor/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/wonderful-admiring-ptolemy/mnt/Finanzor/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///sessions/wonderful-admiring-ptolemy/mnt/Finanzor/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Usamos nuestro propio manifest.webmanifest en /public
      manifest: false,
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-192-maskable.png",
        "icon-512.png",
        "icon-512-maskable.png",
        "manifest.webmanifest",
        ".well-known/assetlinks.json"
      ],
      workbox: {
        // Cachear los assets generados por Vite + nuestros estáticos
        globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
        // Las llamadas a Supabase NO se cachean (siempre frescas)
        navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkOnly"
          }
        ]
      },
      devOptions: {
        // En dev no registramos SW para no marear con cachés viejas
        enabled: false
      }
    })
  ],
  server: {
    port: 5173,
    open: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvd29uZGVyZnVsLWFkbWlyaW5nLXB0b2xlbXkvbW50L0ZpbmFuem9yXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvd29uZGVyZnVsLWFkbWlyaW5nLXB0b2xlbXkvbW50L0ZpbmFuem9yL3ZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy93b25kZXJmdWwtYWRtaXJpbmctcHRvbGVteS9tbnQvRmluYW56b3Ivdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgVml0ZVBXQSh7XG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcbiAgICAgIC8vIFVzYW1vcyBudWVzdHJvIHByb3BpbyBtYW5pZmVzdC53ZWJtYW5pZmVzdCBlbiAvcHVibGljXG4gICAgICBtYW5pZmVzdDogZmFsc2UsXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbXG4gICAgICAgICdmYXZpY29uLmljbycsXG4gICAgICAgICdhcHBsZS10b3VjaC1pY29uLnBuZycsXG4gICAgICAgICdpY29uLTE5Mi5wbmcnLFxuICAgICAgICAnaWNvbi0xOTItbWFza2FibGUucG5nJyxcbiAgICAgICAgJ2ljb24tNTEyLnBuZycsXG4gICAgICAgICdpY29uLTUxMi1tYXNrYWJsZS5wbmcnLFxuICAgICAgICAnbWFuaWZlc3Qud2VibWFuaWZlc3QnLFxuICAgICAgICAnLndlbGwta25vd24vYXNzZXRsaW5rcy5qc29uJyxcbiAgICAgIF0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIC8vIENhY2hlYXIgbG9zIGFzc2V0cyBnZW5lcmFkb3MgcG9yIFZpdGUgKyBudWVzdHJvcyBlc3RcdTAwRTF0aWNvc1xuICAgICAgICBnbG9iUGF0dGVybnM6IFsnKiovKi57anMsY3NzLGh0bWwsc3ZnLHBuZyx3ZWJtYW5pZmVzdH0nXSxcbiAgICAgICAgLy8gTGFzIGxsYW1hZGFzIGEgU3VwYWJhc2UgTk8gc2UgY2FjaGVhbiAoc2llbXByZSBmcmVzY2FzKVxuICAgICAgICBuYXZpZ2F0ZUZhbGxiYWNrRGVueWxpc3Q6IFsvXlxcL2FwaS8sIC9zdXBhYmFzZVxcLmNvL10sXG4gICAgICAgIHJ1bnRpbWVDYWNoaW5nOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC8uKi9pLFxuICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtPbmx5JyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIGRldk9wdGlvbnM6IHtcbiAgICAgICAgLy8gRW4gZGV2IG5vIHJlZ2lzdHJhbW9zIFNXIHBhcmEgbm8gbWFyZWFyIGNvbiBjYWNoXHUwMEU5cyB2aWVqYXNcbiAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIG9wZW46IGZhbHNlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXFVLFNBQVMsb0JBQW9CO0FBQ2xXLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sY0FBYztBQUFBO0FBQUEsTUFFZCxVQUFVO0FBQUEsTUFDVixlQUFlO0FBQUEsUUFDYjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTO0FBQUE7QUFBQSxRQUVQLGNBQWMsQ0FBQyx3Q0FBd0M7QUFBQTtBQUFBLFFBRXZELDBCQUEwQixDQUFDLFVBQVUsY0FBYztBQUFBLFFBQ25ELGdCQUFnQjtBQUFBLFVBQ2Q7QUFBQSxZQUNFLFlBQVk7QUFBQSxZQUNaLFNBQVM7QUFBQSxVQUNYO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVk7QUFBQTtBQUFBLFFBRVYsU0FBUztBQUFBLE1BQ1g7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
