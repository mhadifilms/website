import { addPropertyControls, ControlType } from "framer"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { useState, useRef } from "react"

function ProjectCard({ title, category, year, image, textColor, accentColor, index }) {
    const ref = useRef<HTMLDivElement>(null)
    const [hovered, setHovered] = useState(false)
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const rotateX = useTransform(mouseY, [-150, 150], [4, -4])
    const rotateY = useTransform(mouseX, [-150, 150], [-4, 4])

    function handleMouse(e: React.MouseEvent) {
        if (!ref.current) return
        const rect = ref.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left - rect.width / 2)
        mouseY.set(e.clientY - rect.top - rect.height / 2)
    }

    return (
        <motion.div
            ref={ref}
            style={{
                ...cardStyle,
                perspective: 800,
            }}
            onMouseMove={handleMouse}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => {
                setHovered(false)
                mouseX.set(0)
                mouseY.set(0)
            }}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        >
            <motion.div
                style={{
                    width: "100%",
                    aspectRatio: "4/3",
                    borderRadius: 8,
                    overflow: "hidden",
                    position: "relative",
                    backgroundColor: `${accentColor}10`,
                    rotateX: hovered ? rotateX : 0,
                    rotateY: hovered ? rotateY : 0,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                {image ? (
                    <motion.img
                        src={image}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                        }}
                        animate={{ scale: hovered ? 1.05 : 1 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 80,
                            fontWeight: 200,
                            opacity: 0.1,
                            color: textColor,
                        }}
                    >
                        {String(index + 1).padStart(2, "0")}
                    </div>
                )}

                {/* Hover overlay */}
                <motion.div
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.span
                        style={{
                            color: "#fff",
                            fontSize: 13,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            border: "1px solid rgba(255,255,255,0.4)",
                            padding: "10px 24px",
                            borderRadius: 100,
                        }}
                        animate={{ y: hovered ? 0 : 10 }}
                        transition={{ duration: 0.3 }}
                    >
                        View Project
                    </motion.span>
                </motion.div>
            </motion.div>

            {/* Project info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 20 }}>
                <div>
                    <h3
                        style={{
                            fontSize: 20,
                            fontWeight: 400,
                            margin: 0,
                            color: textColor,
                            letterSpacing: "-0.01em",
                        }}
                    >
                        {title}
                    </h3>
                    <p style={{ fontSize: 13, margin: "6px 0 0", opacity: 0.4, color: textColor }}>
                        {category}
                    </p>
                </div>
                <span style={{ fontSize: 13, opacity: 0.3, color: textColor, fontVariantNumeric: "tabular-nums" }}>
                    {year}
                </span>
            </div>
        </motion.div>
    )
}

export default function ProjectsGrid(props) {
    const {
        sectionTitle,
        sectionSubtitle,
        projects,
        bgColor,
        textColor,
        accentColor,
        columns,
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
                {/* Section header */}
                <motion.div
                    style={headerStyle}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div>
                        <p style={{ fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.4, margin: 0 }}>
                            {sectionSubtitle}
                        </p>
                        <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 300, letterSpacing: "-0.03em", margin: "8px 0 0" }}>
                            {sectionTitle}
                        </h2>
                    </div>
                </motion.div>

                <motion.div
                    style={{
                        width: "100%",
                        height: 1,
                        backgroundColor: textColor,
                        opacity: 0.1,
                        margin: "40px 0 60px",
                        transformOrigin: "left",
                    }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                />

                {/* Grid */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: 40,
                    }}
                >
                    {projects.map((project, i) => (
                        <ProjectCard
                            key={i}
                            index={i}
                            title={project.title}
                            category={project.category}
                            year={project.year}
                            image={project.image}
                            textColor={textColor}
                            accentColor={accentColor}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

ProjectsGrid.defaultProps = {
    sectionTitle: "Selected Work",
    sectionSubtitle: "Projects",
    columns: 2,
    bgColor: "#0A0A0A",
    textColor: "#F5F0EB",
    accentColor: "#F5F0EB",
    projects: [
        { title: "Brand Identity System", category: "Branding / Visual Design", year: "2025", image: "" },
        { title: "E-Commerce Platform", category: "UI/UX / Development", year: "2025", image: "" },
        { title: "Editorial Website", category: "Web Design / Motion", year: "2024", image: "" },
        { title: "Mobile Experience", category: "Product Design / iOS", year: "2024", image: "" },
    ],
}

addPropertyControls(ProjectsGrid, {
    sectionTitle: { type: ControlType.String, title: "Title" },
    sectionSubtitle: { type: ControlType.String, title: "Subtitle" },
    columns: { type: ControlType.Number, title: "Columns", min: 1, max: 4, step: 1 },
    bgColor: { type: ControlType.Color, title: "Background" },
    textColor: { type: ControlType.Color, title: "Text Color" },
    accentColor: { type: ControlType.Color, title: "Accent" },
    projects: {
        type: ControlType.Array,
        title: "Projects",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                category: { type: ControlType.String, title: "Category" },
                year: { type: ControlType.String, title: "Year" },
                image: { type: ControlType.Image, title: "Image" },
            },
        },
    },
})

const sectionStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    padding: "120px 0",
}

const innerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 1400,
    padding: "0 60px",
}

const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
}

const cardStyle: React.CSSProperties = {
    cursor: "pointer",
}
