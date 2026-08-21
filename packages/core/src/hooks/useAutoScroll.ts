import { useCallback, useEffect, useRef, useState } from "react"

export interface UseAutoScrollOptions {
  /**
   * Distance in pixels from the bottom edge that still counts as "at bottom".
   * @default 80
   */
  threshold?: number
  /**
   * Whether auto-scroll should engage at all.
   * @default true
   */
  enabled?: boolean
  /**
   * Called with `true`/`false` whenever the at-bottom state changes.
   */
  onAtBottomChange?: (isAtBottom: boolean) => void
}

export interface UseAutoScrollReturn<T extends HTMLElement> {
  /** Attach to the scrollable container element. */
  containerRef: React.RefObject<T | null>
  /** Whether the container is currently (near) the bottom. */
  isAtBottom: boolean
  /** Scroll to the bottom, optionally instant or smooth. */
  scrollToBottom: (behavior?: ScrollBehavior) => void
  /** Recompute `isAtBottom` without waiting for a scroll event. */
  checkAtBottom: () => boolean
}

/**
 * Track a scroll container's position relative to the bottom edge so a chat
 * transcript can "stick to the bottom" while streaming, then release control
 * the moment the user scrolls up.
 */
export function useAutoScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseAutoScrollOptions = {}
): UseAutoScrollReturn<T> {
  const { threshold = 80, enabled = true, onAtBottomChange } = options
  const containerRef = useRef<T | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const onAtBottomChangeRef = useRef(onAtBottomChange)
  onAtBottomChangeRef.current = onAtBottomChange

  const checkAtBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return true
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
  }, [threshold])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = containerRef.current
    if (!el) return
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight, behavior })
    } else {
      // Fallback for environments without Element.scrollTo (e.g. jsdom).
      el.scrollTop = el.scrollHeight
    }
    setIsAtBottom(true)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const el = containerRef.current
    if (!el) return

    const onScroll = () => {
      const atBottom = checkAtBottom()
      setIsAtBottom(atBottom)
      onAtBottomChangeRef.current?.(atBottom)
    }

    el.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener("scroll", onScroll)
  }, [enabled, checkAtBottom])

  return { containerRef, isAtBottom, scrollToBottom, checkAtBottom }
}
