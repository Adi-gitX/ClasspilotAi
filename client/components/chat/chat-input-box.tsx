import {
  PaperclipIcon,
  CircleDashedIcon,
  SparklesIcon,
  ChevronDownIcon,
  CheckIcon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClassPilotLogo } from "@/components/ui/classpilot-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const aiModels = [
  { id: "classpilot", label: "ClassPilot AI", icon: SparklesIcon },
  { id: "classpilot-fast", label: "ClassPilot Fast", icon: SparklesIcon },
  { id: "classpilot-pro", label: "ClassPilot Pro", icon: SparklesIcon },
];

interface ChatInputBoxProps {
  message: string;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  showTools?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export function ChatInputBox({
  message,
  onMessageChange,
  onSend,
  selectedModel,
  onModelChange,
  showTools = true,
  placeholder = "Ask anything...",
  isLoading = false,
}: ChatInputBoxProps) {
  return (
    <div className="rounded-2xl border border-border bg-secondary dark:bg-card p-1">
      <div className="rounded-xl border border-border dark:border-transparent bg-card dark:bg-secondary">
        <Textarea
          placeholder={placeholder}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          disabled={isLoading}
          className="min-h-[120px] resize-none border-0 bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isLoading) {
              e.preventDefault();
              onSend();
            }
          }}
        />

        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 rounded-full border border-border dark:border-input bg-card dark:bg-secondary hover:bg-accent"
              disabled={isLoading}
            >
              <PaperclipIcon className="size-4 text-muted-foreground" />
            </Button>
            {showTools && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-7 rounded-full border border-border dark:border-input bg-card dark:bg-secondary hover:bg-accent px-3"
                  disabled={isLoading}
                >
                  <CircleDashedIcon className="size-4 text-muted-foreground" />
                  <span className="hidden sm:inline text-sm text-muted-foreground/70">
                    Deep Search
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-7 rounded-full border border-border dark:border-input bg-card dark:bg-secondary hover:bg-accent px-3"
                  disabled={isLoading}
                >
                  <SparklesIcon className="size-4 text-muted-foreground" />
                  <span className="hidden sm:inline text-sm text-muted-foreground/70">
                    Think
                  </span>
                </Button>
              </>
            )}
          </div>

          {showTools ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isLoading}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 h-5 px-0 hover:bg-transparent"
                  >
                    <ClassPilotLogo className="scale-75" />
                    <span className="hidden sm:inline text-sm text-foreground dark:text-muted-foreground">
                      {aiModels.find((m) => m.id === selectedModel)?.label || "ClassPilot AI"}
                    </span>
                    <ChevronDownIcon className="size-4 text-foreground dark:text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {aiModels.map((model) => {
                    const ModelIcon = model.icon;
                    const isSelected = selectedModel === model.id;
                    return (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => onModelChange(model.id)}
                        className="gap-2"
                      >
                        <ModelIcon className="size-4" />
                        <span className="flex-1">{model.label}</span>
                        {isSelected && <CheckIcon className="size-4" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                onClick={onSend}
                disabled={isLoading || !message.trim()}
                className="h-7 px-4"
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="size-3 animate-spin mr-1" />
                    Thinking...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onSend}
              disabled={isLoading || !message.trim()}
              className="h-7 px-4"
            >
              {isLoading ? (
                <>
                  <Loader2Icon className="size-3 animate-spin mr-1" />
                  Thinking...
                </>
              ) : (
                "Send"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
