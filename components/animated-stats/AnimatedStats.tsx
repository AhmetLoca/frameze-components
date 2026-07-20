import React, { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

interface StatItem {
    number: string
    suffix: string
    label: string
}

type AnimationType = "blur" | "slide" | "fade" | "scale"
type ThemeType = "dark" | "light"

interface DemoState {
    theme: ThemeType
    animationType: AnimationType
    numberSize: number
    labelSize: number
    itemGap: number
    borderRadius: number
    paddingX: number
    paddingY: number
}

interface Props {
    stats: StatItem[]
    theme: ThemeType
    useCustomColors: boolean
    backgroundColor?: string
    numberColor?: string
    suffixColor?: string
    labelColor?: string
    dividerColor?: string
    animationDuration: number
    countDuration: number
    staggerDelay: number
    animationType: AnimationType
    fontFamily: string
    numberSize: number
    suffixSize: number
    labelSize: number
    itemGap: number
    borderRadius: number
    paddingX: number
    paddingY: number
    layout: "1x4" | "2x2" | "4x1"
    replayOnReenter: boolean
    demoMode: boolean
    style?: React.CSSProperties
}

const THEMES = {
    dark: {
        bg: "#0a0a0a",
        number: "#ffffff",
        suffix: "rgba(255,255,255,0.5)",
        label: "rgba(255,255,255,0.35)",
        divider: "rgba(255,255,255,0.08)",
    },
    light: {
        bg: "#f5f5f5",
        number: "#0a0a0a",
        suffix: "rgba(0,0,0,0.45)",
        label: "rgba(0,0,0,0.35)",
        divider: "rgba(0,0,0,0.08)",
    },
}

function getAnimInit(type: AnimationType): React.CSSProperties {
    switch (type) {
        case "slide":
            return { opacity: 0, transform: "translateY(48px)", filter: "none" }
        case "fade":
            return { opacity: 0, transform: "none", filter: "none" }
        case "scale":
            return { opacity: 0, transform: "scale(0.75)", filter: "none" }
        default:
            return {
                opacity: 0,
                transform: "translateY(40px)",
                filter: "blur(12px)",
            }
    }
}

function buildTransition(duration: number, type: AnimationType): string {
    const base = `${duration}s cubic-bezier(0.16,1,0.3,1)`
    switch (type) {
        case "fade":
            return `opacity ${base}`
        case "slide":
            return `opacity ${base}, transform ${base}`
        case "scale":
            return `opacity ${base}, transform ${base}`
        default:
            return `opacity ${base}, transform ${base}, filter ${base}`
    }
}

// ── Demo Panel atoms (module-level to prevent remount on every render) ────────

function DemoSegment<T extends string | number>({
    label,
    options,
    value,
    onChange,
    compact,
}: {
    label: string
    options: { label: string; value: T }[]
    value: T
    onChange: (v: T) => void
    compact?: boolean
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
            }}
        >
            <span
                style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui",
                }}
            >
                {label}
            </span>
            <div style={{ display: "flex", gap: 2 }}>
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => onChange(opt.value)}
                        style={{
                            padding: compact ? "4px 8px" : "4px 10px",
                            borderRadius: 6,
                            border: "none",
                            background:
                                opt.value === value
                                    ? "rgba(255,255,255,0.92)"
                                    : "rgba(255,255,255,0.09)",
                            color:
                                opt.value === value
                                    ? "#1a1a1a"
                                    : "rgba(255,255,255,0.7)",
                            fontSize: compact ? 10 : 11,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "system-ui",
                            transition:
                                "background 0.15s ease, color 0.15s ease",
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

function DemoSlider({
    label,
    value,
    onChange,
    min,
    max,
    step,
}: {
    label: string
    value: number
    onChange: (v: number) => void
    min: number
    max: number
    step: number
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
            }}
        >
            <span
                style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui",
                }}
            >
                {label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    style={{
                        width: 72,
                        accentColor: "white",
                        cursor: "pointer",
                        margin: 0,
                    }}
                />
                <span
                    style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 10,
                        fontFamily: "system-ui",
                        minWidth: 18,
                        textAlign: "right",
                    }}
                >
                    {value}
                </span>
            </div>
        </div>
    )
}

