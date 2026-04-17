// vite.config.ts
import { defineConfig } from "file:///E:/UPH/task%20manager/Task-Manager-website/node_modules/vite/dist/node/index.js";
import react from "file:///E:/UPH/task%20manager/Task-Manager-website/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///E:/UPH/task%20manager/Task-Manager-website/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "E:\\UPH\\task manager\\Task-Manager-website";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
            "@radix-ui/react-toast"
          ],
          "vendor-charts": ["recharts"],
          "vendor-motion": ["framer-motion"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"]
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxVUEhcXFxcdGFzayBtYW5hZ2VyXFxcXFRhc2stTWFuYWdlci13ZWJzaXRlXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxVUEhcXFxcdGFzayBtYW5hZ2VyXFxcXFRhc2stTWFuYWdlci13ZWJzaXRlXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9VUEgvdGFzayUyMG1hbmFnZXIvVGFzay1NYW5hZ2VyLXdlYnNpdGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xyXG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiBcIjo6XCIsXHJcbiAgICBwb3J0OiA4MDgwLFxyXG4gICAgaG1yOiB7XHJcbiAgICAgIG92ZXJsYXk6IGZhbHNlLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIHBsdWdpbnM6IFtyZWFjdCgpLCBtb2RlID09PSBcImRldmVsb3BtZW50XCIgJiYgY29tcG9uZW50VGFnZ2VyKCldLmZpbHRlcihCb29sZWFuKSxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBidWlsZDoge1xyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBvdXRwdXQ6IHtcclxuICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgIFwidmVuZG9yLXJlYWN0XCI6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCIsIFwicmVhY3Qtcm91dGVyLWRvbVwiXSxcclxuICAgICAgICAgIFwidmVuZG9yLXF1ZXJ5XCI6IFtcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiXSxcclxuICAgICAgICAgIFwidmVuZG9yLXVpXCI6IFtcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZGlhbG9nXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnVcIixcclxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdGFic1wiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b29sdGlwXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXNlbGVjdFwiLFxyXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1wb3BvdmVyXCIsXHJcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvYXN0XCIsXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgXCJ2ZW5kb3ItY2hhcnRzXCI6IFtcInJlY2hhcnRzXCJdLFxyXG4gICAgICAgICAgXCJ2ZW5kb3ItbW90aW9uXCI6IFtcImZyYW1lci1tb3Rpb25cIl0sXHJcbiAgICAgICAgICBcInZlbmRvci1mb3Jtc1wiOiBbXCJyZWFjdC1ob29rLWZvcm1cIiwgXCJAaG9va2Zvcm0vcmVzb2x2ZXJzXCIsIFwiem9kXCJdLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA2MDAsXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW9ULFNBQVMsb0JBQW9CO0FBQ2pWLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFIaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsSUFDWDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxpQkFBaUIsZ0JBQWdCLENBQUMsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUM5RSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUEsUUFDTixjQUFjO0FBQUEsVUFDWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsVUFDekQsZ0JBQWdCLENBQUMsdUJBQXVCO0FBQUEsVUFDeEMsYUFBYTtBQUFBLFlBQ1g7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSxpQkFBaUIsQ0FBQyxVQUFVO0FBQUEsVUFDNUIsaUJBQWlCLENBQUMsZUFBZTtBQUFBLFVBQ2pDLGdCQUFnQixDQUFDLG1CQUFtQix1QkFBdUIsS0FBSztBQUFBLFFBQ2xFO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
