import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

export default function ContactSection(props) {
    const {
        heading,
        subtext,
        email,
        socialLinks,
        bgColor,
        textColor,
        accentColor,
        style,
    } = props

    return (
        <div
            style={{
                ...sectionStyle,
                backgroundColor: bgColor,
                color: textColor,
                ...style,
            }}
        >
            <div style={innerStyle}>
                <motion.div
                    style={{
                        width: "100%",
                        height: 1,
                        backgroundColor: textColor,
                        opacity: 0.1,
                        transformOrigin: "left",
                    }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                />

                <div style={contentStyle}>
                    {/* Label */}
                    <motion.p
                        style={labelStyle}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 0.4, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        Contact
                    </motion.p>

                    {/* Big heading */}
                    <motion.h2
                        style={{
                            fontSize: "clamp(36px, 6vw, 80px)",
                            fontWeight: 300,
                            letterSpacing: "-0.03em",
                            lineHeight: 1.1,
                            margin: "16px 0 0",
                            maxWidth: 900,
                        }}
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        {heading}
                    </motion.h2>

                    <motion.p
                        style={{
                            fontSize: 17,
                            lineHeight: 1.7,
                            opacity: 0.4,
                            fontWeight: 300,
                            maxWidth: 480,
                            margin: "24px 0 0",
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 0.4, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                    >
                        {subtext}
                    </motion.p>

                    {/* Email CTA */}
                    <motion.a
                        href={`mailto:${email}`}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 12,
                            fontSize: 16,
                            color: accentColor,
                            textDecoration: "none",
                            marginTop: 48,
                            padding: "16px 36px",
                            border: `1px solid ${accentColor}40`,
                            borderRadius: 100,
                            letterSpacing: "0.04em",
                            cursor: "pointer",
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        whileHover={{
                            backgroundColor: `${accentColor}10`,
                            scale: 1.02,
                        }}
                    >
                        {email}
                        <span style={{ fontSize: 20 }}>↗</span>
                    </motion.a>
                </div>

                {/* Bottom bar */}
                <div style={bottomStyle}>
                    {/* Social links */}
                    <motion.div
                        style={{ display: "flex", gap: 32 }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        {socialLinks.map((link, i) => (
                            <motion.a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: 13,
                                    color: textColor,
                                    textDecoration: "none",
                                    opacity: 0.4,
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                }}
                                whileHover={{ opacity: 1 }}
                            >
                                {link.label}
                            </motion.a>
                        ))}
                    </motion.div>

                    {/* Copyright */}
                    <motion.p
                        style={{
                            fontSize: 13,
                            opacity: 0.25,
                            margin: 0,
                            letterSpacing: "0.04em",
                        }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 0.25 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        © {new Date().getFullYear()} All rights reserved
                    </motion.p>
                </div>
            </div>
        </div>
    )
}

ContactSection.defaultProps = {
    heading: "Let's create something extraordinary together.",
    subtext: "Currently available for freelance projects and creative collaborations. Let's talk.",
    email: "hello@mhadi.tv",
    bgColor: "#0A0A0A",
    textColor: "#F5F0EB",
    accentColor: "#F5F0EB",
    socialLinks: [
        { label: "Twitter", url: "https://twitter.com" },
        { label: "LinkedIn", url: "https://linkedin.com" },
        { label: "Dribbble", url: "https://dribbble.com" },
        { label: "GitHub", url: "https://github.com" },
    ],
}

addPropertyControls(ContactSection, {
    heading: { type: ControlType.String, title: "Heading", displayTextArea: true },
    subtext: { type: ControlType.String, title: "Subtext", displayTextArea: true },
    email: { type: ControlType.String, title: "Email" },
    bgColor: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text Color" },
    accentColor: { type: ControlType.Color, title: "Accent" },
    socialLinks: {
        type: ControlType.Array,
        title: "Social Links",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                url: { type: ControlType.String, title: "URL" },
            },
        },
    },
})

const sectionStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "80vh",
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    padding: "80px 0",
}

const innerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 1400,
    padding: "0 60px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "70vh",
}

const contentStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "80px 0",
}

const labelStyle: React.CSSProperties = {
    fontSize: 13,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    margin: 0,
}

const bottomStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    borderTop: "1px solid rgba(245, 240, 235, 0.08)",
}
