import { Terminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LogsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logs = [] } = useQuery({
    queryKey: ["/api/logs"],
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/logs");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      toast({
        title: "Logs Cleared",
        description: "All logs have been cleared successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clear logs.",
        variant: "destructive",
      });
    },
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const getLogLevelClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'info':
        return 'log-info';
      case 'success':
        return 'log-success';
      case 'warning':
        return 'log-warning';
      case 'error':
        return 'log-error';
      default:
        return 'log-info';
    }
  };

  return (
    <div className="bg-white mx-4 mb-4 rounded-lg shadow-sm border border-gray-200 h-64">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center">
          <Terminal className="text-gray-600 mr-2 h-4 w-4" />
          System Logs & Status
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
            Connected
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearLogsMutation.mutate()}
            className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear Logs
          </Button>
        </div>
      </div>
      
      <div className="p-4 h-48 overflow-y-auto logs-terminal">
        <div className="space-y-1">
          {logs.length > 0 ? (
            logs.map((log: any) => (
              <div key={log.id} className="flex items-start space-x-2 text-xs">
                <span className="log-timestamp">
                  [{formatTimestamp(log.timestamp)}]
                </span>
                <span className={getLogLevelClass(log.level)}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-gray-300">{log.message}</span>
              </div>
            ))
          ) : (
            <div className="text-gray-500">
              <span className="animate-pulse">Waiting for system events...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
