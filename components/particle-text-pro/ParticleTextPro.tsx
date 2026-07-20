"use client";

import { useEffect, useRef, useCallback, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

// ── Types ──────────────────────────────────────────────────────

interface Particle {
    x: number
    y: number
    homeX: number
    homeY: number
    vx: number
    vy: number
    phase: number
}

interface LiveCfg {
    particleColor: string
    backgroundColor: string
    useGradient: boolean
    gradientColorTo: string
    gradientDirection: "horizontal" | "vertical" | "radial"
    particleSize: number
    interactionMode: "repel" | "attract" | "vortex" | "none"
    dispersionStrength: number
    dispersionRadius: number
    clickBurst: boolean
    burstStrength: number
    burstRadius: number
    returnSpeed: number
    friction: number
    idleOscillation: boolean
    oscillationAmp: number
    oscillationSpeed: number
    velocityColor: boolean
    velocityColorTo: string
    velocityThreshold: number
}

// ── Helpers ────────────────────────────────────────────────────

const VELOCITY_BUCKETS = 10

function parseRgb(color: string): [number, number, number] {
    if (color.startsWith("rgb")) {
        const m = color.match(/[\d.]+/g)
        if (m) return [+m[0], +m[1], +m[2]]
    }
    const h = color.replace("#", "")
    const f =
        h.length === 3
            ? h
                  .split("")
                  .map((c) => c + c)
                  .join("")
            : h.slice(0, 6)
    return [
        parseInt(f.slice(0, 2), 16),
        parseInt(f.slice(2, 4), 16),
        parseInt(f.slice(4, 6), 16),
    ]
}

function lerpColor(
    a: [number, number, number],
    b: [number, number, number],
    t: number
) {
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`
}

// ── Module-level style constants (not recreated every render) ──

const LABEL_STYLE: React.CSSProperties = {
    fontSize: 9,
    color: "rgba(255,255,255,0.38)",
    letterSpacing: "0.12em",
    fontFamily: "monospace",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
}

const SECTION_STYLE: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 7,
}

// ── ToggleSwitch ───────────────────────────────────────────────

function ToggleSwitch({
    value,
    onChange,
}: {
    value: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <div
            onClick={() => onChange(!value)}
            style={{
                width: 38,
                height: 22,
                borderRadius: 11,
                background: value
                    ? "rgba(135,255,227,0.85)"
                    : "rgba(255,255,255,0.12)",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s ease",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 3,
                    left: value ? 19 : 3,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    background: value ? "#000" : "rgba(255,255,255,0.85)",
                    transition: "left 0.18s ease",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                }}
            />
        </div>
    )
}

// ── Component ──────────────────────────────────────────────────

export default function ParticleTextProFX({
    text = "Loca",
    fontSize = 120,
    autoFit = false,
    fitPadding = 5,
    fontWeight = "700",
    fontFamily = "Inter, sans-serif",
    letterSpacing = 0,
    particleColor = "#87FFE3",
    backgroundColor = "#000000",
    useGradient = false,
    gradientColorTo = "#ff55ee",
    gradientDirection = "horizontal" as "horizontal" | "vertical" | "radial",
    particleSize = 1,
    particleDensity = 3,
    interactionMode = "repel" as "repel" | "attract" | "vortex" | "none",
    dispersionStrength = 50,
    dispersionRadius = 100,
    clickBurst = false,
    burstStrength = 200,
    burstRadius = 200,
    returnSpeed = 0.07,
    friction = 0.9,
    introAnimation = true,
    introStyle = "scatter" as "scatter" | "fall" | "rise",
    idleOscillation = false,
    oscillationAmp = 2,
    oscillationSpeed = 1,
    velocityColor = false,
    velocityColorTo = "#ffffff",
    velocityThreshold = 5,
    demoMode = false,
    style = {},
}: {
    text?: string
    fontSize?: number
    autoFit?: boolean
    fitPadding?: number
    fontWeight?: string
    fontFamily?: string
    letterSpacing?: number
    particleColor?: string
    backgroundColor?: string
    useGradient?: boolean
    gradientColorTo?: string
    gradientDirection?: "horizontal" | "vertical" | "radial"
    particleSize?: number
    particleDensity?: number
    interactionMode?: "repel" | "attract" | "vortex" | "none"
    dispersionStrength?: number
    dispersionRadius?: number
    clickBurst?: boolean
    burstStrength?: number
    burstRadius?: number
    returnSpeed?: number
    friction?: number
    introAnimation?: boolean
    introStyle?: "scatter" | "fall" | "rise"
    idleOscillation?: boolean
    oscillationAmp?: number
    oscillationSpeed?: number
    velocityColor?: boolean
    velocityColorTo?: string
    velocityThreshold?: number
    demoMode?: boolean
    style?: React.CSSProperties
}) {
    // ── Demo panel state ───────────────────────────────────────
    const [demoInteraction, setDemoInteraction] = useState<
        "repel" | "attract" | "vortex" | "none"
    >("repel")
    const [demoOscillation, setDemoOscillation] = useState(true)
    const [demoAutoFit, setDemoAutoFit] = useState(true)

    // ── Core refs ──────────────────────────────────────────────
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null) // cached context
    const particlesRef = useRef<Particle[]>([])
    const mouseRef = useRef({ x: -9999, y: -9999 })
    const clicksRef = useRef<{ x: number; y: number }[]>([])
    const rafRef = useRef(0)
    const forceIntroOnce = useRef(false)
    const initialBuilt = useRef(false)

    // Cache refs for expensive per-frame objects
    const gradCacheRef = useRef<{
        g: CanvasGradient
        color1: string
        color2: string
        dir: string
        w: number
        h: number
    } | null>(null)
    const vcCacheRef = useRef<{
        c1: string
        c2: string
        colors: string[]
    } | null>(null)

    // ── Resolved values (demo overrides props) ─────────────────
    const activeInteraction = demoMode ? demoInteraction : interactionMode
    const activeOscillation = demoMode ? demoOscillation : idleOscillation
    const activeAutoFit = demoMode ? demoAutoFit : autoFit

    // Update live ref — individual assignments avoid a new object every render
    const live = useRef<LiveCfg>({
        particleColor,
        backgroundColor,
        useGradient,
        gradientColorTo,
        gradientDirection,
        particleSize,
        interactionMode: activeInteraction,
        dispersionStrength,
        dispersionRadius,
        clickBurst,
        burstStrength,
        burstRadius,
        returnSpeed,
        friction,
        idleOscillation: activeOscillation,
        oscillationAmp,
        oscillationSpeed,
        velocityColor,
        velocityColorTo,
        velocityThreshold,
    })
    const lc = live.current
    lc.particleColor = particleColor
    lc.backgroundColor = backgroundColor
    lc.useGradient = useGradient
    lc.gradientColorTo = gradientColorTo
    lc.gradientDirection = gradientDirection
    lc.particleSize = particleSize
    lc.interactionMode = activeInteraction
    lc.dispersionStrength = dispersionStrength
    lc.dispersionRadius = dispersionRadius
    lc.clickBurst = clickBurst
    lc.burstStrength = burstStrength
    lc.burstRadius = burstRadius
    lc.returnSpeed = returnSpeed
    lc.friction = friction
    lc.idleOscillation = activeOscillation
    lc.oscillationAmp = oscillationAmp
    lc.oscillationSpeed = oscillationSpeed
    lc.velocityColor = velocityColor
    lc.velocityColorTo = velocityColorTo
    lc.velocityThreshold = velocityThreshold

    // ── Particle builder ───────────────────────────────────────
    const buildParticles = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const dpr = window.devicePixelRatio || 1
        const cw = canvas.offsetWidth
        const ch = canvas.offsetHeight
        if (!cw || !ch) return

        canvas.width = Math.round(cw * dpr)
        canvas.height = Math.round(ch * dpr)

        // Invalidate cached gradient/vc whenever canvas is rebuilt
        gradCacheRef.current = null
        vcCacheRef.current = null

        const off = document.createElement("canvas")
        off.width = cw
        off.height = ch
        const ctx = off.getContext("2d", { willReadFrequently: true })!

        ctx.letterSpacing = `${letterSpacing}px`
        let activeFontSize = fontSize
        if (activeAutoFit) {
            ctx.font = `${fontWeight} 100px ${fontFamily}`
            const w100 = ctx.measureText(text).width
            if (w100 > 0) {
                const padded = cw * (1 - (fitPadding * 2) / 100)
                activeFontSize = Math.min(
                    Math.floor((padded / w100) * 100),
                    Math.floor(ch * 0.85)
                )
            }
        }

        ctx.fillStyle = "#000"
        ctx.fillRect(0, 0, cw, ch)
        ctx.fillStyle = "#fff"
        ctx.font = `${fontWeight} ${activeFontSize}px ${fontFamily}`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(text, cw / 2, ch / 2)

        const { data } = ctx.getImageData(0, 0, cw, ch)
        const gap = Math.max(1, Math.round(particleDensity))
        const list: Particle[] = []

        // Intro plays only on first build (page load) or when force-triggered — not on every prop edit
        const doIntro =
            forceIntroOnce.current || (introAnimation && !initialBuilt.current)
        const resolvedStyle = forceIntroOnce.current ? "scatter" : introStyle
        forceIntroOnce.current = false

        for (let py = 0; py < ch; py += gap) {
            for (let px = 0; px < cw; px += gap) {
                if (data[(py * cw + px) * 4] > 128) {
                    let sx = px
                    let sy = py
                    if (doIntro) {
                        if (resolvedStyle === "scatter") {
                            sx = Math.random() * cw
                            sy = Math.random() * ch
                        } else if (resolvedStyle === "fall") {
                            sx = px + (Math.random() - 0.5) * cw * 0.2
                            sy = -ch * (0.2 + Math.random() * 0.8)
                        } else if (resolvedStyle === "rise") {
                            sx = px + (Math.random() - 0.5) * cw * 0.2
                            sy = ch + ch * (0.2 + Math.random() * 0.8)
                        }
                    }
                    list.push({
                        x: sx,
                        y: sy,
                        homeX: px,
                        homeY: py,
                        vx: 0,
                        vy: 0,
                        phase: Math.random() * Math.PI * 2,
                    })
                }
            }
        }

        particlesRef.current = list
        initialBuilt.current = true
    }, [
        text,
        fontSize,
        activeAutoFit,
        fitPadding,
        fontWeight,
        fontFamily,
        letterSpacing,
        particleDensity,
        introAnimation,
        introStyle,
    ])

    const handlePlayIntro = useCallback(() => {
        forceIntroOnce.current = true
        buildParticles()
    }, [buildParticles])

    // ── Animation loop — mounts once ───────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        ctxRef.current = canvas.getContext("2d") // cache context once
        let alive = true

        const tick = (ts: number) => {
            if (!alive) return
            const ctx = ctxRef.current
            if (!ctx) return

            const cfg = live.current
            const dpr = window.devicePixelRatio || 1
            const w = canvas.width
            const h = canvas.height
            const { x: mx, y: my } = mouseRef.current
            const pSize = cfg.particleSize * dpr
            const time = ts * 0.001
            const bursts = clicksRef.current.splice(0)

            ctx.fillStyle = cfg.backgroundColor
            ctx.fillRect(0, 0, w, h)

            // ── Gradient — cached, recreated only when inputs change ──
            const useVC = cfg.velocityColor
            const useGrad = cfg.useGradient && !useVC
            let gradFill: CanvasGradient | string = cfg.particleColor

            if (useGrad) {
                const gc = gradCacheRef.current
                if (
                    !gc ||
                    gc.color1 !== cfg.particleColor ||
                    gc.color2 !== cfg.gradientColorTo ||
                    gc.dir !== cfg.gradientDirection ||
                    gc.w !== w ||
                    gc.h !== h
                ) {
                    let g: CanvasGradient
                    if (cfg.gradientDirection === "vertical") {
                        g = ctx.createLinearGradient(0, 0, 0, h)
                    } else if (cfg.gradientDirection === "radial") {
                        g = ctx.createRadialGradient(
                            w / 2,
                            h / 2,
                            0,
                            w / 2,
                            h / 2,
                            Math.hypot(w, h) * 0.5
                        )
                    } else {
                        g = ctx.createLinearGradient(0, 0, w, 0)
                    }
                    g.addColorStop(0, cfg.particleColor)
                    g.addColorStop(1, cfg.gradientColorTo)
                    gradCacheRef.current = {
                        g,
                        color1: cfg.particleColor,
                        color2: cfg.gradientColorTo,
                        dir: cfg.gradientDirection,
                        w,
                        h,
                    }
                    gradFill = g
                } else {
                    gradFill = gc.g
                }
            }

            // ── Velocity color — bucket strings cached ─────────────
            let bucketColors: string[] = []
            if (useVC) {
                const cc = vcCacheRef.current
                if (
                    !cc ||
                    cc.c1 !== cfg.particleColor ||
                    cc.c2 !== cfg.velocityColorTo
                ) {
                    const rgb1 = parseRgb(cfg.particleColor)
                    const rgb2 = parseRgb(cfg.velocityColorTo)
                    const colors = Array.from(
                        { length: VELOCITY_BUCKETS },
                        (_, i) =>
                            lerpColor(rgb1, rgb2, i / (VELOCITY_BUCKETS - 1))
                    )
                    vcCacheRef.current = {
                        c1: cfg.particleColor,
                        c2: cfg.velocityColorTo,
                        colors,
                    }
                    bucketColors = colors
                } else {
                    bucketColors = cc.colors
                }
            }

            // ── Hoist invariants out of particle loop ───────────────
            const doInteraction = cfg.interactionMode !== "none"
            const hasBursts = bursts.length > 0
            const dispR2 = cfg.dispersionRadius * cfg.dispersionRadius
            const burstR2 = cfg.burstRadius * cfg.burstRadius

            // ── Path setup ──────────────────────────────────────────
            const buckets = useVC
                ? Array.from({ length: VELOCITY_BUCKETS }, () => new Path2D())
                : []
            const solidPath = useVC ? null : new Path2D()

            // ── Particle loop ───────────────────────────────────────
            for (const p of particlesRef.current) {
                if (doInteraction) {
                    const dx = mx - p.x
                    const dy = my - p.y
                    const d2 = dx * dx + dy * dy
                    if (d2 > 0 && d2 < dispR2) {
                        const d = Math.sqrt(d2)
                        const f =
                            (1 - d / cfg.dispersionRadius) *
                            cfg.dispersionStrength
                        if (cfg.interactionMode === "repel") {
                            p.vx -= (dx / d) * f
                            p.vy -= (dy / d) * f
                        } else if (cfg.interactionMode === "attract") {
                            p.vx += (dx / d) * f * 0.3
                            p.vy += (dy / d) * f * 0.3
                        } else {
                            p.vx -= (dy / d) * f * 0.5
                            p.vy += (dx / d) * f * 0.5
                        }
                    }
                }

                if (hasBursts) {
                    for (const { x: bx, y: by } of bursts) {
                        const dx = p.x - bx
                        const dy = p.y - by
                        const d2 = dx * dx + dy * dy
                        if (d2 > 0 && d2 < burstR2) {
                            const d = Math.sqrt(d2)
                            const f =
                                (1 - d / cfg.burstRadius) * cfg.burstStrength
                            p.vx += (dx / d) * f
                            p.vy += (dy / d) * f
                        }
                    }
                }

                const tx = cfg.idleOscillation
                    ? p.homeX +
                      Math.sin(time * cfg.oscillationSpeed + p.phase) *
                          cfg.oscillationAmp
                    : p.homeX
                const ty = cfg.idleOscillation
                    ? p.homeY +
                      Math.cos(time * cfg.oscillationSpeed * 0.7 + p.phase) *
                          cfg.oscillationAmp
                    : p.homeY

                p.vx += (tx - p.x) * cfg.returnSpeed
                p.vy += (ty - p.y) * cfg.returnSpeed
                p.vx *= cfg.friction
                p.vy *= cfg.friction
                p.x += p.vx
                p.y += p.vy

                const cx = p.x * dpr
                const cy = p.y * dpr
                if (useVC) {
                    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
                    const bi = Math.min(
                        VELOCITY_BUCKETS - 1,
                        Math.floor(
                            (speed / cfg.velocityThreshold) * VELOCITY_BUCKETS
                        )
                    )
                    buckets[bi].moveTo(cx + pSize, cy)
                    buckets[bi].arc(cx, cy, pSize, 0, Math.PI * 2)
                } else {
                    solidPath!.moveTo(cx + pSize, cy)
                    solidPath!.arc(cx, cy, pSize, 0, Math.PI * 2)
                }
            }

            // ── Render ──────────────────────────────────────────────
            if (useVC) {
                for (let i = 0; i < VELOCITY_BUCKETS; i++) {
                    ctx.fillStyle = bucketColors[i]
                    ctx.fill(buckets[i])
                }
            } else {
                ctx.fillStyle = gradFill
                ctx.fill(solidPath!)
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        rafRef.current = requestAnimationFrame(tick)
        return () => {
            alive = false
            cancelAnimationFrame(rafRef.current)
        }
    }, [])

    useEffect(() => {
        let id = 0
        document.fonts.ready.then(() => {
            id = requestAnimationFrame(() => buildParticles())
        })
        return () => cancelAnimationFrame(id)
    }, [buildParticles])

    // Debounced resize — avoids rebuilding on every pixel during window resize
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        let timer = 0
        const ro = new ResizeObserver(() => {
            clearTimeout(timer)
            timer = window.setTimeout(() => buildParticles(), 150)
        })
        ro.observe(canvas)
        return () => {
            ro.disconnect()
            clearTimeout(timer)
        }
    }, [buildParticles])

    // ── Render ─────────────────────────────────────────────────
    return (
        <div style={{ ...style, overflow: "hidden", position: "relative" }}>
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    cursor: "crosshair",
                    touchAction: "none",
                }}
                onPointerMove={(e) => {
                    const r = canvasRef.current!.getBoundingClientRect()
                    mouseRef.current = {
                        x: e.clientX - r.left,
                        y: e.clientY - r.top,
                    }
                }}
                onPointerLeave={() => {
                    mouseRef.current = { x: -9999, y: -9999 }
                }}
                onPointerUp={(e) => {
                    if (e.pointerType === "touch")
                        mouseRef.current = { x: -9999, y: -9999 }
                    if (live.current.clickBurst) {
                        const r = canvasRef.current!.getBoundingClientRect()
                        clicksRef.current.push({
                            x: e.clientX - r.left,
                            y: e.clientY - r.top,
                        })
                    }
                }}
            />

            {demoMode && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 20,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px 14px",
                        padding: "10px 16px",
                        maxWidth: "calc(100% - 32px)",
                        background: "rgba(8, 8, 8, 0.88)",
                        backdropFilter: "blur(18px)",
                        WebkitBackdropFilter: "blur(18px)",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.09)",
                        boxShadow: "0 6px 32px rgba(0,0,0,0.5)",
                        zIndex: 10,
                        userSelect: "none",
                        pointerEvents: "auto",
                    }}
                    onPointerEnter={() => {
                        mouseRef.current = { x: -9999, y: -9999 }
                    }}
                    onPointerMove={(e) => e.stopPropagation()}
                >
                    <div style={SECTION_STYLE}>
                        <span style={LABEL_STYLE}>Interaction</span>
                        <div style={{ display: "flex", gap: 3 }}>
                            {(
                                ["repel", "attract", "vortex", "none"] as const
                            ).map((mode, i) => {
                                const active = demoInteraction === mode
                                return (
                                    <button
                                        key={mode}
                                        onClick={() => setDemoInteraction(mode)}
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: 7,
                                            border: "none",
                                            cursor: "pointer",
                                            fontSize: 10,
                                            fontFamily: "monospace",
                                            fontWeight: active ? 700 : 400,
                                            letterSpacing: "0.05em",
                                            background: active
                                                ? "rgba(255,255,255,0.92)"
                                                : "rgba(255,255,255,0.08)",
                                            color: active
                                                ? "#000"
                                                : "rgba(255,255,255,0.55)",
                                            transition: "all 0.15s ease",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {["REP", "ATT", "VOR", "OFF"][i]}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div style={SECTION_STYLE}>
                        <span style={LABEL_STYLE}>Intro</span>
                        <button
                            onClick={handlePlayIntro}
                            style={{
                                padding: "4px 14px",
                                borderRadius: 7,
                                border: "none",
                                cursor: "pointer",
                                fontSize: 10,
                                fontFamily: "monospace",
                                fontWeight: 600,
                                letterSpacing: "0.08em",
                                background: "rgba(255,255,255,0.08)",
                                color: "rgba(255,255,255,0.75)",
                                transition: "background 0.15s ease",
                                whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                                ;(
                                    e.target as HTMLButtonElement
                                ).style.background = "rgba(255,255,255,0.16)"
                            }}
                            onMouseLeave={(e) => {
                                ;(
                                    e.target as HTMLButtonElement
                                ).style.background = "rgba(255,255,255,0.08)"
                            }}
                        >
                            ▶ PLAY
                        </button>
                    </div>

                    <div style={SECTION_STYLE}>
                        <span style={LABEL_STYLE}>Auto Fit</span>
                        <ToggleSwitch
                            value={demoAutoFit}
                            onChange={setDemoAutoFit}
                        />
                    </div>

                    <div style={SECTION_STYLE}>
                        <span style={LABEL_STYLE}>Oscillation</span>
                        <ToggleSwitch
                            value={demoOscillation}
                            onChange={setDemoOscillation}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Property Controls ──────────────────────────────────────────

addPropertyControls(ParticleTextProFX, {
    demoMode: {
        type: ControlType.Boolean,
        title: "Demo Mode",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    text: {
        type: ControlType.String,
        title: "Text",
        defaultValue: "Loca",
    },
    autoFit: {
        type: ControlType.Boolean,
        title: "Auto Fit",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    fitPadding: {
        type: ControlType.Number,
        title: "  ↳ Padding %",
        defaultValue: 5,
        min: 0,
        max: 30,
        step: 1,
        displayStepper: true,
        hidden: (props: any) => !props.autoFit,
    },
    fontSize: {
        type: ControlType.Number,
        title: "Font Size",
        defaultValue: 120,
        min: 10,
        max: 400,
        step: 2,
        displayStepper: true,
        hidden: (props: any) => props.autoFit,
    },
    fontWeight: {
        type: ControlType.Enum,
        title: "Font Weight",
        options: [
            "100",
            "200",
            "300",
            "400",
            "500",
            "600",
            "700",
            "800",
            "900",
        ],
        optionTitles: [
            "Thin",
            "ExtraLight",
            "Light",
            "Regular",
            "Medium",
            "SemiBold",
            "Bold",
            "ExtraBold",
            "Black",
        ],
        defaultValue: "700",
    },
    fontFamily: {
        type: ControlType.String,
        title: "Font Family",
        defaultValue: "Inter, sans-serif",
    },
    letterSpacing: {
        type: ControlType.Number,
        title: "Letter Spacing",
        defaultValue: 0,
        min: -20,
        max: 100,
        step: 1,
        displayStepper: true,
    },
    particleColor: {
        type: ControlType.Color,
        title: "Particle Color",
        defaultValue: "#87FFE3",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#000000",
    },
    useGradient: {
        type: ControlType.Boolean,
        title: "Gradient",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    gradientColorTo: {
        type: ControlType.Color,
        title: "  ↳ Color To",
        defaultValue: "#ff55ee",
        hidden: (props: any) => !props.useGradient,
    },
    gradientDirection: {
        type: ControlType.Enum,
        title: "  ↳ Direction",
        options: ["horizontal", "vertical", "radial"],
        optionTitles: ["Horizontal ↔", "Vertical ↕", "Radial ◎"],
        defaultValue: "horizontal",
        hidden: (props: any) => !props.useGradient,
    },
    particleSize: {
        type: ControlType.Number,
        title: "Particle Size",
        defaultValue: 1,
        min: 0.5,
        max: 8,
        step: 0.5,
        displayStepper: true,
    },
    particleDensity: {
        type: ControlType.Number,
        title: "Density (gap)",
        defaultValue: 3,
        min: 1,
        max: 15,
        step: 1,
        displayStepper: true,
    },
    interactionMode: {
        type: ControlType.Enum,
        title: "Interaction",
        options: ["repel", "attract", "vortex", "none"],
        optionTitles: ["Repel ↗", "Attract ↙", "Vortex ↻", "None"],
        defaultValue: "repel",
    },
    dispersionStrength: {
        type: ControlType.Number,
        title: "  ↳ Strength",
        defaultValue: 50,
        min: 5,
        max: 300,
        step: 5,
        displayStepper: true,
        hidden: (props: any) => props.interactionMode === "none",
    },
    dispersionRadius: {
        type: ControlType.Number,
        title: "  ↳ Radius",
        defaultValue: 100,
        min: 20,
        max: 500,
        step: 10,
        displayStepper: true,
        hidden: (props: any) => props.interactionMode === "none",
    },
    clickBurst: {
        type: ControlType.Boolean,
        title: "Click Burst",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    burstStrength: {
        type: ControlType.Number,
        title: "  ↳ Strength",
        defaultValue: 200,
        min: 10,
        max: 800,
        step: 10,
        displayStepper: true,
        hidden: (props: any) => !props.clickBurst,
    },
    burstRadius: {
        type: ControlType.Number,
        title: "  ↳ Radius",
        defaultValue: 200,
        min: 20,
        max: 800,
        step: 10,
        displayStepper: true,
        hidden: (props: any) => !props.clickBurst,
    },
    returnSpeed: {
        type: ControlType.Number,
        title: "Return Speed",
        defaultValue: 0.07,
        min: 0.01,
        max: 0.5,
        step: 0.01,
        displayStepper: true,
    },
    friction: {
        type: ControlType.Number,
        title: "Friction",
        defaultValue: 0.9,
        min: 0.5,
        max: 0.99,
        step: 0.01,
        displayStepper: true,
    },
    introAnimation: {
        type: ControlType.Boolean,
        title: "Intro Anim",
        defaultValue: true,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    introStyle: {
        type: ControlType.Enum,
        title: "  ↳ Style",
        options: ["scatter", "fall", "rise"],
        optionTitles: ["Scatter ✦", "Fall ↓", "Rise ↑"],
        defaultValue: "scatter",
        hidden: (props: any) => !props.introAnimation,
    },
    idleOscillation: {
        type: ControlType.Boolean,
        title: "Oscillation",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    oscillationAmp: {
        type: ControlType.Number,
        title: "  ↳ Amplitude",
        defaultValue: 2,
        min: 0.5,
        max: 20,
        step: 0.5,
        displayStepper: true,
        hidden: (props: any) => !props.idleOscillation,
    },
    oscillationSpeed: {
        type: ControlType.Number,
        title: "  ↳ Speed",
        defaultValue: 1,
        min: 0.1,
        max: 5,
        step: 0.1,
        displayStepper: true,
        hidden: (props: any) => !props.idleOscillation,
    },
    velocityColor: {
        type: ControlType.Boolean,
        title: "Velocity Color",
        defaultValue: false,
        enabledTitle: "On",
        disabledTitle: "Off",
    },
    velocityColorTo: {
        type: ControlType.Color,
        title: "  ↳ Color To",
        defaultValue: "#ffffff",
        hidden: (props: any) => !props.velocityColor,
    },
    velocityThreshold: {
        type: ControlType.Number,
        title: "  ↳ Threshold",
        defaultValue: 5,
        min: 1,
        max: 30,
        step: 0.5,
        displayStepper: true,
        hidden: (props: any) => !props.velocityColor,
    },
})
