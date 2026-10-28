import type { LucideIcon } from "lucide-react";
import type { FC } from "react";
import * as MR from "../../../constants/motionRuntime.js";
import { MOTION_STYLES } from "../constants/motionStyles.js";
export const MotionRuleCard: FC<{ items?: string[]; label: string; emptyText: string; icon: LucideIcon; styles: { card: string; heading: string; content: string; empty: string } }> = ({ items, label, emptyText, icon: Icon, styles }) => (
  <div className={styles.card}>
    <div className={styles.heading}>
      <Icon className={MOTION_STYLES.W_3_5_H_3_5_SHRINK_0} />
      <span>{label}</span>
    </div>
    <p className={items?.length ? styles.content : styles.empty}>{items?.length ? items.join(MR.MOTION_TEXT_SYMBOL_41) : emptyText}</p>
  </div>
);
