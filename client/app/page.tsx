"use client";

import { useState, useEffect, useCallback } from "react";
import { ClassPilotSidebar } from "@/components/sidebar/classpilot-sidebar";
import { LectureView } from "@/components/lecture/lecture-view";
import { Dashboard } from "@/components/dashboard/dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
import { SettingsModal } from "@/components/settings";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MenuIcon, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLectureStore } from "@/store/lecture-store";
import { Toaster, toast } from "sonner";

type View = "dashboard" | "lecture";

export default function ClassPilotApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>("lecture");

  const { currentLectureId, recording } = useLectureStore();

  const handleStartLecture = () => {
    setCurrentView("lecture");
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger if user is typing in an input/textarea
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return;
    }

    const store = useLectureStore.getState();

    switch (event.key.toLowerCase()) {
      case " ": // Space - Start/Pause recording
        event.preventDefault();
        if (store.recording.isRecording) {
          if (store.recording.isPaused) {
            store.resumeRecording();
            toast.info("Recording resumed");
          } else {
            store.pauseRecording();
            toast.info("Recording paused");
          }
        } else if (store.getCurrentLecture()) {
          store.startRecording();
          toast.info("Recording started");
        }
        break;

      case "escape": // Esc - Stop recording
        if (store.recording.isRecording) {
          store.stopRecording();
          toast.info("Recording stopped");
        }
        break;

      case "n": // N - New note (if in lecture view)
        if (currentView === "lecture" && store.getCurrentLecture()) {
          // Focus will be handled by the notes panel
          toast.info("Press the Notes tab to add a note");
        }
        break;

      case "d": // D - Dashboard
        setCurrentView("dashboard");
        break;

      case "l": // L - Lecture view
        setCurrentView("lecture");
        break;

      case "/": // / - Open search (future)
        event.preventDefault();
        toast.info("Search coming soon!");
        break;
    }
  }, [currentView]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden md:block w-72 border-r border-border flex-shrink-0">
          <ClassPilotSidebar />
        </div>

        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent
            side="left"
            className="w-72 p-0 border-none [&>button]:hidden"
          >
            <ClassPilotSidebar />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex md:hidden items-center justify-between border-b border-border px-4 h-14 bg-background z-20">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSidebarOpen(true)}
            >
              <MenuIcon className="size-5" />
            </Button>

            <span className="font-semibold">ClassPilot AI</span>

            <div className="flex items-center gap-1">
              <SettingsModal />
              <ThemeToggle />
            </div>
          </div>

          <div className="hidden md:flex absolute top-4 right-4 gap-2 z-20">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <HelpCircle className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs space-y-1">
                  <p className="font-medium mb-2">Keyboard Shortcuts</p>
                  <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Space</kbd> Start/Pause Recording</p>
                  <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Stop Recording</p>
                  <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">D</kbd> Dashboard</p>
                  <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">L</kbd> Lecture View</p>
                  <p><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">/</kbd> Search</p>
                </div>
              </TooltipContent>
            </Tooltip>
            <SettingsModal />
            <ThemeToggle />
          </div>

          <div className="flex-1 overflow-hidden">
            {currentView === "dashboard" && (
              <Dashboard onStartLecture={handleStartLecture} />
            )}
            {currentView === "lecture" && <LectureView />}
          </div>
        </div>
      </div>
      <Toaster position="bottom-right" richColors />
    </TooltipProvider>
  );
}
