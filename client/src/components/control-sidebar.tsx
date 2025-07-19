import { useState, useEffect } from "react";
import { Settings, Play, Code, Download, Bolt, Plus, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAutomation } from "@/hooks/use-automation";

export default function ControlSidebar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { executeScript1, executeCustomScript, executeAllScripts } = useAutomation();

  const { data: config } = useQuery({
    queryKey: ["/api/config"],
  });

  const [localConfig, setLocalConfig] = useState({
    targetUrl: "http://bnsmb.de/files/public/Android/archive/scripts/",
    corsEnabled: true,
    autoExecute: true,
    customHeaders: "[]",
    customScript: "",
  });

  const [customHeaders, setCustomHeaders] = useState<{name: string; value: string}[]>([]);
  const [newHeaderName, setNewHeaderName] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");

  const updateConfigMutation = useMutation({
    mutationFn: async (newConfig: typeof localConfig) => {
      const response = await apiRequest("POST", "/api/config", newConfig);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config"] });
      toast({
        title: "Configuration Updated",
        description: "Settings have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update configuration.",
        variant: "destructive",
      });
    },
  });

  const addLogMutation = useMutation({
    mutationFn: async (log: { level: string; message: string }) => {
      const response = await apiRequest("POST", "/api/logs", log);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    },
  });

  // Initialize configuration from server config
  useEffect(() => {
    if (config) {
      setLocalConfig({
        targetUrl: config.targetUrl || "http://bnsmb.de/files/public/Android/archive/scripts/",
        corsEnabled: config.corsEnabled ?? true,
        autoExecute: config.autoExecute ?? true,
        customHeaders: config.customHeaders || "[]",
        customScript: config.customScript || "",
      });

      try {
        const headers = JSON.parse(config.customHeaders || "[]");
        setCustomHeaders(headers);
      } catch (e) {
        console.error('Failed to parse custom headers:', e);
        setCustomHeaders([]);
      }
    }
  }, [config]);

  const updateConfig = (newConfig: Partial<typeof localConfig>) => {
    const updatedConfig = { ...localConfig, ...newConfig };
    setLocalConfig(updatedConfig);
    updateConfigMutation.mutate(updatedConfig);
  };

  const handleUrlChange = (url: string) => {
    updateConfig({ targetUrl: url });
  };

  const addCustomHeader = () => {
    if (newHeaderName.trim() && newHeaderValue.trim()) {
      const newHeaders = [...customHeaders, { name: newHeaderName.trim(), value: newHeaderValue.trim() }];
      setCustomHeaders(newHeaders);
      updateConfig({ customHeaders: JSON.stringify(newHeaders) });
      setNewHeaderName("");
      setNewHeaderValue("");
      
      addLogMutation.mutate({
        level: "info",
        message: `Added custom header: ${newHeaderName} = ${newHeaderValue}`
      });
    }
  };

  const removeCustomHeader = (index: number) => {
    const newHeaders = customHeaders.filter((_, i) => i !== index);
    setCustomHeaders(newHeaders);
    updateConfig({ customHeaders: JSON.stringify(newHeaders) });
    
    addLogMutation.mutate({
      level: "info", 
      message: `Removed custom header: ${customHeaders[index].name}`
    });
  };

  const handleCustomScriptChange = (script: string) => {
    updateConfig({ customScript: script });
  };

  const handleEmbedWebsite = () => {
    addLogMutation.mutate({
      level: "info",
      message: `Starting website embedding process for: ${localConfig.targetUrl}`
    });
    
    // Trigger iframe reload
    const iframe = document.getElementById('embeddedSite') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = `/api/proxy?url=${encodeURIComponent(localConfig.targetUrl)}`;
    }
  };

  return (
    <aside className="w-80 bg-white shadow-lg border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        {/* Configuration Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="text-blue-600 mr-2 h-5 w-5" />
            Configuration
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Target Website URL
              </Label>
              <div className="relative">
                <Input
                  type="url"
                  value={localConfig.targetUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="pr-8 font-mono text-sm"
                />
                <ExternalLink className="absolute right-3 top-3 h-3 w-3 text-gray-400" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                HTTP Headers
              </Label>
              <div className="space-y-2">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">Content-Disposition</span>
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Sub-URLs Only</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono">Access-Control-Allow-Origin</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Custom Headers */}
                {customHeaders.map((header, index) => (
                  <Card key={index}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono">{header.name}: {header.value}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeCustomHeader(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Add New Header Form */}
                <div className="space-y-2 p-2 bg-gray-50 rounded">
                  <Input
                    placeholder="Header Name"
                    value={newHeaderName}
                    onChange={(e) => setNewHeaderName(e.target.value)}
                    className="text-xs"
                  />
                  <Input
                    placeholder="Header Value"
                    value={newHeaderValue}
                    onChange={(e) => setNewHeaderValue(e.target.value)}
                    className="text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={addCustomHeader}
                    disabled={!newHeaderName.trim() || !newHeaderValue.trim()}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Custom Header
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cors"
                  checked={localConfig.corsEnabled}
                  onCheckedChange={(checked) => 
                    updateConfig({ corsEnabled: !!checked })
                  }
                />
                <Label htmlFor="cors" className="text-sm text-gray-700">
                  Enable CORS Handling
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="autoExecute"
                  checked={localConfig.autoExecute}
                  onCheckedChange={(checked) => 
                    updateConfig({ autoExecute: !!checked })
                  }
                />
                <Label htmlFor="autoExecute" className="text-sm text-gray-700">
                  Auto-execute Custom Script
                </Label>
              </div>
            </div>

            {/* Custom Script Section */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Custom JavaScript (executed after page load)
              </Label>
              <Textarea
                value={localConfig.customScript}
                onChange={(e) => handleCustomScriptChange(e.target.value)}
                placeholder="Enter custom JavaScript code here..."
                className="font-mono text-xs h-24 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Script will auto-execute if enabled above, or run manually via button
              </p>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Play className="text-green-600 mr-2 h-5 w-5" />
            Actions
          </h2>
          
          <div className="space-y-3">
            <Button
              onClick={handleEmbedWebsite}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Embed Website
            </Button>

            <Button
              onClick={executeScript1}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Execute Download Script (Manual)
            </Button>

            <Button
              onClick={executeCustomScript}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              <Code className="mr-2 h-4 w-4" />
              Execute Custom Script
            </Button>

            <Button
              onClick={executeAllScripts}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              <Bolt className="mr-2 h-4 w-4" />
              Execute All Scripts
            </Button>
          </div>
        </div>

        {/* Script Preview */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Code className="text-gray-600 mr-2 h-4 w-4" />
            Download Script (Auto-executes on page load)
          </h3>
          
          <div className="space-y-3">
            <Card>
              <CardContent className="p-3">
                <div className="bg-gray-900 rounded-md p-3 text-xs font-mono overflow-x-auto">
                  <div className="text-green-400 mb-1">// Auto Download Script</div>
                  <div className="text-gray-300">
                    download_all = document.querySelectorAll(<br />
                    &nbsp;&nbsp;"body {'>'} table {'>'} tbody {'>'} tr td a"<br />
                    );<br />
                    for (let i=1; i&lt;download_all.length; i++) &#123;<br />
                    &nbsp;&nbsp;download_all[i].download = download_all[i].textContent;<br />
                    &nbsp;&nbsp;download_all[i].click();<br />
                    &#125;
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              ⚡ This script runs automatically when the embedded page finishes loading
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