function DemoToggle({
    label,
    value,
    onChange,
}: {
    label: string
    value: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
            }}
        >
            <div
                onClick={() => onChange(!value)}
                style={{
                    width: 34,
                    height: 20,
                    borderRadius: 10,
                    background: value
                        ? "rgba(255,255,255,0.88)"
                        : "rgba(255,255,255,0.13)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s ease",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 2,
                        left: value ? 16 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: value
                            ? "#1a1a1a"
                            : "rgba(255,255,255,0.55)",
                        transition: "left 0.2s ease",
                    }}
                />
            </div>
            <span
                style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui",
                    whiteSpace: "nowrap",
                }}
            >
                {label}
            </span>
        </div>
    )
}

/**
 * Animated Stats
 *
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 200
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight fixed
 */
export default function AnimatedStats(props: Props) {
    const {
        stats = [
            { number: "12", suffix: "M+", label: "Active users" },
            { number: "98", suffix: "%", label: "Satisfaction" },
            { number: "340", suffix: "K", label: "Projects built" },
            { number: "4.9", suffix: "★", label: "Average rating" },
        ],
        theme: themeProp = "dark",
        useCustomColors = false,
        backgroundColor: backgroundColorProp,
        numberColor: numberColorProp,
        suffixColor: suffixColorProp,
        labelColor: labelColorProp,
        dividerColor: dividerColorProp,
        animationDuration = 2.0,
        countDuration = 2700,
        staggerDelay = 250,
        animationType: animationTypeProp = "blur",
        fontFamily = "inherit",
        numberSize: numberSizeProp = 48,
        suffixSize: suffixSizeProp = 28,
        labelSize: labelSizeProp = 13,
        itemGap: itemGapProp = 10,
        borderRadius: borderRadiusProp = 20,
        paddingX: paddingXProp = 16,
        paddingY: paddingYProp = 32,
        layout: layoutProp = "1x4",
        replayOnReenter: replayOnReenterProp = false,
        demoMode = false,
        style,
    } = props

    const isStatic = useIsStaticRenderer()

    // ── Demo state ────────────────────────────────────────────────────────────
    const [demoState, setDemoState] = useState<DemoState>({
        theme: themeProp,
        animationType: animationTypeProp,
        numberSize: numberSizeProp,
        labelSize: labelSizeProp,
        itemGap: itemGapProp,
        borderRadius: borderRadiusProp,
        paddingX: paddingXProp,
        paddingY: paddingYProp,
    })
    const setDemo = (key: keyof DemoState, val: DemoState[keyof DemoState]) =>
        setDemoState((p) => ({ ...p, [key]: val }))

    const theme = (demoMode ? demoState.theme : themeProp) as ThemeType
    const animationType = (
        demoMode ? demoState.animationType : animationTypeProp
    ) as AnimationType
    const numberSize = demoMode ? demoState.numberSize : numberSizeProp
    const labelSize = demoMode ? demoState.labelSize : labelSizeProp
    const itemGap = demoMode ? demoState.itemGap : itemGapProp
    const borderRadius = demoMode ? demoState.borderRadius : borderRadiusProp
    const paddingX = demoMode ? demoState.paddingX : paddingXProp
    const paddingY = demoMode ? demoState.paddingY : paddingYProp

    // In demo mode, always use theme colors so the theme toggle works
    const t = THEMES[theme]
    const backgroundColor = demoMode
        ? t.bg
        : useCustomColors && backgroundColorProp
          ? backgroundColorProp
          : t.bg
    const numberColor = demoMode
        ? t.number
        : useCustomColors && numberColorProp
          ? numberColorProp
          : t.number
    const suffixColor = demoMode
        ? t.suffix
        : useCustomColors && suffixColorProp
          ? suffixColorProp
          : t.suffix
    const labelColor = demoMode
        ? t.label
        : useCustomColors && labelColorProp
          ? labelColorProp
          : t.label
    const dividerColor = demoMode
        ? t.divider
        : useCustomColors && dividerColorProp
          ? dividerColorProp
          : t.divider

    // ── Container & responsive ────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null)
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])
    const numberRefs = useRef<(HTMLSpanElement | null)[]>([])
    const hasAnimated = useRef(false)
    const rafRefs = useRef<number[]>([])
    const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([])
    const [containerWidth, setContainerWidth] = useState(800)

    useEffect(() => {
        if (!containerRef.current) return
        const obs = new ResizeObserver(([entry]) =>
            setContainerWidth(entry.contentRect.width)
        )
        obs.observe(containerRef.current)
        return () => obs.disconnect()
    }, [])

    const isMobile = containerWidth < 480
    const isTablet = containerWidth < 720

    const effectiveLayout: "1x4" | "2x2" | "4x1" = layoutProp

    const gridConfig = {
        "1x4": { cols: stats.length, rows: 1 },
        "2x2": { cols: 2, rows: 2 },
        "4x1": { cols: 1, rows: stats.length },
    }[effectiveLayout]

    function getDivider(i: number): React.CSSProperties {
        const total = stats.length
        if (effectiveLayout === "1x4")
            return i < total - 1
                ? { borderRight: `0.5px solid ${dividerColor}` }
                : {}
        if (effectiveLayout === "4x1")
            return i < total - 1
                ? { borderBottom: `0.5px solid ${dividerColor}` }
                : {}
        const col = i % 2
        const row = Math.floor(i / 2)
        const totalRows = Math.ceil(total / 2)
        return {
            ...(col === 0
                ? { borderRight: `0.5px solid ${dividerColor}` }
                : {}),
            ...(row < totalRows - 1
                ? { borderBottom: `0.5px solid ${dividerColor}` }
                : {}),
        }
    }

    // ── Animation ─────────────────────────────────────────────────────────────
    function easeOutExpo(t: number): number {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    }

    function animateCount(
        el: HTMLSpanElement,
        target: number,
        duration: number,
        decimals: number | null
    ) {
        if (isStatic) {
            el.textContent = decimals
                ? target.toFixed(decimals)
                : String(Math.round(target))
            return
        }
        const start = performance.now()
        function tick(now: number) {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const current = target * easeOutExpo(progress)
            el.textContent = decimals
                ? current.toFixed(decimals)
                : String(Math.round(current))
            if (progress < 1) {
                rafRefs.current.push(requestAnimationFrame(tick))
            }
        }
        rafRefs.current.push(requestAnimationFrame(tick))
    }

    function applyInit(item: HTMLDivElement, type: AnimationType) {
        const init = getAnimInit(type)
        item.style.opacity = String(init.opacity ?? 0)
        item.style.transform = String(init.transform ?? "none")
        item.style.filter = String(init.filter ?? "none")
    }

    function resetItems() {
        itemRefs.current.forEach((item, i) => {
            if (!item) return
            const numEl = numberRefs.current[i]
            if (numEl)
                numEl.textContent = stats[i]?.number.includes(".") ? "0.0" : "0"
            applyInit(item, animationType)
        })
    }

    function runAnimation() {
        rafRefs.current.forEach(cancelAnimationFrame)
        rafRefs.current = []
        timeoutRefs.current.forEach(clearTimeout)
        timeoutRefs.current = []
        resetItems()
        itemRefs.current.forEach((item, i) => {
            if (!item) return
            const id = setTimeout(
                () => {
                    item.style.opacity = "1"
                    item.style.transform = "none"
                    item.style.filter = "none"
                    const numEl = numberRefs.current[i]
                    if (numEl) {
                        const raw = stats[i]?.number ?? "0"
                        const target = parseFloat(raw)
                        const decimals = raw.includes(".")
                            ? raw.split(".")[1].length
                            : null
                        animateCount(numEl, target, countDuration, decimals)
                    }
                },
                i * staggerDelay + 300
            )
            timeoutRefs.current.push(id)
        })
    }

    useEffect(() => {
        if (isStatic) return
        hasAnimated.current = false
        resetItems()
        const observer = new IntersectionObserver(
            (entries) => {
                const isIntersecting = entries[0].isIntersecting
                if (isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true
                    runAnimation()
                    if (!replayOnReenterProp) observer.disconnect()
                } else if (!isIntersecting && replayOnReenterProp) {
                    hasAnimated.current = false
                    resetItems()
                }
            },
            { threshold: 0.3 }
        )
        if (containerRef.current) observer.observe(containerRef.current)
        return () => {
            observer.disconnect()
            rafRefs.current.forEach(cancelAnimationFrame)
            rafRefs.current = []
            timeoutRefs.current.forEach(clearTimeout)
            timeoutRefs.current = []
        }
    }, [
        stats,
        animationDuration,
        countDuration,
        staggerDelay,
        replayOnReenterProp,
        animationType,
        isStatic,
    ])

    const transitionStyle = buildTransition(animationDuration, animationType)
    const rNumberSize = Math.max(
        24,
        Math.round(numberSize * (isMobile ? 0.7 : isTablet ? 0.85 : 1))
    )
    const rSuffixSize = Math.max(
        14,
        Math.round(suffixSizeProp * (isMobile ? 0.7 : isTablet ? 0.85 : 1))
    )
    const rLabelSize = Math.max(
        10,
        Math.round(labelSize * (isMobile ? 0.85 : 1))
    )

    const initStyle = getAnimInit(animationType)

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "visible",
            }}
        >
            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor,
                    borderRadius,
                    display: "grid",
                    gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
                    boxSizing: "border-box",
                    fontFamily,
                    transition: "background-color 0.3s ease",
                    ...style,
                }}
            >
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        ref={(el) => (itemRefs.current[i] = el)}
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: itemGap,
                            padding: `${paddingY}px ${paddingX}px`,
                            opacity: isStatic ? 1 : 0,
                            transform: isStatic
                                ? "none"
                                : String(initStyle.transform ?? "none"),
                            filter: isStatic
                                ? "none"
                                : String(initStyle.filter ?? "none"),
                            transition: isStatic ? "none" : transitionStyle,
                            boxSizing: "border-box",
                            ...getDivider(i),
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: 2,
                            }}
                        >
                            <span
                                ref={(el) => (numberRefs.current[i] = el)}
                                style={{
                                    fontSize: rNumberSize,
                                    fontWeight: 500,
                                    color: numberColor,
                                    letterSpacing: -2,
                                    lineHeight: 1,
                                    fontVariantNumeric: "tabular-nums",
                                    fontFamily,
                                }}
                            >
                                {isStatic
                                    ? stat.number
                                    : stat.number.includes(".")
                                      ? "0.0"
                                      : "0"}
                            </span>
                            <span
                                style={{
                                    fontSize: rSuffixSize,
                                    fontWeight: 400,
                                    color: suffixColor,
                                    letterSpacing: -1,
                                    fontFamily,
                                }}
                            >
                                {stat.suffix}
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: rLabelSize,
                                color: labelColor,
                                letterSpacing: 1.5,
                                textTransform: "uppercase",
                                textAlign: "center",
                                fontFamily,
                            }}
                        >
                            {stat.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* ── Demo Panel ── */}
            {demoMode && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 12px)",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10,
                        background: "rgba(22,22,24,0.88)",
                        backdropFilter: "blur(28px)",
                        WebkitBackdropFilter: "blur(28px)",
                        borderRadius: 16,
                        padding: "10px 16px",
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 12,
                        rowGap: 8,
                        justifyContent: "center",
                        boxSizing: "border-box",
                        border: "1px solid rgba(255,255,255,0.07)",
                        boxShadow:
                            "0 8px 48px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
                        maxWidth: containerWidth - 32,
                        width: "max-content",
                        pointerEvents: "all",
                    }}
                >
                    <DemoToggle
                        label={demoState.theme === "dark" ? "Dark" : "Light"}
                        value={demoState.theme === "dark"}
                        onChange={(v) => setDemo("theme", v ? "dark" : "light")}
                    />
                    <DemoSegment
                        label="Animation"
                        value={demoState.animationType}
                        onChange={(v) => setDemo("animationType", v)}
                        options={[
                            { label: "Blur", value: "blur" },
                            { label: "Slide", value: "slide" },
                            { label: "Fade", value: "fade" },
                            { label: "Scale", value: "scale" },
                        ]}
                        compact
                    />
                    <DemoSlider
                        label="Number Size"
                        value={demoState.numberSize}
                        onChange={(v) => setDemo("numberSize", v)}
                        min={24}
                        max={96}
                        step={2}
                    />
                    <DemoSlider
                        label="Label Size"
                        value={demoState.labelSize}
                        onChange={(v) => setDemo("labelSize", v)}
                        min={10}
                        max={24}
                        step={1}
                    />
                    <DemoSlider
                        label="Gap"
                        value={demoState.itemGap}
                        onChange={(v) => setDemo("itemGap", v)}
                        min={0}
                        max={40}
                        step={2}
                    />
                    <DemoSlider
                        label="Radius"
                        value={demoState.borderRadius}
                        onChange={(v) => setDemo("borderRadius", v)}
                        min={0}
                        max={48}
                        step={2}
                    />
                </div>
            )}
        </div>
    )
}

