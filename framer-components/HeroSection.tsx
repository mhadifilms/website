import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
    }),
}

const lineReveal = {
    hidden: { scaleX: 0 },
    visible: {
        scaleX: 1,
        transition: { duration: 1.2, ease: [0.25, 0.1, 0.25, 1], delay: 0.6 },
    },
}

export default function HeroSection(props) {
    const {
        name,
        title,
        subtitle,
        scrollLabel,
        bgColor,
        textColor,
        accentColor,
        style,
    } = props

    return (
        <motion.div
            style={{
                ...containerStyle,
                backgroundColor: bgColor,
                color: textColor,
                ...style,
            }}
            initial="hidden"
            animate="visible"
        >
            <div style={innerStyle}>
                {/* Top bar */}
                <motion.div style={topBarStyle} custom={0} variants={fadeUp}>
                    <span style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5 }}>
                        Portfolio
                    </span>
                    <span style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5 }}>
                        © {new Date().getFullYear()}
                    </span>
                </motion.div>

                {/* Main content */}
                <div style={mainContentStyle}>
                    <motion.p
                        style={{
                            fontSize: 14,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            opacity: 0.4,
                            margin: 0,
                        }}
                        custom={1}
                        variants={fadeUp}
                    >
                        {subtitle}
                    </motion.p>

                    <motion.h1
                        style={{
                            fontSize: "clamp(48px, 10vw, 140px)",
                            fontWeight: 300,
                            letterSpacing: "-0.03em",
                            lineHeight: 0.95,
                            margin: "24px 0",
                        }}
                        custom={2}
                        variants={fadeUp}
                    >
                        {name}
                    </motion.h1>

                    <motion.div
                        style={{
                            width: "100%",
                            height: 1,
                            backgroundColor: textColor,
                            opacity: 0.15,
                            transformOrigin: "left",
                        }}
                        variants={lineReveal}
                    />

                    <motion.p
                        style={{
                            fontSize: "clamp(18px, 2.5vw, 28px)",
                            fontWeight: 300,
                            lineHeight: 1.5,
                            maxWidth: 600,
                            margin: "32px 0 0 0",
                            opacity: 0.6,
                        }}
                        custom={3}
                        variants={fadeUp}
                    >
                        {title}
                    </motion.p>
                </div>

                {/* Bottom scroll indicator */}
                <motion.div style={bottomBarStyle} custom={5} variants={fadeUp}>
                    <motion.div
                        style={{
                            width: 1,
                            height: 60,
                            backgroundColor: accentColor,
                        }}
                        animate={{ scaleY: [0, 1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <span
                        style={{
                            fontSize: 11,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            opacity: 0.4,
                            marginTop: 12,
                        }}
                    >
                        {scrollLabel}
                    </span>
                </motion.div>
            </div>
        </motion.div>
    )
}

HeroSection.defaultProps = {
    name: "Mhadi",
    title: "Designer & creative developer crafting digital experiences",
    subtitle: "Welcome",
    scrollLabel: "Scroll",
    bgColor: "#0A0A0A",
    textColor: "#F5F0EB",
    accentColor: "#F5F0EB",
}

addPropertyControls(HeroSection, {
    name: { type: ControlType.String, title: "Name" },
    title: { type: ControlType.String, title: "Title", displayTextArea: true },
    subtitle: { type: ControlType.String, title: "Subtitle" },
    scrollLabel: { type: ControlType.String, title: "Scroll Label" },
    bgColor: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text Color" },
    accentColor: { type: ControlType.Color, title: "Accent Color" },
})

// Styles
const containerStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
}

const innerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 1400,
    padding: "40px 60px",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    justifyContent: "center",
    position: "relative",
}

const topBarStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    position: "absolute",
    top: 40,
    left: 60,
    right: 60,
}

const mainContentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
}

const bottomBarStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 40,
    right: 60,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
}
