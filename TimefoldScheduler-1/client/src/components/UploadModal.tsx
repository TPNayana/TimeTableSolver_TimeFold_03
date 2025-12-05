import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    console.log("=== FRONTEND UPLOAD START ===", selectedFile?.name);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const result = await res.json();

      const warningText = Array.isArray(result.warnings) && result.warnings.length > 0 ? ` • ${result.warnings.join(' • ')}` : '';
      toast({
        title: "Upload successful",
        description: `Processed ${result.summary.teachers} teachers, ${result.summary.courses} courses, and ${result.summary.studentGroups} student groups. Starting solver...${warningText}`,
      });

      const jobId: string | undefined = result.jobId;
      if (jobId) {
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
                toast({ title: 'Schedule generated', description: 'Solver completed and schedule has been updated.' });
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
      <DialogContent data-testid="modal-upload">
        <DialogHeader>
          <DialogTitle>Upload Timetable Data</DialogTitle>
          <DialogDescription>
            Upload an Excel file with sheets: Timeslots, Room, Lesson. Optional: TeacherAvailability.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`border-2 border-dashed rounded-md p-8 text-center transition-colors ${
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
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
            data-testid="input-file"
          />
          
          {selectedFile ? (
            <div className="space-y-2">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-primary" />
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium">{selectedFile.name}</span>
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
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Drop your file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports CSV, XLSX, XLS files
              </p>
            </label>
          )}
        </div>

        <div className="bg-muted/50 p-4 rounded-md">
          <p className="text-xs font-medium mb-2">Required columns:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Timeslots: DayOfWeek, StartTime, EndTime</li>
            <li>• Room: Name</li>
            <li>• Lesson: Id, Subject, Teacher, StudentGroup</li>
            <li>• TeacherAvailability (optional): Teacher, DayOfWeek, StartTime, EndTime</li>
          </ul>
        </div>

        <DialogFooter>
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
          >
            {isUploading ? "Uploading..." : "Process & Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
