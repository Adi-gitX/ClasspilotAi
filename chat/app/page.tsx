"use client";

import { useState } from "react";
import { ClassPilotSidebar } from "@/components/sidebar/classpilot-sidebar";
import { LectureView } from "@/components/lecture/lecture-view";
import { Dashboard } from "@/components/dashboard/dashboard";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { Toaster } from "sonner";

type View = "dashboard" | "lecture";

export default function ClassPilotApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<View>("lecture");

  const { currentLectureId } = useLectureStore();

  const handleStartLecture = () => {
    setCurrentView("lecture");
  };

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
                  <p className="font-medium">Keyboard Shortcuts</p>
                  <p><kbd className="px-1 bg-muted rounded">Space</kbd> Start/Pause</p>
                  <p><kbd className="px-1 bg-muted rounded">Esc</kbd> Stop Recording</p>
                  <p><kbd className="px-1 bg-muted rounded">N</kbd> New Note</p>
                </div>
              </TooltipContent>
            </Tooltip>
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
