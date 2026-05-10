import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { messagesApi } from '@/db/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Send, MessageCircle, Paperclip, Camera, Image as ImageIcon,
  FileText, Video, X, Loader2, Download, Eye, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '@/types/types';

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: string;
  otherUserName: string;
}

const QUICK_MESSAGES = [
  "Are you coming?",
  "Waiting for you",
  "How much time will you take?",
  "I'm on my way",
  "Almost there",
  "Reached the location",
  "Please call me",
  "Running a bit late",
  "Thank you!",
];

// ── File size formatter ────────────────────────────────────────────────────
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Attachment Menu Item ───────────────────────────────────────────────────
function AttachOption({
  icon, label, color, bg, onClick,
}: { icon: React.ReactNode; label: string; color: string; bg: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-150 hover:scale-[1.02] active:scale-95 ${bg}`}
    >
      <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-background/80 shadow-sm ${color}`}>
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}

// ── Image Preview in Chat Bubble ───────────────────────────────────────────
function ImagePreview({ url, isOwn }: { url: string; isOwn: boolean }) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div
        className="relative cursor-pointer group rounded-lg overflow-hidden max-w-[240px]"
        onClick={() => setFullscreen(true)}
      >
        <img
          src={url}
          alt="Shared image"
          className="w-full h-auto rounded-lg object-cover max-h-[200px]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>

      {/* Fullscreen viewer */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            onClick={() => setFullscreen(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={url}
            alt="Full image"
            className="max-w-full max-h-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}

// ── Video Preview in Chat Bubble ───────────────────────────────────────────
function VideoPreview({ url }: { url: string }) {
  return (
    <div className="rounded-lg overflow-hidden max-w-[280px]">
      <video
        src={url}
        controls
        preload="metadata"
        className="w-full h-auto rounded-lg max-h-[200px]"
      />
    </div>
  );
}

// ── File Attachment in Chat Bubble ─────────────────────────────────────────
function FilePreview({ url, fileName, fileSize, isOwn }: {
  url: string; fileName: string | null; fileSize: number | null; isOwn: boolean;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
        isOwn
          ? 'border-primary-foreground/20 hover:bg-primary-foreground/10'
          : 'border-border hover:bg-muted/50'
      }`}
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isOwn ? 'bg-primary-foreground/20' : 'bg-primary/10'
      }`}>
        <FileText className={`h-5 w-5 ${isOwn ? 'text-primary-foreground' : 'text-primary'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isOwn ? 'text-primary-foreground' : ''}`}>
          {fileName || 'Document'}
        </p>
        {fileSize && (
          <p className={`text-xs ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      <Download className={`h-4 w-4 flex-shrink-0 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} />
    </a>
  );
}

// ── Upload Preview (before sending) ────────────────────────────────────────
function UploadPreview({
  file, type, onRemove, uploading,
}: { file: File; type: 'image' | 'video' | 'file'; onRemove: () => void; uploading: boolean }) {
  const previewUrl = type === 'image' || type === 'video' ? URL.createObjectURL(file) : null;

  return (
    <div className="relative mx-3 mb-2 p-3 bg-muted/50 rounded-xl border border-border animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-3">
        {type === 'image' && previewUrl ? (
          <img src={previewUrl} alt="Preview" className="h-16 w-16 rounded-lg object-cover" />
        ) : type === 'video' && previewUrl ? (
          <video src={previewUrl} className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
          {uploading && (
            <div className="flex items-center gap-1.5 mt-1">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="text-xs text-primary font-medium">Uploading...</span>
            </div>
          )}
        </div>
        {!uploading && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CHAT DIALOG COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function ChatDialog({ open, onOpenChange, taskId, otherUserName }: ChatDialogProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; type: 'image' | 'video' | 'file' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !taskId) return;

    loadMessages();

    const channel = messagesApi.subscribeToMessages(taskId, (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    return () => {
      messagesApi.unsubscribe(channel);
    };
  }, [open, taskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close attach menu when clicking outside
  useEffect(() => {
    if (!showAttachMenu) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-attach-menu]')) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('click', handler, { capture: true });
    return () => document.removeEventListener('click', handler, { capture: true });
  }, [showAttachMenu]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messagesApi.getMessages(taskId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // ── Text message ──────────────────────────────────────────────────────
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !user) return;

    try {
      setSending(true);
      await messagesApi.sendMessage(taskId, message.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleQuickMessage = (message: string) => {
    handleSendMessage(message);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // If there's a pending file, send it with the text as caption
    if (pendingFile) {
      handleSendMedia(pendingFile.file, pendingFile.type, newMessage.trim() || undefined);
      return;
    }

    handleSendMessage(newMessage);
  };

  // ── Media message ─────────────────────────────────────────────────────
  const handleSendMedia = async (file: File, type: 'image' | 'video' | 'file', caption?: string) => {
    if (!user) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    try {
      setUploading(true);
      setSending(true);
      await messagesApi.sendMediaMessage(taskId, file, type, caption);
      setPendingFile(null);
      setNewMessage('');
      toast.success(`${type === 'image' ? 'Photo' : type === 'video' ? 'Video' : 'File'} sent!`);
    } catch (error) {
      console.error('Error sending media:', error);
      toast.error('Failed to send. Please try again.');
    } finally {
      setUploading(false);
      setSending(false);
    }
  };

  // ── File picking handlers ─────────────────────────────────────────────
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile({ file, type });
    setShowAttachMenu(false);

    // Reset the input so user can re-select
    e.target.value = '';
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openPhotos = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setPendingFile({ file, type: 'image' });
        setShowAttachMenu(false);
      }
    };
    input.click();
  };

  const openFiles = () => {
    fileInputRef.current?.click();
  };

  const openVideos = () => {
    videoInputRef.current?.click();
  };

  // ── Render a single message bubble ────────────────────────────────────
  const renderMessageContent = (message: Message, isOwn: boolean) => {
    const hasAttachment = message.attachment_url && message.attachment_type;
    const hasText = message.message && !['📷 Photo', '🎥 Video'].includes(message.message) &&
      !message.message.startsWith('📎 ');

    return (
      <>
        {/* Attachment */}
        {hasAttachment && message.attachment_type === 'image' && (
          <ImagePreview url={message.attachment_url!} isOwn={isOwn} />
        )}
        {hasAttachment && message.attachment_type === 'video' && (
          <VideoPreview url={message.attachment_url!} />
        )}
        {hasAttachment && message.attachment_type === 'file' && (
          <FilePreview
            url={message.attachment_url!}
            fileName={message.file_name}
            fileSize={message.file_size}
            isOwn={isOwn}
          />
        )}

        {/* Text / caption */}
        {hasText && (
          <p className="text-sm">{message.message}</p>
        )}
        {!hasText && !hasAttachment && (
          <p className="text-sm">{message.message}</p>
        )}
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] sm:h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DialogHeader className="px-5 py-3.5 border-b bg-background/95 backdrop-blur-sm">
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary">
              <MessageCircle className="h-4 w-4" />
            </div>
            Chat with {otherUserName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Share messages, photos, documents & videos
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* ── Messages Area ──────────────────────────────────────────── */}
          <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
            {loading ? (
              <div className="flex items-center justify-center h-full py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="p-3 rounded-full bg-muted/50 mb-3">
                  <MessageCircle className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm">No messages yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Start the conversation!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 space-y-1.5 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        {renderMessageContent(message, isOwn)}
                        <p
                          className={`text-[10px] ${
                            isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground/70'
                          }`}
                        >
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* ── Quick Messages ─────────────────────────────────────────── */}
          <div className="px-4 py-2 border-t border-border/50">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_MESSAGES.map((msg) => (
                <Badge
                  key={msg}
                  variant="outline"
                  className="cursor-pointer whitespace-nowrap text-xs py-1 px-2.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-150 flex-shrink-0"
                  onClick={() => handleQuickMessage(msg)}
                >
                  {msg}
                </Badge>
              ))}
            </div>
          </div>

          {/* ── Upload Preview ─────────────────────────────────────────── */}
          {pendingFile && (
            <UploadPreview
              file={pendingFile.file}
              type={pendingFile.type}
              uploading={uploading}
              onRemove={() => setPendingFile(null)}
            />
          )}

          {/* ── Attachment Menu (slides up) ────────────────────────────── */}
          {showAttachMenu && (
            <div
              data-attach-menu
              className="mx-3 mb-2 p-2 bg-card rounded-2xl border border-border shadow-lg animate-in slide-in-from-bottom-3 duration-200 grid grid-cols-2 gap-1.5"
            >
              <AttachOption
                icon={<Camera className="h-5 w-5" />}
                label="Camera"
                color="text-rose-500"
                bg="hover:bg-rose-500/10"
                onClick={openCamera}
              />
              <AttachOption
                icon={<ImageIcon className="h-5 w-5" />}
                label="Photos"
                color="text-violet-500"
                bg="hover:bg-violet-500/10"
                onClick={openPhotos}
              />
              <AttachOption
                icon={<FileText className="h-5 w-5" />}
                label="Files"
                color="text-blue-500"
                bg="hover:bg-blue-500/10"
                onClick={openFiles}
              />
              <AttachOption
                icon={<Video className="h-5 w-5" />}
                label="Videos"
                color="text-emerald-500"
                bg="hover:bg-emerald-500/10"
                onClick={openVideos}
              />
            </div>
          )}

          {/* ── Input Bar ──────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-3 border-t bg-background">
            {/* Attach button */}
            <button
              type="button"
              data-attach-menu
              onClick={(e) => { e.stopPropagation(); setShowAttachMenu((v) => !v); }}
              className={`p-2 rounded-full transition-all duration-200 ${
                showAttachMenu
                  ? 'bg-primary text-primary-foreground rotate-45'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Text input */}
            <Input
              placeholder={pendingFile ? 'Add a caption...' : 'Type your message...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending}
              className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50 h-10"
            />

            {/* Send button */}
            <Button
              type="submit"
              size="icon"
              disabled={sending || (!newMessage.trim() && !pendingFile)}
              className="rounded-full h-10 w-10 flex-shrink-0 shadow-sm"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>

        {/* ── Hidden file inputs ──────────────────────────────────────── */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelected(e, 'image')}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar"
          className="hidden"
          onChange={(e) => handleFileSelected(e, 'file')}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileSelected(e, 'video')}
        />
      </DialogContent>
    </Dialog>
  );
}
