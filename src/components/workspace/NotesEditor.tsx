"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Code2, List, ListOrdered, Link2, Unlink,
  Check, Loader2, Quote, Minus, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight,
  MoreHorizontal, ChevronDown, AlignJustify, Indent, Outdent, Subscript, Superscript, Highlighter, Palette, RemoveFormatting,
} from "lucide-react";
import { notesToHtml, sanitizeHtml, isHtmlEmpty, normalizeLists } from "@/lib/richtext";
import { cn } from "@/lib/utils";

type SaveState = "saved" | "dirty" | "saving" | "error";

interface NotesEditorProps {
  initialValue: string;
  onSave: (value: string) => Promise<void>;
}

const AUTOSAVE_DELAY_MS = 1200;

const BLOCKS = [
  { value: "P", label: "Paragraph" },
  { value: "H1", label: "Heading 1" },
  { value: "H2", label: "Heading 2" },
  { value: "H3", label: "Heading 3" },
  { value: "H4", label: "Heading 4" },
  { value: "H5", label: "Heading 5" },
  { value: "H6", label: "Heading 6" },
  { value: "BLOCKQUOTE", label: "Quote" },
  { value: "PRE", label: "Code block" },
];

function setCaretInLi(li: HTMLElement) {
  if (!li.textContent?.trim() && !li.querySelector("br, ul, ol")) {
    li.innerHTML = "<br>";
  }
  li.focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  const firstChild = li.firstChild;
  if (firstChild && firstChild.nodeType === 3) {
    range.setStart(firstChild, firstChild.textContent?.length || 0);
    range.collapse(true);
  } else {
    range.setStart(li, 0);
    range.collapse(true);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

function setCaretInNode(node: Node, atEnd = true) {
  if (node instanceof HTMLElement) (node as HTMLElement).focus();
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(!atEnd);
  sel.removeAllRanges();
  sel.addRange(range);
}

export function NotesEditor({ initialValue, onSave }: NotesEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rangeRef = useRef<Range | null>(null);
  const mountedRef = useRef(false);
  const lastSavedRef = useRef(initialValue);
  const latestRef = useRef(initialValue);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [block, setBlock] = useState("P");
  const [active, setActive] = useState<Record<string, boolean>>({});

  const readHtml = () => {
    const el = editorRef.current;
    if (!el) return latestRef.current;
    const clean = sanitizeHtml(el.innerHTML);
    return isHtmlEmpty(clean) ? "" : clean;
  };

  const undo = () => {
    restoreRange();
    try {
      document.execCommand("undo");
    } catch {
      // ignore
    }
    markDirty();
    updateToolbarState();
  };

  const redo = () => {
    restoreRange();
    try {
      document.execCommand("redo");
    } catch {
      // ignore
    }
    markDirty();
    updateToolbarState();
  };

  const save = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const toSave = latestRef.current;
    if (toSave === lastSavedRef.current) {
      setSaveState("saved");
      return;
    }
    setSaveState("saving");
    try {
      await onSaveRef.current(toSave);
      lastSavedRef.current = toSave;
      setSaveState(latestRef.current === toSave ? "saved" : "dirty");
    } catch {
      setSaveState("error");
    }
  };

  const markDirty = (_immediate?: boolean) => {
    const currentHtml = readHtml();
    latestRef.current = currentHtml;
    setSaveState(latestRef.current === lastSavedRef.current ? "saved" : "dirty");

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, AUTOSAVE_DELAY_MS);
  };

  // Load content ONCE on mount so innerHTML is NEVER overwritten while typing!
  useEffect(() => {
    if (mountedRef.current || !editorRef.current) return;
    mountedRef.current = true;

    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      // ignore
    }

    const html = notesToHtml(initialValue);
    editorRef.current.innerHTML = html;
    normalizeLists(editorRef.current);
    const normalized = readHtml();
    latestRef.current = normalized;
    lastSavedRef.current = normalized;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flush unsaved notes when leaving the page
  useEffect(() => {
    const flush = () => {
      if (latestRef.current !== lastSavedRef.current) {
        void onSaveRef.current(latestRef.current);
      }
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, []);

  const updateToolbarState = useCallback(() => {
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.rangeCount || !el.contains(sel.anchorNode)) return;
    rangeRef.current = sel.getRangeAt(0).cloneRange();
    const q = (c: string) => {
      try { return document.queryCommandState(c); } catch { return false; }
    };
    setActive({
      bold: q("bold"), italic: q("italic"), underline: q("underline"),
      strikeThrough: q("strikeThrough"), subscript: q("subscript"), superscript: q("superscript"),
      insertUnorderedList: q("insertUnorderedList"), insertOrderedList: q("insertOrderedList"),
      justifyLeft: q("justifyLeft"), justifyCenter: q("justifyCenter"),
      justifyRight: q("justifyRight"), justifyFull: q("justifyFull"),
    });
    let node: Node | null = sel.anchorNode;
    let found = "P";
    while (node && node !== el) {
      if (node.nodeType === 1) {
        const t = (node as Element).tagName;
        if (BLOCKS.some((b) => b.value === t)) { found = t; break; }
      }
      node = node.parentNode;
    }
    setBlock(found);
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateToolbarState);
    return () => document.removeEventListener("selectionchange", updateToolbarState);
  }, [updateToolbarState]);

  const restoreRange = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const r = rangeRef.current;
    if (r) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    }
  };

  const exec = (command: string, value?: string) => {
    restoreRange();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, value);
    markDirty(true);
    updateToolbarState();
  };

  const formatBlock = (tag: string) => {
    restoreRange();
    document.execCommand("formatBlock", false, tag === "P" ? "<p>" : `<${tag.toLowerCase()}>`);
    markDirty(true);
    updateToolbarState();
  };

  // Indent / outdent. Inside lists this builds real nested sub-lists and continues parent numbering.
  const indentAction = (outdent: boolean) => {
    restoreRange();
    const el = editorRef.current;
    const sel = window.getSelection();
    if (!el || !sel || !sel.anchorNode) return;

    const closest = (test: (n: Element) => boolean): HTMLElement | null => {
      let n: Node | null = sel.anchorNode;
      while (n && n !== el) {
        if (n.nodeType === 1 && test(n as Element)) return n as HTMLElement;
        n = n.parentNode;
      }
      return null;
    };
    const isList = (n: Element | null) => !!n && /^(UL|OL)$/.test(n.tagName);
    const li = closest((n) => n.tagName === "LI");

    if (li) {
      const parentList = li.parentElement as HTMLElement;
      if (!outdent) {
        // Indent: make sublist under previous sibling
        const prev = li.previousElementSibling as HTMLElement | null;
        if (prev) {
          let sub = prev.lastElementChild as HTMLElement | null;
          if (!isList(sub)) {
            sub = document.createElement(parentList.tagName === "OL" ? "ul" : "ol");
            prev.appendChild(sub);
          }
          sub!.appendChild(li);
          setCaretInLi(li);
        }
      } else {
        // Outdent: pop out of sublist or exit top list
        const parentLi = parentList.parentElement;
        if (parentLi && parentLi.tagName === "LI") {
          // Inside a sublist: move after parentLi into the parent list!
          const following: Element[] = [];
          let s = li.nextElementSibling;
          while (s) { following.push(s); s = s.nextElementSibling; }
          if (following.length) {
            let sub = li.lastElementChild as HTMLElement | null;
            if (!isList(sub)) {
              sub = document.createElement(parentList.tagName.toLowerCase());
              li.appendChild(sub);
            }
            following.forEach((f) => sub!.appendChild(f));
          }
          parentLi.after(li);
          if (!parentList.children.length) parentList.remove();
          setCaretInLi(li);
        } else {
          // Top-level LI: exit the list and become a normal <p>
          const p = document.createElement("p");
          if (!li.textContent?.trim() && !li.children.length) {
            p.innerHTML = "<br>";
          } else {
            while (li.firstChild) p.appendChild(li.firstChild);
          }
          if (parentList.children.length === 1) {
            parentList.replaceWith(p);
          } else {
            const afterList = document.createElement(parentList.tagName.toLowerCase());
            let next = li.nextElementSibling;
            while (next) {
              const toMove = next;
              next = next.nextElementSibling;
              afterList.appendChild(toMove);
            }
            parentList.after(p);
            if (afterList.children.length) {
              p.after(afterList);
            }
            li.remove();
          }
          setCaretInNode(p, false);
        }
      }
    } else {
      let block: Node | null = sel.anchorNode;
      while (block && block.parentNode !== el) block = block.parentNode;
      if (block && block.nodeType === 3) {
        document.execCommand("formatBlock", false, "<p>");
        block = null;
        let n: Node | null = window.getSelection()?.anchorNode ?? null;
        while (n && n.parentNode !== el) n = n.parentNode;
        block = n;
      }
      if (block && block.nodeType === 1) {
        const b = block as HTMLElement;
        const cur = parseInt(b.style.marginLeft || "0", 10) || 0;
        const next = Math.max(0, cur + (outdent ? -32 : 32));
        if (next) b.style.marginLeft = `${next}px`;
        else b.style.removeProperty("margin-left");
        if (!b.getAttribute("style")) b.removeAttribute("style");
      }
    }
    markDirty(true);
    updateToolbarState();
  };

  const inlineCode = () => {
    restoreRange();
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const text = sel.toString() || "code";
    const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    document.execCommand("insertHTML", false, `<code>${esc}</code>&#8203;`);
    markDirty(true);
  };

  const addLink = () => {
    restoreRange();
    const url = window.prompt("Link URL (https://...)", "https://");
    if (!url) return;
    const sel = window.getSelection();
    if (sel && sel.isCollapsed) {
      const esc = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
      document.execCommand("insertHTML", false, `<a href="${esc}">${esc}</a>`);
    } else {
      document.execCommand("createLink", false, url);
    }
    markDirty(true);
  };

  // Markdown-style shortcuts: "## ", "- ", "1. ", "2. ", "> ", "---" at the start of a line
  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
    const ev = e.nativeEvent as InputEvent;
    if (ev.inputType !== "insertText" || ev.data !== " ") return;
    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.anchorNode || sel.anchorNode.nodeType !== 3) return;
    const text = (sel.anchorNode.textContent || "").slice(0, sel.anchorOffset);
    const apply = (fn: () => void) => {
      e.preventDefault();
      const node = sel.anchorNode as Text;
      node.textContent = (node.textContent || "").slice(sel.anchorOffset);
      const r = document.createRange();
      r.setStart(node, 0);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      fn();
    };

    const h = text.match(/^(#{1,6})$/);
    if (h) return apply(() => document.execCommand("formatBlock", false, `<h${h[1].length}>`));
    if (/^[-*+]$/.test(text)) return apply(() => document.execCommand("insertUnorderedList"));

    const numMatch = text.match(/^(\d+)\.$/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      return apply(() => {
        const el = editorRef.current;
        if (!el) return;
        const selNow = window.getSelection();
        let cur: Node | null = selNow?.anchorNode ?? null;
        while (cur && cur.parentNode !== el) cur = cur.parentNode;
        const prevSibling = (cur as Element | null)?.previousElementSibling as HTMLElement | null;

        // If the preceding element is an OL, append to it so numbering continues!
        if (prevSibling && prevSibling.tagName === "OL") {
          const newLi = document.createElement("li");
          newLi.innerHTML = "<br>";
          if (num > 1 && prevSibling.children.length + 1 !== num) {
            newLi.value = num;
          }
          prevSibling.appendChild(newLi);
          if (cur) (cur as HTMLElement).remove();
          setCaretInLi(newLi);
          markDirty(true);
          return;
        }

        document.execCommand("insertOrderedList");
        const selAfter = window.getSelection();
        let listNode: Node | null = selAfter?.anchorNode ?? null;
        while (listNode && listNode !== el) {
          if (listNode.nodeType === 1 && (listNode as Element).tagName === "OL") {
            if (num > 1) {
              (listNode as HTMLElement).setAttribute("start", String(num));
            }
            break;
          }
          listNode = listNode.parentNode;
        }
        markDirty(true);
      });
    }

    if (text === ">") return apply(() => document.execCommand("formatBlock", false, "<blockquote>"));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key.toLowerCase() === "s") {
      e.preventDefault();
      latestRef.current = readHtml();
      void save();
      return;
    }

    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      addLink();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      indentAction(e.shiftKey);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      const el = editorRef.current;
      const sel = window.getSelection();
      let n: Node | null = sel?.anchorNode ?? null;
      let li: HTMLElement | null = null;
      while (n && n !== el) {
        if (n.nodeType === 1 && (n as Element).tagName === "LI") {
          li = n as HTMLElement;
          break;
        }
        n = n.parentNode;
      }
      if (li) {
        const hasSublist = !!li.querySelector("ul, ol");
        const text = (li.textContent || "").replace(/[\u200B\s]/g, "");
        if (!hasSublist && text === "") {
          e.preventDefault();
          indentAction(true); // outdent empty list item
          return;
        }
      }
    } else if (e.key === "Backspace" && !e.shiftKey) {
      const el = editorRef.current;
      const sel = window.getSelection();
      let n: Node | null = sel?.anchorNode ?? null;
      let li: HTMLElement | null = null;
      while (n && n !== el) {
        if (n.nodeType === 1 && (n as Element).tagName === "LI") {
          li = n as HTMLElement;
          break;
        }
        n = n.parentNode;
      }
      if (li && sel?.isCollapsed && sel.anchorOffset === 0) {
        const hasSublist = !!li.querySelector("ul, ol");
        const text = (li.textContent || "").replace(/[\u200B\s]/g, "");
        if (!hasSublist && text === "") {
          e.preventDefault();
          indentAction(true); // outdent empty item
          return;
        }
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    if (html) {
      document.execCommand("insertHTML", false, sanitizeHtml(html));
    } else {
      document.execCommand("insertText", false, text);
    }
    markDirty(true);
  };

  type Item = { icon: React.ElementType; label: string; cmd?: string; hint?: string; sample?: string; run?: () => void };
  const run = (it: Item) => (it.run ? it.run() : exec(it.cmd!));

  // Apply a bullet / numbering style to the current list
  const setListStyle = (ordered: boolean, type: string) => {
    restoreRange();
    const el = editorRef.current;
    if (!el) return;

    const sel = window.getSelection();
    let n: Node | null = sel?.anchorNode ?? null;
    let targetLi: HTMLElement | null = null;
    let targetList: HTMLElement | null = null;

    while (n && n !== el) {
      if (n.nodeType === 1) {
        const tag = (n as Element).tagName;
        if (!targetLi && tag === "LI") targetLi = n as HTMLElement;
        if (/^(UL|OL)$/.test(tag)) {
          targetList = n as HTMLElement;
          break;
        }
      }
      n = n.parentNode;
    }

    const wantTag = ordered ? "OL" : "UL";

    // If user is inside a sublist and clicks numbering, outdent it into the parent OL!
    if (ordered && targetList && targetList.tagName === "UL" && targetList.parentElement?.tagName === "LI") {
      indentAction(true);
      return;
    }

    if (!targetList) {
      document.execCommand(ordered ? "insertOrderedList" : "insertUnorderedList");
      let created = window.getSelection()?.anchorNode;
      while (created && created !== el) {
        if (created.nodeType === 1 && /^(UL|OL)$/.test((created as Element).tagName)) {
          (created as HTMLElement).style.listStyleType = type;
          break;
        }
        created = created.parentNode;
      }
    } else {
      if (targetList.tagName === wantTag) {
        targetList.style.listStyleType = type;
      } else {
        // If user is in an OL and picks a bullet style (UL) and has a previous sibling:
        // nest it into previous sibling as sublist without splitting OL!
        if (!ordered && targetLi && targetLi.parentElement === targetList && targetLi.previousElementSibling) {
          const prev = targetLi.previousElementSibling;
          let sub = prev.lastElementChild as HTMLElement | null;
          if (!sub || !/^(UL|OL)$/.test(sub.tagName)) {
            sub = document.createElement("ul");
            prev.appendChild(sub);
          }
          sub.style.listStyleType = type;
          sub.appendChild(targetLi);
          setCaretInLi(targetLi);
        } else {
          const newList = document.createElement(wantTag.toLowerCase());
          newList.style.listStyleType = type;
          while (targetList.firstChild) {
            newList.appendChild(targetList.firstChild);
          }
          targetList.replaceWith(newList);
          if (targetLi) setCaretInLi(targetLi);
        }
      }
    }

    markDirty(true);
    updateToolbarState();
  };

  const styleItem = (ordered: boolean, type: string, label: string, sample: string): Item => ({
    icon: List, label, sample, run: () => setListStyle(ordered, type),
  });
  const bulletItems: Item[] = [
    styleItem(false, "disc", "Filled circle", "●"),
    styleItem(false, "circle", "Hollow circle", "○"),
    styleItem(false, "square", "Square", "■"),
    styleItem(false, "disclosure-closed", "Arrow", "▸"),
  ];
  const numberItems: Item[] = [
    styleItem(true, "decimal", "1. 2. 3.", "1."),
    styleItem(true, "lower-alpha", "a. b. c.", "a."),
    styleItem(true, "upper-alpha", "A. B. C.", "A."),
    styleItem(true, "lower-roman", "i. ii. iii.", "i."),
    styleItem(true, "upper-roman", "I. II. III.", "I."),
    styleItem(true, "bengali", "১. ২. ৩.", "১."),
  ];

  const listItems: Item[] = [
    { icon: List, label: "Bullet list", cmd: "insertUnorderedList" },
    { icon: ListOrdered, label: "Numbered list", cmd: "insertOrderedList" },
    { icon: Indent, label: "Sub-list / indent", hint: "Tab", run: () => indentAction(false) },
    { icon: Outdent, label: "Back one level", hint: "Shift+Tab", run: () => indentAction(true) },
  ];
  const alignItems: Item[] = [
    { icon: AlignLeft, label: "Align left", cmd: "justifyLeft" },
    { icon: AlignCenter, label: "Align center", cmd: "justifyCenter" },
    { icon: AlignRight, label: "Align right", cmd: "justifyRight" },
    { icon: AlignJustify, label: "Justify", cmd: "justifyFull" },
  ];
  const insertItems: Item[] = [
    { icon: Link2, label: "Link", hint: "Ctrl+K", run: addLink },
    { icon: Unlink, label: "Remove link", cmd: "unlink" },
    { icon: Quote, label: "Quote", run: () => formatBlock("BLOCKQUOTE") },
    { icon: Code2, label: "Code block", run: () => formatBlock("PRE") },
    { icon: Minus, label: "Horizontal line", cmd: "insertHorizontalRule" },
  ];
  const moreItems: Item[] = [
    { icon: Strikethrough, label: "Strikethrough", cmd: "strikeThrough" },
    { icon: Subscript, label: "Subscript", cmd: "subscript" },
    { icon: Superscript, label: "Superscript", cmd: "superscript" },
    { icon: Code, label: "Inline code", run: inlineCode },
    { icon: RemoveFormatting, label: "Clear formatting", run: () => { exec("removeFormat"); formatBlock("P"); } },
  ];

  const btnClass = (on?: boolean) =>
    cn(
      "h-8 min-w-8 px-1.5 inline-flex items-center justify-center gap-0.5 rounded-md transition cursor-pointer",
      on
        ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-300"
        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800"
    );

  const sep = <span className="mx-1 h-5 w-px bg-slate-300/50 dark:bg-white/10" aria-hidden />;

  const menu = (id: string, icon: React.ElementType, title: string, items: Item[]) => (
    <ToolbarMenu
      id={id}
      icon={icon}
      title={title}
      items={items}
      active={active}
      onPick={run}
      btnClass={btnClass}
    />
  );

  return (
    <section aria-label="Notes" className="rounded-2xl glass-surface ring-1 ring-white/10 overflow-visible">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 rounded-t-2xl">
        <div
          className="flex flex-wrap items-center gap-0.5"
          onMouseDown={(e) => {
            const t = (e.target as HTMLElement).tagName;
            if (t !== "SELECT" && t !== "INPUT") e.preventDefault();
          }}
        >
          <select
            aria-label="Text style"
            value={block}
            onChange={(e) => formatBlock(e.target.value)}
            className="h-8 w-[7.5rem] rounded-md border border-slate-200 dark:border-slate-700 bg-transparent text-xs px-1.5 text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            {BLOCKS.map((b) => (
              <option key={b.value} value={b.value} className="text-slate-900">{b.label}</option>
            ))}
          </select>

          {sep}
          <button type="button" title="Undo (Ctrl+Z)" aria-label="Undo" onClick={undo} className={btnClass()}><Undo2 className="w-4 h-4" /></button>
          <button type="button" title="Redo (Ctrl+Y)" aria-label="Redo" onClick={redo} className={btnClass()}><Redo2 className="w-4 h-4" /></button>

          {sep}
          <button type="button" title="Bold (Ctrl+B)" aria-label="Bold" onClick={() => exec("bold")} className={btnClass(active.bold)}><Bold className="w-4 h-4" /></button>
          <button type="button" title="Italic (Ctrl+I)" aria-label="Italic" onClick={() => exec("italic")} className={btnClass(active.italic)}><Italic className="w-4 h-4" /></button>
          <button type="button" title="Underline (Ctrl+U)" aria-label="Underline" onClick={() => exec("underline")} className={btnClass(active.underline)}><Underline className="w-4 h-4" /></button>

          {sep}
          <label title="Text color" className={cn(btnClass(), "relative")}>
            <Palette className="w-4 h-4" />
            <input type="color" aria-label="Text color" defaultValue="#00c6ff" onChange={(e) => exec("foreColor", e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          </label>
          <label title="Highlight color" className={cn(btnClass(), "relative")}>
            <Highlighter className="w-4 h-4" />
            <input type="color" aria-label="Highlight color" defaultValue="#fde047" onChange={(e) => exec("hiliteColor", e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          </label>

          {sep}
          {menu("bullets", List, "Bullet styles", bulletItems)}
          {menu("numbers", ListOrdered, "Numbering styles", numberItems)}
          {menu("lists", Indent, "Sub-list & indent", listItems.slice(2))}
          {menu("align", AlignLeft, "Alignment", alignItems)}
          {menu("insert", Link2, "Insert", insertItems)}
          {menu("more", MoreHorizontal, "More formatting", moreItems)}
        </div>

        <div className="flex items-center">
          <button
            id="notes-save-indicator"
            type="button"
            aria-live="polite"
            disabled={saveState !== "error"}
            onClick={() => { latestRef.current = readHtml(); void save(); }}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition disabled:cursor-default",
              saveState === "saved" && "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
              saveState === "dirty" && "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10",
              saveState === "saving" && "text-slate-500 border-slate-400/30 bg-slate-500/10",
              saveState === "error" && "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 cursor-pointer"
            )}
          >
            {saveState === "saved" && <><Check className="w-3.5 h-3.5" /> Saved</>}
            {saveState === "dirty" && <>Unsaved</>}
            {saveState === "saving" && <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>}
            {saveState === "error" && <>Save failed — retry</>}
          </button>
        </div>
      </div>

      <div
        id="notes-editor"
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        contentEditable
        suppressContentEditableWarning
        spellCheck
        data-placeholder="Start writing… use the toolbar, or type ## for headings, - for bullets, 1. for numbering, > for quotes"
        onInput={() => markDirty(false)}
        onBeforeInput={handleBeforeInput}
        onKeyDown={handleKeyDown}
        onKeyUp={updateToolbarState}
        onMouseUp={updateToolbarState}
        onPaste={handlePaste}
        className="rich-content rich-editor w-full min-h-[360px] p-5 text-slate-800 dark:text-slate-200 focus:outline-hidden"
      />
    </section>
  );
}

