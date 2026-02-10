import { useState } from "react";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐"],
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤝", "🙏", "💪", "🦾", "👏", "🙌", "👐", "🤲", "🤜", "🤛", "✊", "👊"],
  },
  {
    name: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  },
  {
    name: "Objects",
    emojis: ["🔥", "⭐", "🌟", "💫", "✨", "💥", "💯", "🎉", "🎊", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "📌", "📍", "🔗", "🔔", "🔕", "💡", "📝", "✅", "❌", "⚠️", "❗", "❓", "💬", "👁️", "🎵", "🎶"],
  },
  {
    name: "Food",
    emojis: ["🍕", "🍔", "🌮", "🌯", "🍟", "🍗", "🥩", "🥪", "🍿", "🧀", "🍩", "🍪", "🎂", "🍰", "🍫", "🍬", "🍭", "☕", "🍵", "🥤", "🍺", "🍻", "🥂", "🍷"],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

export function EmojiPicker({ onSelect, trigger }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);

  const allEmojis = EMOJI_CATEGORIES.flatMap((cat) => cat.emojis);
  const filteredEmojis = search
    ? allEmojis.filter((e) => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory].emojis;

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
      >
        {trigger || <Smile className="h-4 w-4" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-8 right-0 z-50 w-72 bg-card border border-border rounded-lg shadow-lg">
            <div className="p-2 border-b border-border">
              <input
                type="text"
                placeholder="Search emoji..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2 py-1 text-sm bg-muted rounded border-none outline-none"
                autoFocus
              />
            </div>
            {!search && (
              <div className="flex gap-1 p-1 border-b border-border overflow-x-auto">
                {EMOJI_CATEGORIES.map((cat, i) => (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(i)}
                    className={`px-2 py-1 text-xs rounded whitespace-nowrap ${
                      i === activeCategory
                        ? "bg-primary/20 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-8 gap-0.5 p-2 max-h-48 overflow-y-auto">
              {filteredEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSelect(emoji)}
                  className="p-1 text-lg hover:bg-muted rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
