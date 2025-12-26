import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X, Download, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadModal({ open, onClose }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx, .xls) or CSV",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xlsx, .xls) or CSV",
          variant: "destructive",
        });
        e.target.value = '';
      }
    }
  };

  const downloadTemplate = () => {
    toast({
      title: "Template Instructions",
      description: "Create an Excel file with 4 sheets as shown below",
      duration: 5000,
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    console.log("=== FRONTEND UPLOAD START ===", selectedFile?.name);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log("[UploadModal] Sending POST to /api/upload-csv");
      const res = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let message = 'Failed to upload file';
        try {
          const errorData = await res.json();
          message = errorData.details || errorData.error || message;
        } catch {}
        throw new Error(message);
      }

      const result = await res.json();

      const warningText = Array.isArray(result.warnings) && result.warnings.length > 0 ? ` • ${result.warnings.join(' • ')}` : '';
      const successMessage = `Processed ${result.summary.teachers} teachers, ${result.summary.studentGroups} student groups, and ${result.summary.lessons} lessons. Solver started.${warningText}`;
      
      toast({
        title: "Upload successful",
        description: successMessage,
      });

      const jobId: string | undefined = result.jobId;
      if (jobId) {
        try { localStorage.setItem('lastJobId', jobId); } catch {}
        // Poll backend status for up to ~60s and refresh classes when solve completes
        for (let i = 0; i < 60; i++) {
          await new Promise(r => setTimeout(r, 1000));
          try {
            const statusRes = await fetch(`/api/solution/status?jobId=${encodeURIComponent(jobId)}`, { method: 'GET' });
            if (statusRes.ok) {
              const status = await statusRes.json();
              if (String(status?.solverStatus) === 'NOT_SOLVING') {
                await queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
                await queryClient.invalidateQueries({ queryKey: ['/api/classes/enriched'] });
                try { localStorage.removeItem('lastJobId'); } catch {}
                toast({ 
                  title: 'Schedule generated', 
                  description: `Solver completed. ${result.summary.lessons} lessons scheduled.` 
                });
                break;
              }
            }
          } catch {}
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });

      setSelectedFile(null);
      onClose();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-upload">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Timetable Data
          </DialogTitle>
          <DialogDescription>
            Upload an Excel file with 4 sheets: Timeslots, Room, Lesson, TeacherAvailability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-primary bg-primary/5' : 'border-border'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            data-testid="dropzone-upload"
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={handleChange}
              data-testid="input-file"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <FileSpreadsheet className="h-12 w-12 mx-auto text-primary" />
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium truncate max-w-xs">{selectedFile.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setSelectedFile(null)}
                    data-testid="button-remove-file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">
                  Drop your Excel file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports Excel files (.xlsx, .xls)
                </p>
              </label>
            )}
          </div>

          <Alert className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="mb-2 font-medium">4-Sheet Excel Template Structure:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-xs mb-1">1. Timeslots Sheet</p>
                  <p className="text-xs text-muted-foreground">DayOfWeek, StartTime, EndTime</p>
                  <p className="text-xs text-muted-foreground mt-1">Example: MONDAY, 08:00:00, 09:00:00</p>
                </div>
                <div>
                  <p className="font-semibold text-xs mb-1">2. Room Sheet</p>
                  <p className="text-xs text-muted-foreground">Name, Link (optional)</p>
                  <p className="text-xs text-muted-foreground mt-1">Example: Science Lab, https://meet.google.com/...</p>
                </div>
                <div>
                  <p className="font-semibold text-xs mb-1">3. Lesson Sheet</p>
                  <p className="text-xs text-muted-foreground">Id, Subject, Teacher, StudentGroup</p>
                  <p className="text-xs text-muted-foreground mt-1">Note: No MeetingLink column needed</p>
                </div>
                <div>
                  <p className="font-semibold text-xs mb-1">4. TeacherAvailability Sheet</p>
                  <p className="text-xs text-muted-foreground">Teacher, DayOfWeek, PreferredStart, PreferredEnd</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">Important Notes:</p>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <li>• Meeting links should be in Room sheet, NOT in Lesson sheet</li>
              <li>• Timeslots should cover your school hours (e.g., 8 AM - 5 PM)</li>
              <li>• Teacher names must match exactly across Lesson and TeacherAvailability sheets</li>
              <li>• All times in 24-hour format (HH:MM:SS)</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="gap-2"
            size="sm"
          >
            <Download className="h-4 w-4" />
            View Template Structure
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isUploading}
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || isUploading}
              data-testid="button-process-schedule"
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Process & Schedule
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}