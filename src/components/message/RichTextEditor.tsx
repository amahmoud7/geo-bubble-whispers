import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bold, Italic, Hash, AtSign, Link, Smile, 
  Type, AlignLeft, AlignCenter, List, 
  Save, Clock, Trash2 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  onHashtagsChange?: (hashtags: string[]) => void;
  onMentionsChange?: (mentions: string[]) => void;
  showFormatting?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onContentChange,
  placeholder = "What's happening here?",
  maxLength = 500,
  onHashtagsChange,
  onMentionsChange,
  showFormatting = true
}) => {
  const [isDraft, setIsDraft] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Common emojis for quick access
  const quickEmojis = ['😀', '😂', '❤️', '👍', '🔥', '🎉', '😍', '🤔', '😎', '💯', '📍', '🌟', '✨', '🙌'];

  // Mock hashtag and mention suggestions
  const hashtagSuggestions = ['#photography', '#travel', '#food', '#nature', '#sunset', '#citylife', '#weekend'];
  const mentionSuggestions = ['@john_doe', '@jane_smith', '@local_explorer', '@foodie_friend'];

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    return text.match(hashtagRegex) || [];
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@[a-zA-Z0-9_]+/g;
    return text.match(mentionRegex) || [];
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    if (newContent.length <= maxLength) {
      onContentChange(newContent);
      
      // Extract hashtags and mentions
      const hashtags = extractHashtags(newContent);
      const mentions = extractMentions(newContent);
      
      onHashtagsChange?.(hashtags);
      onMentionsChange?.(mentions);
      
      // Handle suggestions
      const cursorPos = e.target.selectionStart;
      setCursorPosition(cursorPos);
      
      const textUpToCursor = newContent.substring(0, cursorPos);
      const lastWord = textUpToCursor.split(/\s/).pop() || '';
      
      if (lastWord.startsWith('#')) {
        const hashtagQuery = lastWord.substring(1).toLowerCase();
        const filtered = hashtagSuggestions.filter(tag => 
          tag.toLowerCase().includes(hashtagQuery)
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else if (lastWord.startsWith('@')) {
        const mentionQuery = lastWord.substring(1).toLowerCase();
        const filtered = mentionSuggestions.filter(mention => 
          mention.toLowerCase().includes(mentionQuery)
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      toast({
        title: "Character limit reached",
        description: `Maximum ${maxLength} characters allowed`,
        variant: "destructive"
      });
    }
  };

  const insertAtCursor = (textToInsert: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newContent = 
        content.substring(0, start) + 
        textToInsert + 
        content.substring(end);
      
      onContentChange(newContent);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + textToInsert.length;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const insertEmoji = (emoji: string) => {
    insertAtCursor(emoji + ' ');
    setShowEmojiPicker(false);
  };

  const insertSuggestion = (suggestion: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const textUpToCursor = content.substring(0, cursorPosition);
      const textAfterCursor = content.substring(cursorPosition);
      
      // Find the start of the current word (hashtag or mention)
      const lastSpaceIndex = textUpToCursor.lastIndexOf(' ');
      const wordStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
      
      const newContent = 
        content.substring(0, wordStart) + 
        suggestion + ' ' + 
        textAfterCursor;
      
      onContentChange(newContent);
      setShowSuggestions(false);
      
      // Set cursor after the inserted suggestion
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = wordStart + suggestion.length + 1;
          textareaRef.current.setSelectionRange(newPosition, newPosition);
          textareaRef.current.focus();
        }
      }, 0);
    }
  };

  const saveDraft = () => {
    if (content.trim()) {
      localStorage.setItem('message_draft', content);
      setIsDraft(true);
      toast({
        title: "Draft saved",
        description: "Your message has been saved as a draft",
      });
    }
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('message_draft');
    if (draft) {
      onContentChange(draft);
      toast({
        title: "Draft loaded",
        description: "Your saved draft has been loaded",
      });
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('message_draft');
    setIsDraft(false);
    toast({
      title: "Draft cleared",
      description: "Saved draft has been removed",
    });
  };

  useEffect(() => {
    // Check for saved draft on mount
    const savedDraft = localStorage.getItem('message_draft');
    if (savedDraft && !content) {
      setIsDraft(true);
    }
  }, []);

  const charCount = content.length;
  const isNearLimit = charCount > maxLength * 0.8;

  return (
    <div className="space-y-3">
      {/* Draft Controls */}
      {isDraft && (
        <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
          <div className="flex items-center space-x-2 text-sm">
            <Save className="h-4 w-4 text-blue-600" />
            <span className="text-blue-600">Draft available</span>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={loadDraft}>
              Load Draft
            </Button>
            <Button size="sm" variant="ghost" onClick={clearDraft}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Text Area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="min-h-[120px] resize-none pr-16 text-base leading-relaxed"
          rows={6}
        />
        
        {/* Character Count */}
        <div className="absolute bottom-3 right-3">
          <Badge 
            variant={isNearLimit ? "destructive" : "secondary"}
            className="text-xs"
          >
            {charCount}/{maxLength}
          </Badge>
        </div>
      </div>

      {/* Suggestions Popup */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-10 w-full max-w-xs">
          <CardContent className="p-2">
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm"
                  onClick={() => insertSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formatting Tools */}
      {showFormatting && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Quick Insert Buttons */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => insertAtCursor('#')}
              className="h-8 px-2"
            >
              <Hash className="h-3 w-3" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => insertAtCursor('@')}
              className="h-8 px-2"
            >
              <AtSign className="h-3 w-3" />
            </Button>

            {/* Emoji Picker Toggle */}
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="h-8 px-2"
              >
                <Smile className="h-3 w-3" />
              </Button>
              
              {showEmojiPicker && (
                <Card className="absolute bottom-10 left-0 z-10 p-2">
                  <div className="grid grid-cols-7 gap-1">
                    {quickEmojis.map((emoji, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-lg hover:bg-muted"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Draft Save */}
            <Button
              size="sm"
              variant="outline"
              onClick={saveDraft}
              className="h-8 px-2"
              disabled={!content.trim()}
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>

          {/* Text Stats */}
          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
            {extractHashtags(content).length > 0 && (
              <div className="flex items-center space-x-1">
                <Hash className="h-3 w-3" />
                <span>{extractHashtags(content).length}</span>
              </div>
            )}
            
            {extractMentions(content).length > 0 && (
              <div className="flex items-center space-x-1">
                <AtSign className="h-3 w-3" />
                <span>{extractMentions(content).length}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <Type className="h-3 w-3" />
              <span>{content.split(/\s+/).filter(word => word.length > 0).length} words</span>
            </div>
          </div>
        </div>
      )}

      {/* Hashtags and Mentions Display */}
      {(extractHashtags(content).length > 0 || extractMentions(content).length > 0) && (
        <div className="flex flex-wrap gap-1">
          {extractHashtags(content).map((hashtag, index) => (
            <Badge key={`hashtag-${index}`} variant="secondary" className="text-xs">
              {hashtag}
            </Badge>
          ))}
          {extractMentions(content).map((mention, index) => (
            <Badge key={`mention-${index}`} variant="outline" className="text-xs">
              {mention}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;