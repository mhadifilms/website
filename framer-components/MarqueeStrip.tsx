import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

export default function MarqueeStrip(props) {
    const {
        items,
        separator,
        speed,
        bgColor,
        textColor,
        fontSize,
        style,
    } = props

    const marqueeText = items.join(` ${separator} `) + ` ${separator} `

    return (
        <div
            style={{
                ...stripStyle,
                backgroundColor: bgColor,
                color: textColor,
                borderTop: `1px solid ${textColor}10`,
                borderBottom: `1px solid ${textColor}10`,
                ...style,
            }}
        >
            <motion.div
                style={{
                    display: "flex",
                    whiteSpace: "nowrap",
                }}
                animate={{ x: [0, -(marqueeText.length * fontSize * 0.5)] }}
                transition={{
                    x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: speed,
                        ease: "linear",
                    },
                }}
            >
                {[0, 1, 2, 3].map((copy) => (
                    <span
                        key={copy}
                        style={{
                            fontSize: fontSize,
                            fontWeight: 200,
                            letterSpacing: "-0.02em",
                            textTransform: "uppercase",
                            paddingRight: 20,
                            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                        }}
                    >
                        {marqueeText}
                    </span>
                ))}
            </motion.div>
        </div>
    )
}

MarqueeStrip.defaultProps = {
    items: ["Design", "Develop", "Create", "Inspire", "Build"],
    separator: "·",
    speed: 25,
    bgColor: "#0A0A0A",
    textColor: "#F5F0EB",
    fontSize: 48,
}

addPropertyControls(MarqueeStrip, {
    items: {
        type: ControlType.Array,
        title: "Items",
        maxCount: 10,
        control: { type: ControlType.String },
    },
    separator: { type: ControlType.String, title: "Separator" },
    speed: { type: ControlType.Number, title: "Speed (seconds)", min: 5, max: 60, step: 1 },
    fontSize: { type: ControlType.Number, title: "Font Size", min: 16, max: 120, step: 2 },
    bgColor: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text Color" },
})

const stripStyle: React.CSSProperties = {
    width: "100%",
    overflow: "hidden",
    padding: "32px 0",
}
