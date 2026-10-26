// Local stand-in for the "grok/canvas" module so the canvas runs as a normal web page.
import * as React from "react";
export { Fragment, useEffect, useRef, useState, useMemo, useCallback, useReducer, useLayoutEffect, useContext, createContext, memo, forwardRef, useId, useSyncExternalStore, useTransition, useDeferredValue, useImperativeHandle } from "react";
export type { CSSProperties, ChangeEvent, PointerEvent, KeyboardEvent, MouseEvent, ReactNode, FocusEvent, WheelEvent, TouchEvent, FormEvent, DragEvent, Dispatch, SetStateAction, RefObject, MutableRefObject } from "react";

// Exact Grok dark tokens (copied from the canvas runtime's grokPaletteDark / grokDataVizDark / grokType).
const sans = '-apple-system, BlinkMacSystemFont, system-ui, "Segoe UI", sans-serif';
const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
export const GROK_DARK_THEME = Object.freeze({
  kind: "dark" as const,
  bg: { base: "#070707", subtle: "#111111", elevated: "#181818" },
  text: { primary: "#fcfcfc", secondary: "#fcfcfc99", tertiary: "#fcfcfc66", onColor: "#fcfcfc", onPrimary: "#141414", accent: "#459ffe", success: "#38d591", warning: "#ffaf38", danger: "#ff5667", accentDeep: "#80befe", successDeep: "#78e2b4", warningDeep: "#ffc878", dangerDeep: "#ff8c98" },
  fill: { primary: "#fafafa", primaryHover: "#d5d5d5", secondary: "#7777772c", accent: "#1084fe", controlChecked: "#5a5a5a", accentSubtle: "#1084fe2c", successSubtle: "#00c9722c", warningSubtle: "#ff98002c", dangerSubtle: "#ff263c2c" },
  border: { subtle: "#fcfcfc0d", weak: "#fcfcfc1a", default: "#fcfcfc26", strong: "#fcfcfc4d", focus: "#fcfcfc66" },
  font: {
    family: sans, mono,
    heading1: { fontSize: "30px", lineHeight: "36px", letterSpacing: "-0.4px" },
    heading2: { fontSize: "24px", lineHeight: "30px", letterSpacing: "-0.25px" },
    heading3: { fontSize: "20px", lineHeight: "26px", letterSpacing: "-0.1px" },
    body1: { fontSize: "16px", lineHeight: "24px", letterSpacing: "0.1px" },
    subtext: { fontSize: "14px", lineHeight: "20px", letterSpacing: "0.1px" },
    table: { fontSize: "15px", lineHeight: "22px", letterSpacing: "0.1px" },
    metric: { fontSize: "24px", lineHeight: "30px", letterSpacing: "-0.25px" },
    body2: { fontSize: "13px", lineHeight: "18px", letterSpacing: "-0.08px" },
    label: { fontSize: "12px", lineHeight: "16px", letterSpacing: "0" },
    caption: { fontSize: "11px", lineHeight: "16px", letterSpacing: "0.055px" },
    code: { fontSize: "13px", lineHeight: "20px", letterSpacing: "0" },
  },
  weight: { regular: 400 as const, medium: 500 as const, semibold: 600 as const },
  radius: { sm: 4 as const, md: 8 as const, lg: 12 as const, xl: 16 as const, full: 9999 as const },
  dataviz: {
    categorical: ["#1084FE", "#FF9800", "#00BCA6"], other: "#777777", negative: "#FF263C", singleSeriesRest: "#084382",
    areaAlpha: "3D", bandAlpha: "40", blueTint: "#1084FE3D", blue5: "#80BEFE",
    sequential: ["#084382", "#0C64C1", "#1084FE", "#459FFE", "#80BEFE"],
    diverging: ["#FF5667", "#82131F", "#262626", "#084382", "#459FFE"],
  },
  chart: ["#fcfcfc", "#fcfcfc66", "#fcfcfc33", "#7777772c"] as const,
});
export type GrokTheme = typeof GROK_DARK_THEME;
export function useGrokTheme(): GrokTheme { return GROK_DARK_THEME; }

// Minimal kit components (only Page is used by Edisar today; the rest are simple fallbacks).
export function Page(props: { title: string; summary?: string; width?: "column" | "wide" | "full"; children?: React.ReactNode; sources?: readonly string[] }) {
  const max = props.width === "full" ? "none" : props.width === "wide" ? 1280 : 700;
  return <div className="grok-page" style={{ maxWidth: max, margin: "0 auto", padding: 12, boxSizing: "border-box", minHeight: "100%" }}>{props.children}</div>;
}
export function Section(props: { heading?: string; caption?: string; children?: React.ReactNode }) {
  return <section style={{ marginTop: 32 }}>{props.heading && <h2 style={{ ...GROK_DARK_THEME.font.heading3, margin: "0 0 8px" }}>{props.heading}</h2>}{props.children}{props.caption && <div style={{ color: GROK_DARK_THEME.text.tertiary, fontSize: 12 }}>{props.caption}</div>}</section>;
}
export function Text(props: { children?: React.ReactNode; tone?: string }) { return <p style={{ margin: "8px 0" }}>{props.children}</p>; }
export function Callout(props: { title?: string; children?: React.ReactNode }) {
  return <div style={{ background: GROK_DARK_THEME.fill.secondary, borderRadius: 8, padding: 12, margin: "8px 0" }}>{props.title && <b>{props.title}</b>}{props.children}</div>;
}
export function Divider() { return <hr style={{ border: 0, borderTop: `1px solid ${GROK_DARK_THEME.border.default}` }} />; }
