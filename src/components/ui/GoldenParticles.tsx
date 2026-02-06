"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export const GoldenParticles = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10 bg-transparent">
            {[...Array(25)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        opacity: 0,
                        x: Math.random() * 100 + "%",
                        y: Math.random() * 100 + "%"
                    }}
                    animate={{
                        opacity: [0, 0.4, 0],
                        y: ["-10%", "110%"],
                        x: [
                            (Math.random() * 100) + "%",
                            (Math.random() * 100 + (Math.random() > 0.5 ? 2 : -2)) + "%"
                        ]
                    }}
                    transition={{
                        duration: 20 + Math.random() * 30,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 10
                    }}
                    className="absolute w-1 h-1 bg-amber-500/20 rounded-full blur-[1px]"
                />
            ))}
        </div>
    );
};
