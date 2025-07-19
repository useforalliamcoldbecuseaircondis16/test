import { useState, useEffect } from "react";
import { RotateCcw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function EmbeddedWebsite() {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState("");

  const { data: config } = useQuery({
    queryKey: ["/api/config"],
  });

  useEffect(() => {
    if (config?.targetUrl) {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(config.targetUrl)}`;
      setIframeUrl(proxyUrl);
    }
  }, [config]);

  useEffect(() => {
    // Listen for messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'script-success') {
        console.log(`Script ${event.data.script} executed successfully`);
        if (event.data.script === 1) {
          console.log('Auto-download script completed successfully');
        }
      } else if (event.data.type === 'script-error') {
        console.error(`Script ${event.data.script} failed:`, event.data.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    const iframe = document.getElementById('embeddedSite') as HTMLIFrameElement;
    if (iframe && iframeUrl) {
      iframe.src = iframeUrl + '&t=' + Date.now();
    }
  };

  const handleOpenInNewTab = () => {
    if (config?.targetUrl) {
      window.open(config.targetUrl, '_blank');
    }
  };

  return (
    <div className="flex-1 bg-white m-4 rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-gray-900">Embedded Website</h3>
          <span className="text-sm text-gray-500">
            {config?.targetUrl || "http://bnsmb.de/files/public/Android/archive/scripts/"}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="p-1"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenInNewTab}
            className="p-1"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="h-full bg-white relative">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading embedded website...</p>
              <p className="text-sm text-gray-500 mt-1">Handling CORS and setting up headers</p>
            </div>
          </div>
        )}
        
        {/* Embedded Content Area */}
        <iframe
          id="embeddedSite"
          src={iframeUrl}
          className="w-full h-full border-0 embedded-iframe"
          sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
          title="Embedded External Website"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}
