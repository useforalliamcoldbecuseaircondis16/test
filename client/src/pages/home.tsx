import { useState, useEffect } from "react";
import { Download, Globe, PlayCircle } from "lucide-react";
import ControlSidebar from "@/components/control-sidebar";
import EmbeddedWebsite from "@/components/embedded-website";
import LogsPanel from "@/components/logs-panel";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [serverStatus, setServerStatus] = useState("Connected");
  const [requestCount, setRequestCount] = useState(127);

  const { data: config } = useQuery({
    queryKey: ["/api/config"],
  });

  useEffect(() => {
    // Simulate periodic request count updates
    const interval = setInterval(() => {
      setRequestCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Download className="text-white h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Website Embedder & Download Automator
                </h1>
                <p className="text-sm text-gray-500">
                  Embed external websites and automate downloads with CORS handling
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full pulse-green"></div>
                <span className="text-sm text-gray-600">Server Running</span>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Port 5000
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <ControlSidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Embedded Website */}
          <EmbeddedWebsite />

          {/* Logs Panel */}
          <LogsPanel />
        </main>
      </div>

      {/* Status Bar */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Node.js v18.17.0</span>
            <span>Express v4.18.2</span>
            <span>Last Updated: 2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>HTTP Proxy Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{requestCount} requests</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
