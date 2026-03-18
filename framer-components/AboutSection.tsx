import { addPropertyControls, ControlType } from "framer"
import { motion } from "framer-motion"

export default function AboutSection(props) {
    const {
        heading,
        bio,
        services,
        profileImage,
        bgColor,
        textColor,
        accentColor,
        style,
    } = props

    const serviceList = services.split("\n").filter(Boolean)

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
                {/* Section label */}
                <motion.p
                    style={labelStyle}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    About
                </motion.p>

                <div style={gridStyle}>
                    {/* Left column - big heading + bio */}
                    <div style={{ flex: "1 1 55%" }}>
                        <motion.h2
                            style={{
                                fontSize: "clamp(28px, 4vw, 48px)",
                                fontWeight: 300,
                                letterSpacing: "-0.02em",
                                lineHeight: 1.3,
                                margin: 0,
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
                                lineHeight: 1.8,
                                opacity: 0.5,
                                fontWeight: 300,
                                maxWidth: 520,
                                margin: "32px 0 0",
                            }}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 0.5, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.15 }}
                        >
                            {bio}
                        </motion.p>

                        {/* Stats row */}
                        <motion.div
                            style={statsRowStyle}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        >
                            {[
                                { value: "5+", label: "Years Experience" },
                                { value: "40+", label: "Projects Delivered" },
                                { value: "15+", label: "Happy Clients" },
                            ].map((stat, i) => (
                                <div key={i} style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 300, color: accentColor }}>
                                        {stat.value}
                                    </div>
                                    <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.4, marginTop: 4 }}>
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right column - services + image */}
                    <div style={{ flex: "1 1 35%", display: "flex", flexDirection: "column", gap: 48 }}>
                        {/* Profile image */}
                        {profileImage && (
                            <motion.div
                                style={{
                                    width: "100%",
                                    aspectRatio: "3/4",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    backgroundColor: `${accentColor}10`,
                                }}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <img
                                    src={profileImage}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                            </motion.div>
                        )}

                        {/* Services */}
                        <div>
                            <motion.p
                                style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.4, margin: "0 0 24px" }}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 0.4 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                            >
                                Services
                            </motion.p>
                            {serviceList.map((service, i) => (
                                <motion.div
                                    key={i}
                                    style={{
                                        padding: "16px 0",
                                        borderBottom: `1px solid ${textColor}15`,
                                        fontSize: 16,
                                        fontWeight: 300,
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                    initial={{ opacity: 0, x: 20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.08 }}
                                >
                                    <span>{service}</span>
                                    <span style={{ fontSize: 18, opacity: 0.2 }}>→</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

AboutSection.defaultProps = {
    heading: "I design and build digital products that feel intentional, refined, and unmistakably human.",
    bio: "Based in the intersection of design and engineering, I work with brands and startups to create experiences that resonate. Every pixel, every interaction, every detail — crafted with purpose.",
    services: "Brand Identity\nUI/UX Design\nWeb Development\nMotion Design\nCreative Direction",
    profileImage: "",
    bgColor: "#0F0F0F",
    textColor: "#F5F0EB",
    accentColor: "#F5F0EB",
}

addPropertyControls(AboutSection, {
    heading: { type: ControlType.String, title: "Heading", displayTextArea: true },
    bio: { type: ControlType.String, title: "Bio", displayTextArea: true },
    services: { type: ControlType.String, title: "Services (one per line)", displayTextArea: true },
    profileImage: { type: ControlType.Image, title: "Profile Image" },
    bgColor: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text Color" },
    accentColor: { type: ControlType.Color, title: "Accent" },
})

const sectionStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    padding: "140px 0",
}

const innerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 1400,
    padding: "0 60px",
}

const labelStyle: React.CSSProperties = {
    fontSize: 13,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    opacity: 0.4,
    margin: "0 0 60px",
}

const gridStyle: React.CSSProperties = {
    display: "flex",
    gap: 80,
    flexWrap: "wrap",
}

const statsRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 48,
    marginTop: 56,
    paddingTop: 40,
    borderTop: "1px solid rgba(245, 240, 235, 0.1)",
}