addPropertyControls(AnimatedStats, {
    stats: {
        type: ControlType.Array,
        title: "Stats",
        control: {
            type: ControlType.Object,
            controls: {
                number: {
                    type: ControlType.String,
                    title: "Number",
                    defaultValue: "12",
                    placeholder: "e.g. 4.9",
                },
                suffix: {
                    type: ControlType.String,
                    title: "Suffix",
                    defaultValue: "M+",
                    placeholder: "e.g. %, K, M+",
                },
                label: {
                    type: ControlType.String,
                    title: "Label",
                    defaultValue: "Active users",
                    placeholder: "Subtitle",
                },
            },
        },
        defaultValue: [
            { number: "12", suffix: "M+", label: "Active users" },
            { number: "98", suffix: "%", label: "Satisfaction" },
            { number: "340", suffix: "K", label: "Projects built" },
            { number: "4.9", suffix: "★", label: "Average rating" },
        ],
        maxCount: 6,
    },
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
    },
    theme: {
        type: ControlType.Enum,
        title: "Theme",
        options: ["dark", "light"],
        optionTitles: ["Dark", "Light"],
        defaultValue: "dark",
        displaySegmentedControl: true,
        hidden: (props) => !!props.demoMode,
    },
    animationType: {
        type: ControlType.Enum,
        title: "Animation",
        options: ["blur", "slide", "fade", "scale"],
        optionTitles: ["Blur", "Slide", "Fade", "Scale"],
        defaultValue: "blur",
        hidden: (props) => !!props.demoMode,
    },
    layout: {
        type: ControlType.Enum,
        title: "Layout",
        options: ["1x4", "2x2", "4x1"],
        optionTitles: ["1 row 4 cols", "2 rows 2 cols", "4 rows 1 col"],
        defaultValue: "1x4",
        displaySegmentedControl: true,
        hidden: (props) => !!props.demoMode,
    },
    numberSize: {
        type: ControlType.Number,
        title: "Number Size",
        defaultValue: 48,
        min: 24,
        max: 120,
        step: 2,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    suffixSize: {
        type: ControlType.Number,
        title: "Suffix Size",
        defaultValue: 28,
        min: 14,
        max: 80,
        step: 2,
        displayStepper: true,
    },
    labelSize: {
        type: ControlType.Number,
        title: "Label Size",
        defaultValue: 13,
        min: 10,
        max: 32,
        step: 1,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    itemGap: {
        type: ControlType.Number,
        title: "Item Gap",
        defaultValue: 10,
        min: 0,
        max: 48,
        step: 2,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Radius",
        defaultValue: 20,
        min: 0,
        max: 60,
        step: 2,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    paddingX: {
        type: ControlType.Number,
        title: "Padding X",
        defaultValue: 16,
        min: 0,
        max: 80,
        step: 4,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    paddingY: {
        type: ControlType.Number,
        title: "Padding Y",
        defaultValue: 32,
        min: 0,
        max: 80,
        step: 4,
        displayStepper: true,
        hidden: (props) => !!props.demoMode,
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "inherit",
        placeholder: "e.g. Inter, Georgia, monospace",
    },
    replayOnReenter: {
        type: ControlType.Boolean,
        title: "Replay on Re-enter",
        defaultValue: false,
    },
    useCustomColors: {
        type: ControlType.Boolean,
        title: "Custom Colors",
        defaultValue: false,
        hidden: (props) => !!props.demoMode,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        hidden: (props) => !props.useCustomColors || !!props.demoMode,
    },
    numberColor: {
        type: ControlType.Color,
        title: "Number Color",
        hidden: (props) => !props.useCustomColors || !!props.demoMode,
    },
    suffixColor: {
        type: ControlType.Color,
        title: "Suffix Color",
        hidden: (props) => !props.useCustomColors || !!props.demoMode,
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label Color",
        hidden: (props) => !props.useCustomColors || !!props.demoMode,
    },
    dividerColor: {
        type: ControlType.Color,
        title: "Divider Color",
        hidden: (props) => !props.useCustomColors || !!props.demoMode,
    },
    animationDuration: {
        type: ControlType.Number,
        title: "Transition Duration",
        defaultValue: 2.0,
        min: 0.5,
        max: 5,
        step: 0.1,
        unit: "s",
    },
    countDuration: {
        type: ControlType.Number,
        title: "Count Duration",
        defaultValue: 2700,
        min: 500,
        max: 6000,
        step: 100,
        unit: "ms",
    },
    staggerDelay: {
        type: ControlType.Number,
        title: "Stagger Delay",
        defaultValue: 250,
        min: 0,
        max: 800,
        step: 50,
        unit: "ms",
    },
})

AnimatedStats.displayName = "AnimatedStatsPro"
