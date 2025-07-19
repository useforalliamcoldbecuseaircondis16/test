import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAutomation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addLogMutation = useMutation({
    mutationFn: async (log: { level: string; message: string }) => {
      const response = await apiRequest("POST", "/api/logs", log);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    },
  });

  const executeScript1 = () => {
    const iframe = document.getElementById('embeddedSite') as HTMLIFrameElement;
    
    if (!iframe || !iframe.contentWindow) {
      addLogMutation.mutate({
        level: "warning",
        message: "Please embed website first before executing scripts"
      });
      toast({
        title: "Warning",
        description: "Please embed website first before executing scripts",
        variant: "destructive",
      });
      return;
    }

    addLogMutation.mutate({
      level: "info",
      message: "Executing Script 1: Setting download attributes and triggering downloads..."
    });

    try {
      iframe.contentWindow.postMessage({ type: 'execute-script-1' }, '*');
      
      setTimeout(() => {
        addLogMutation.mutate({
          level: "success",
          message: "Script 1 executed successfully"
        });
        toast({
          title: "Script 1 Executed",
          description: "Download attributes set and files downloaded",
        });
      }, 1000);
    } catch (error) {
      addLogMutation.mutate({
        level: "error",
        message: `Script 1 execution failed: ${error.message}`
      });
      toast({
        title: "Script 1 Failed",
        description: "Failed to execute Script 1",
        variant: "destructive",
      });
    }
  };

  const executeCustomScript = () => {
    const iframe = document.getElementById('embeddedSite') as HTMLIFrameElement;
    
    if (!iframe || !iframe.contentWindow) {
      addLogMutation.mutate({
        level: "warning",
        message: "Please embed website first before executing custom script"
      });
      toast({
        title: "Warning",
        description: "Please embed website first before executing custom script",
        variant: "destructive",
      });
      return;
    }

    addLogMutation.mutate({
      level: "info",
      message: "Executing custom script..."
    });

    try {
      iframe.contentWindow.postMessage({ type: 'execute-custom-script' }, '*');
      
      setTimeout(() => {
        addLogMutation.mutate({
          level: "success",
          message: "Custom script executed successfully"
        });
        toast({
          title: "Custom Script Executed",
          description: "Your custom JavaScript code has been executed",
        });
      }, 1000);
    } catch (error) {
      addLogMutation.mutate({
        level: "error",
        message: `Custom script execution failed: ${error.message}`
      });
      toast({
        title: "Custom Script Failed",
        description: "Failed to execute custom script",
        variant: "destructive",
      });
    }
  };

  const executeAllScripts = () => {
    addLogMutation.mutate({
      level: "info",
      message: "Executing all scripts sequentially..."
    });

    executeScript1();
    
    setTimeout(() => {
      executeCustomScript();
      setTimeout(() => {
        addLogMutation.mutate({
          level: "success",
          message: "All scripts executed successfully"
        });
        toast({
          title: "All Scripts Executed",
          description: "All automation scripts completed successfully",
        });
      }, 2000);
    }, 2000);
  };

  return {
    executeScript1,
    executeCustomScript,
    executeAllScripts,
  };
}