interface MenuItem { icon: React.ElementType; label: string; cmd?: string; hint?: string; sample?: string; run?: () => void }

function ToolbarMenu({
  id, icon: Icon, title, items, active, onPick, btnClass,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  items: MenuItem[];
  active: Record<string, boolean>;
  onPick: (it: MenuItem) => void;
  btnClass: (on?: boolean) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={`notes-menu-${id}`}
        title={title}
        aria-label={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={btnClass(open)}
      >
        <Icon className="w-4 h-4" />
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1.5 z-50 min-w-[11.5rem] p-1.5 rounded-xl border border-white/15 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/30"
        >
          {items.map((it) => {
            const IIcon = it.icon;
            const on = it.cmd ? active[it.cmd] : false;
            return (
              <button
                key={it.label}
                type="button"
                role="menuitem"
                onClick={() => { onPick(it); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-left transition cursor-pointer",
                  on
                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-white/10"
                )}
              >
                {it.sample ? (
                  <span className="w-5 shrink-0 text-center text-sm font-semibold">{it.sample}</span>
                ) : (
                  <IIcon className="w-4 h-4 shrink-0" />
                )}
                <span className="flex-1">{it.label}</span>
                {it.hint && <kbd className="text-[10px] text-slate-400">{it.hint}</kbd>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
