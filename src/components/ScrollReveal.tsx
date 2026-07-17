/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  scaleOffset?: number;
  blurOffset?: string;
  className?: string;
}

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 0.6,
  yOffset = 24,
  scaleOffset = 0.97,
  blurOffset = '6px',
  className = ''
}: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, scale: scaleOffset, filter: `blur(${blurOffset})` }}
      whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.19, 1, 0.22, 1]
      }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}
